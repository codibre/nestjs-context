import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FastifyRequest, FastifyReply } from 'fastify';
import { performance } from 'perf_hooks';
import { getLogExecutionMeta, logHttpResponse } from './internal';
import { BaseContextLogger } from './base-context-logger';
import { ContextLoggingOptions } from './context-logging-options';

/**
 * Middleware that ensures logging at the end of HTTP requests ONLY if the interceptor was not executed.
 *
 * This middleware:
 * 1. Tracks the start time for response time measurement
 * 2. Only logs if the interceptor did NOT execute (checks loggerInterceptorCalled flag)
 * 3. Uses the same HTTP logging logic as the interceptor via logHttpResponse()
 *
 * The 'finish' event is always emitted when the response completes successfully,
 * so we can use 'once' instead of 'on' to avoid memory leaks.
 *
 * Note: This middleware only supports HTTP contexts. For RPC contexts, the interceptor
 * must be used as middleware does not support RPC.
 *
 * Important: The log context should be initialized by a guard (like LoggerContextGuard)
 * that runs before this middleware. This middleware only handles logging the response.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
	private static readonly REQUEST_LOG =
		process.env.AUTO_REQUEST_LOG !== 'false';

	constructor(
		private readonly logger: BaseContextLogger<object>,
		private readonly options: ContextLoggingOptions<BaseContextLogger<object>>,
	) {}

	use(
		req: Request | FastifyRequest,
		res: Response | FastifyReply,
		next: NextFunction,
	): void {
		const start = performance.now();

		// Handler to run at the end of the request
		const cleanup = () => {
			try {
				// Só executa se o interceptor NÃO rodou
				const ctx = getLogExecutionMeta();
				if (
					!ctx?.loggerInterceptorCalled &&
					RequestContextMiddleware.REQUEST_LOG
				) {
					// Use the same HTTP logging logic as the interceptor
					logHttpResponse(start, this.logger, this.options, req, res);
				}
			} catch (error) {
				this.logger.error(
					`Error in middleware logging: ${error && typeof error === 'object' && 'message' in error ? error.message : error}`,
				);
			}
		};

		// FastifyReply expõe o ServerResponse através de 'raw'
		// Express Response é diretamente um ServerResponse
		if ('raw' in res && typeof res.raw?.once === 'function') {
			res.raw.once('finish', cleanup);
		} else if ('once' in res && typeof res.once === 'function') {
			res.once('finish', cleanup);
		}

		next();
	}
}
