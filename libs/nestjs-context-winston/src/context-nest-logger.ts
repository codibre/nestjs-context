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

	private transformParams(params: unknown[]): object {
		const result = {};
		const context: unknown[] = [];
		params.forEach((param) =>
			typeof param === 'object'
				? Object.assign(result, param)
				: context.push(param),
		);
		if (context.length > 0) Object.assign(result, { context });
		return result;
	}
	log(message: string, ...optionalParams: unknown[]) {
		this.logger.info(message, this.transformParams(optionalParams));
	}

	error(message: string, ...optionalParams: unknown[]) {
		this.logger.error(message, this.transformParams(optionalParams));
	}

	warn(message: string, ...optionalParams: unknown[]) {
		this.logger.warn(message, this.transformParams(optionalParams));
	}

	// No debug method: BaseContextLogger does not guarantee a debug method
}
