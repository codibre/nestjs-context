import { LoggerService } from '@nestjs/common';
import { BaseContextLogger } from './base-context-logger';

/**
 * LoggerService implementation that delegates to a BaseContextLogger instance.
 *
 * This allows you to use your contextual logger as the global NestJS logger by passing
 * an instance of ContextNestLogger to app.useLogger().
 */
export class ContextNestLogger implements LoggerService {
	constructor(private readonly logger: BaseContextLogger<object>) {}

	log(message: string, ...optionalParams: unknown[]) {
		this.logger.info(message, optionalParams);
	}

	error(message: string, ...optionalParams: unknown[]) {
		this.logger.error(message, optionalParams);
	}

	warn(message: string, ...optionalParams: unknown[]) {
		this.logger.warn(message, optionalParams);
	}

	// No debug method: BaseContextLogger does not guarantee a debug method
}
