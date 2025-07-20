import { DynamicModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BaseContextLogger } from './base-context-logger';
import { loggerFactory } from './logger-factory';
import { ContextLoggerContextGuard } from './logger-context-guard';
import { RequestLoggerInterceptor } from './request-logger.interceptor';
import { ContextLoggingOptions } from './context-logging-options';
import { defaultErrorLevelCallback } from './internal';
import { ContextNestLogger } from './context-nest-logger';

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
	): DynamicModule {
		const { logClass } = options;
		return {
			module: ContextLoggingModule,
			providers: [
				{
					provide: logClass,
					useFactory: loggerFactory(options.logClass, options.logEnricher),
				},
				{
					provide: ContextNestLogger,
					useFactory: (logger: BaseContextLogger<object>) =>
						new ContextNestLogger(logger),
					inject: [logClass],
				},
				{
					// APP_GUARD automatically registers this guard globally across the entire application
					// No need to export - NestJS handles this automatically
					provide: APP_GUARD,
					useFactory: (logger) =>
						new ContextLoggerContextGuard(logger, options.getCorrelationId),
					inject: [logClass],
				},
				...((options.useLogInterceptor ?? true)
					? [
							{
								provide: APP_INTERCEPTOR,
								useFactory: (logger: BaseContextLogger<object>) =>
									new RequestLoggerInterceptor(
										logger,
										options.errorLevelCallback ?? defaultErrorLevelCallback,
									),
								inject: [logClass],
							},
						]
					: []),
			],
			exports: [logClass, ContextNestLogger],
		};
	}
}
