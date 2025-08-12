import winston from 'winston';
import { ContextInfoProvider, ContextLogger } from 'winston-context-logger';

/**
 * Abstract base logger class with context support for Grupo Boticário applications.
 *
 * This class extends the ContextLogger from winston-context-logger to provide
 * context-aware logging capabilities. It maintains a reference to the underlying
 * Winston logger instance and provides type safety for logger metadata.
 *
 * @abstract
 * @template LoggerMetadata - Type definition for metadata that can be attached to log entries
 *
 * @example
 * ```typescript
 * interface UserLogMetadata {
 *   userId: string;
 *   operation: string;
 * }
 *
 * class UserLogger extends ContextLogger<UserLogMetadata> {
 *   logUserAction(userId: string, operation: string, message: string) {
 *     this.info(message, { userId, operation });
 *   }
 * }
 *
 * const logger = new UserLogger(winstonInstance);
 * logger.logUserAction('123', 'login', 'User logged in successfully');
 * ```
 *
 * @since 0.4.0
 */
export abstract class BaseContextLogger<
	LoggerMetadata extends object,
> extends ContextLogger<LoggerMetadata> {
	/**
	 * The underlying Winston logger instance.
	 * Provides direct access to Winston's functionality when needed.
	 *
	 * @readonly
	 * @type {winston.Logger}
	 */
	public readonly winstonLogger: winston.Logger;

	/**
	 * Creates a new ContextLogger instance.
	 *
	 * @param logger - A configured Winston logger instance
	 */
	constructor(logger: winston.Logger) {
		super(logger);
		this.winstonLogger = logger;
	}

	get metadata() {
		return (
			this['contextProvider'] as ContextInfoProvider<LoggerMetadata>
		).getContextInfo();
	}
}
