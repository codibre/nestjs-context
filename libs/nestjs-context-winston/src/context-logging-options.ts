import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { BaseContextLogger } from './base-context-logger';
import { Logform } from 'winston';
import { LogLevel } from 'winston-context-logger';
import type { FastifyRequest } from 'fastify';
import type { Request } from 'express';

export type ContextFilter = (context: ExecutionContext) => boolean;

/**
 * Options for configuring the ContextLoggingModule and logger behavior.
 *
 * @template TLogger - The logger class type extending BaseContextLogger<object>.
 */
export interface ContextLoggingOptions<
	TLogger extends BaseContextLogger<object> = BaseContextLogger<object>,
> {
	statusCodeCallback?(err: unknown): number;
	/**
	 * The logger class to register and inject.
	 *
	 * Must extend BaseContextLogger, and its constructor must be contract-compatible
	 * with BaseContextLogger's constructor (i.e., accept the same parameters, or a subset, or none).
	 * This ensures the logger can be instantiated by the logger factory.
	 */
	logClass: new (
		...args: ConstructorParameters<typeof BaseContextLogger<object>>
	) => TLogger;

	/**
	 * Optional callback to determine the error log level based on the error object.
	 * This return will also define default log interceptor level used.
	 * * 4xx - will generate warning level
	 * * 5xx - will generate error level
	 * Defaults to returning HttpStatus.INTERNAL_SERVER_ERROR if not provided.
	 */
	errorLevelCallback?: (error: unknown) => HttpStatus;

	/**
	 * Optional function to extract a correlation ID for the current request context.
	 * If provided, will be used to set the correlationId in the logger context.
	 */
	getCorrelationId?: () => string | undefined;

	/**
	 * Optional custom Winston formatter to enrich all logs.
	 *
	 * This can be used to inject additional fields (such as trace/context information)
	 * into every log entry. For example, you can use the `@newrelic/log-enricher` package
	 * to automatically add New Relic trace and context fields to all logs:
	 *
	 * @example
	 * import { createEnricher } from '@newrelic/log-enricher';
	 * LoggingModule.forRoot({
	 *   logClass: AppLogger,
	 *   logEnricher: createEnricher(),
	 * });
	 *
	 * You may also use any other Winston format, such as `format.json()` or `format.combine()`.
	 */
	logEnricher?: Logform.FormatWrap;

	httpEnrich?: (req: FastifyRequest | Request) => Record<string, unknown>;

	/**
	 * Optional flag to disable the request logging interceptor.
	 * Enabled by default
	 */
	useLogInterceptor?: boolean;

	/**
	 * Optional log level for the logger.
	 * If not provided, the logger will use info by default.
	 * Accepted values are debug, info, warn and error
	 **/
	logLevel?: LogLevel;

	/**
	 * Optional function to filter the context for logging.
	 * @param context The execution context.
	 * @returns True if the context should be logged, false otherwise.
	 */
	contextFilter?: ContextFilter;

	/**
	 * Classes to be context storages.
	 * Every class pass here will be injectable
	 * and provide contextual data per request.
	 */
	contextData?: Array<new () => object>;
}
