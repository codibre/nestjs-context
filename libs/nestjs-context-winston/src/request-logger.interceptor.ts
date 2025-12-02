import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { performance } from 'perf_hooks';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Request, Response } from 'express';
import { BaseContextLogger } from './base-context-logger';
import { ContextLoggingOptions } from './context-logging-options';
import { startLogContextIfAbsent } from './start-log-context-if-absent';
import {
	getLogExecutionMeta,
	logHttpResponse,
	logRpcResponse,
} from './internal';

/**
 * NestJS interceptor that logs HTTP and RPC requests/responses with timing information.
 *
 * This interceptor provides the same functionality as BaseHttpRequestLoggerMiddleware
 * but using the interceptor pattern instead of middleware.
 *
 * @implements {NestInterceptor}
 */
@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
	private static readonly REQUEST_LOG =
		process.env.AUTO_REQUEST_LOG !== 'false'; // Default to true unless explicitly set to false
	constructor(
		private readonly logger: BaseContextLogger<object>,
		private readonly options: ContextLoggingOptions<BaseContextLogger<object>>,
	) {}

	/**
	 * Intercepts HTTP and RPC requests to log request/response information.
	 *
	 * @param context - The NestJS execution context
	 * @param next - The call handler for the next interceptor/handler in the chain
	 * @returns Observable that logs the request/response when complete
	 */
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		if (!startLogContextIfAbsent(context, this.options, this.logger)) {
			return next.handle();
		}
		const ctx = getLogExecutionMeta();
		if (ctx?.usingMiddleware) return next.handle();
		const start = performance.now();
		if (!RequestLoggerInterceptor.REQUEST_LOG) return next.handle();

		if (context.getType() === 'http') {
			const httpContext = context.switchToHttp();
			const request = httpContext.getRequest<FastifyRequest & Request>();
			const response = httpContext.getResponse<FastifyReply & Response>();

			return next.handle().pipe(
				tap({
					next: () =>
						logHttpResponse(
							start,
							this.logger,
							this.options,
							request,
							response,
						),
					error: (err) =>
						logHttpResponse(
							start,
							this.logger,
							this.options,
							request,
							response,
							err,
						),
				}),
			);
		}

		// RPC context
		return next.handle().pipe(
			tap({
				next: () => logRpcResponse(start, this.logger, this.options, context),
				error: (err) =>
					logRpcResponse(start, this.logger, this.options, context, err),
			}),
		);
	}
}
