import winston from 'winston';
import { BaseContextLogger } from './base-context-logger';
import { printColoredMeta } from './internal';
import { ContextLoggingOptions } from './context-logging-options';

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
export function loggerFactory<TLogger extends BaseContextLogger<object>>({
	logClass,
	logLevel,
	logEnricher,
}: ContextLoggingOptions<TLogger>) {
	// Shared formatter to rename correlationId to trace.id when needed
	const timestamp = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' });
	const customEnricher = logEnricher ? [logEnricher()] : [];
	// Use beautiful console format for local development, JSON for production/k8s
	const format =
		process.env.VSCODE_INJECTION === '1'
			? winston.format.combine(
					winston.format.colorize(),
					timestamp,
					winston.format.errors({ stack: true }),
					...customEnricher,
					winston.format.printf(printColoredMeta),
				)
			: winston.format.combine(
					timestamp,
					...customEnricher,
					winston.format.json(),
				);

	const baseLogger = winston.createLogger({
		transports: [
			new winston.transports.Console({
				format,
				level: logLevel || process.env.LOG_LEVEL || 'info',
			}),
		],
	});

	return new logClass(baseLogger);
}
