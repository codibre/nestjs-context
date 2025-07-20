import winston from 'winston';
import { BaseContextLogger } from './base-context-logger';
import { correlationToTraceIdFactory, printColoredMeta } from './internal';

/**
 * Factory function that creates configured logger instances.
 *
 * This factory creates Winston logger instances with New Relic integration
 * and returns them wrapped in the specified ContextLogger class. The factory
 * sets up JSON formatting and console transport by default, enhanced with
 * New Relic metadata enrichment.
 *
 * @template TLogger - The type of logger class that extends ContextLogger
 * @param logClass - Constructor function for the logger class to instantiate
 * @returns A factory function that creates configured logger instances
 *
 * @example
 * ```typescript
 * // Define a custom logger class
 * interface AppLogMetadata {
 *   requestId: string;
 *   userId?: string;
 * }
 *
 * class AppLogger extends ContextLogger<AppLogMetadata> {
 *   logRequest(requestId: string, message: string) {
 *     this.info(message, { requestId });
 *   }
 * }
 *
 * // Create a factory for the logger
 * const createAppLogger = loggerFactory(AppLogger);
 *
 * // Use the factory to create logger instances
 * const logger = createAppLogger();
 * logger.logRequest('req-123', 'Processing request');
 *
 * // In NestJS provider
 * {
 *   provide: AppLogger,
 *   useFactory: loggerFactory(AppLogger)
 * }
 * ```
 *
 * @since 0.4.0
 */
export function loggerFactory<TLogger extends BaseContextLogger<object>>(
	logClass: new (
		...args: ConstructorParameters<typeof BaseContextLogger<object>>
	) => TLogger,
	customFormatter?: winston.Logform.FormatWrap,
) {
	/**
	 * Creates a configured logger instance.
	 *
	 * @returns A new instance of the specified logger class with Winston configuration
	 */
	return () => {
		// Shared formatter to rename correlationId to trace.id when needed
		const correlationIdToTraceId = winston.format(correlationToTraceIdFactory);
		// Use beautiful console format for local development, JSON for production/k8s
		const format =
			process.env.VSCODE_INJECTION === '1'
				? winston.format.combine(
						winston.format.colorize(),
						winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
						winston.format.errors({ stack: true }),
						correlationIdToTraceId(),
						winston.format.printf(printColoredMeta),
					)
				: winston.format.combine(
						...[
							winston.format.json(),
							correlationIdToTraceId(),
							...(customFormatter ? [customFormatter()] : []),
						],
					);

		const baseLogger = winston.createLogger({
			transports: [
				new winston.transports.Console({
					format,
					level: process.env.LOG_LEVEL || 'info',
				}),
			],
		});

		return new logClass(baseLogger);
	};
}
