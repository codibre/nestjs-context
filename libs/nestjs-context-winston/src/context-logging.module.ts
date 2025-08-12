import { DynamicModule, Provider } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BaseContextLogger } from './base-context-logger';
import { loggerFactory } from './logger-factory';
import { ContextLoggerContextGuard } from './logger-context-guard';
import { RequestLoggerInterceptor } from './request-logger.interceptor';
import {
	ContextFilter,
	ContextLoggingOptions,
} from './context-logging-options';
import { ContextNestLogger } from './context-nest-logger';
import { contextFilters } from './context-filters-map';
import { getContextProxy } from './internal';

export interface ContextLoggingModuleInstance<
	TLogger extends BaseContextLogger<object> = BaseContextLogger<object>,
> extends DynamicModule {
	readonly nestLogger: ContextNestLogger;
	readonly logger: TLogger;

	/**
	 * Excludes a specific context filter condition from logging.
	 * @param excludedFilter Filter to be excluded.
	 */
	excludeFilter(excludedFilter: ContextFilter): void;
}

/**
 * NestJS dynamic module for configuring logging services.
 *
 * This module provides a convenient way to register custom logger classes
 * in the NestJS dependency injection container. It uses the logger factory
 * to create properly configured logger instances with New Relic integration.
 *
 * **Important**: This module automatically registers `ContextLoggerContextGuard` as a
 * global guard to ensure proper context management for all requests. No additional
 * configuration is required.
 *
 * @example
 * ```typescript
 * // Define a custom logger
 * interface UserLogMetadata {
 *   userId: string;
 *   operation: string;
 * }
 *
 * class UserLogger extends ContextLogger<UserLogMetadata> {
 *   logUserOperation(userId: string, operation: string, message: string) {
 *     this.info(message, { userId, operation });
 *   }
 * }
 *
 * // Import in your module - Guard is automatically registered globally
 * @Module({
 *   imports: [
 *     ContextLoggingModule.forRoot(UserLogger)
 *   ],
 *   // Logger is now available for injection, guard is active globally
 * })
 * export class AppModule {}
 *
 * // Inject in services
 * @Injectable()
 * export class UserService {
 *   constructor(private userLogger: UserLogger) {}
 *
 *   async createUser(userData: any) {
 *     this.userLogger.logUserOperation(
 *       userData.id,
 *       'create',
 *       'Creating new user'
 *     );
 *   }
 * }
 * ```
 *
 * @since 0.4.0
 */
export class ContextLoggingModule {
	/**
	 * Creates a dynamic module with the specified logger class.
	 *
	 * This method sets up a NestJS dynamic module that registers the provided
	 * logger class as both a provider and export. The logger will be created
	 * using the logger factory with proper Winston and New Relic configuration.
	 *
	 * **The `ContextLoggerContextGuard` is automatically registered as a global guard**
	 * to ensure proper request context management across all routes.
	 *
	 * @template TLogger - The type of logger class that extends ContextLogger
	 * @param logClass - Constructor function for the logger class to register
	 * @returns A NestJS dynamic module configuration
	 *
	 * @example
	 * ```typescript
	 * // Register multiple loggers - each will have the guard applied globally
	 * @Module({
	 *   imports: [
	 *     ContextLoggingModule.forRoot(UserLogger),
	 *     ContextLoggingModule.forRoot(OrderLogger),
	 *     ContextLoggingModule.forRoot(PaymentLogger)
	 *   ]
	 * })
	 * export class AppModule {}
	 * ```
	 */
	public static forRoot<TLogger extends BaseContextLogger<object>>(
		options: ContextLoggingOptions<TLogger>,
	): ContextLoggingModuleInstance<TLogger> {
		const { logClass } = options;
		const logger = loggerFactory(options);
		const nestLogger = new ContextNestLogger(logger);
		const clonedOptions = {
			...options,
		};
		return {
			module: ContextLoggingModule,
			nestLogger,
			logger,
			providers: [
				{
					provide: logClass,
					useValue: logger,
				},
				{
					provide: ContextNestLogger,
					useValue: nestLogger,
				},
				{
					// APP_GUARD automatically registers this guard globally across the entire application
					// No need to export - NestJS handles this automatically
					provide: APP_GUARD,
					useFactory: () =>
						new ContextLoggerContextGuard(logger, clonedOptions),
				},
				...((options.useLogInterceptor ?? true)
					? [
							{
								provide: APP_INTERCEPTOR,
								useFactory: () =>
									new RequestLoggerInterceptor(logger, clonedOptions),
							},
						]
					: []),
				...(options.contextData?.map(
					(cls): Provider => ({
						provide: cls,
						useValue: getContextProxy(cls),
					}),
				) ?? []),
			],
			exports: [logClass, ContextNestLogger, ...(options.contextData ?? [])],
			excludeFilter(excludedFilter: ContextFilter): void {
				const newFilter = contextFilters.exclude(excludedFilter);
				if (clonedOptions.contextFilter) {
					clonedOptions.contextFilter = contextFilters.and(newFilter);
				} else clonedOptions.contextFilter = newFilter;
			},
		};
	}
}
