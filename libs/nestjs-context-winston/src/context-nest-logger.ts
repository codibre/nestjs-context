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

	log(message: unknown, ...optionalParams: unknown[]) {
		this.logger.info(message as string, ...(optionalParams as [object?]));
	}

	error(message: unknown, ...optionalParams: unknown[]) {
		this.logger.error(message as string, ...(optionalParams as [object?]));
	}

	warn(message: unknown, ...optionalParams: unknown[]) {
		this.logger.warn(message as string, ...(optionalParams as [object?]));
	}

	// No debug method: BaseContextLogger does not guarantee a debug method
}
