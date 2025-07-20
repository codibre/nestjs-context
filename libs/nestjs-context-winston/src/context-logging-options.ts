import { HttpStatus } from '@nestjs/common';
import { BaseContextLogger } from './base-context-logger';
import { Logform } from 'winston';

/**
 * Options for configuring the ContextLoggingModule and logger behavior.
 *
 * @template TLogger - The logger class type extending BaseContextLogger<object>.
 */
export interface ContextLoggingOptions<
	TLogger extends BaseContextLogger<object>,
> {
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
}
