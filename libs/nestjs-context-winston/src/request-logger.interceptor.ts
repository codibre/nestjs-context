import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { performance } from 'perf_hooks';
import { BaseContextLogger } from './base-context-logger';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Request, Response } from 'express';

export const STATUS_RANGE = 100;
export const OK_STATUS = 3;
export const SERVER_ERROR_CATEGORY = 5;

/**
 * NestJS interceptor that logs HTTP requests and responses with timing information.
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
		private readonly statusCodeCallback: (error: unknown) => number,
	) {}

	/**
	 * Intercepts HTTP requests to log request/response information.
	 *
	 * @param context - The NestJS execution context
	 * @param next - The call handler for the next interceptor/handler in the chain
	 * @returns Observable that logs the request/response when complete
	 */ intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<unknown> {
		const start = performance.now();
		let logResponse: (error: unknown, res: unknown) => void;
		if (!RequestLoggerInterceptor.REQUEST_LOG) return next.handle();
		if (context.getType() === 'http') {
			const httpContext = context.switchToHttp();
			const request = httpContext.getRequest<FastifyRequest & Request>();
			const response = httpContext.getResponse<FastifyReply & Response>();
			logResponse = (err) => {
				const statusCode = err
					? this.statusCodeCallback(err)
					: response.statusCode;
				return this.logResponse(
					start,
					request.method,
					request.url,
					`${request.protocol.toUpperCase()}/${request.httpVersionMajor ?? request.raw?.httpVersionMajor ?? 'x'}`,
					statusCode,
					this.getMethod(Math.floor(statusCode / STATUS_RANGE)),
					err,
				);
			};
		} else {
			logResponse = (err) =>
				this.logResponse(
					start,
					context.getClass()?.name ?? 'RPC',
					context.getHandler()?.name ?? 'Call',
					'RPC',
					err ? 1 : 0, // RPC responses don't have status codes like HTTP
					err ? 'error' : 'info', // Default log level for RPC
					err,
				);
		}
		return next.handle().pipe(
			tap({
				next: (v) => logResponse(null, v),
				error: (v) => logResponse(v, null),
			}),
		);
	}

	/**
	 * Logs the HTTP request and response information.
	 *
	 * @param start - The start time of the request
	 * @param req - The HTTP request object
	 * @param res - The HTTP response object
	 * @private
	 */
	private logResponse(
		start: number,
		type: string,
		path: string,
		protocol: string,
		status: string | number,
		logType: 'info' | 'warn' | 'error',
		error: unknown,
	): void {
		try {
			const requestData = `${type} ${path} ${protocol}`;
			const responseTime = performance.now() - start;
			const responseData = `${status} ${responseTime}ms`;

			const logFormat = `${requestData} ${responseData}`;
			this.logger[logType](logFormat, {
				requestPath: path,
				responseStatusCode: status,
				errorMessage:
					error && typeof error === 'object' && 'message' in error
						? error.message
						: undefined,
			});
		} catch (err) {
			this.logger.warn('Error while logging response time!', {
				errorMessage: (err as Error).message,
			});
		}
	}

	/**
	 * Determines the appropriate log method based on HTTP status code.
	 *
	 * @param statusCategory - The status code category (status code / 100)
	 * @returns The log method name ('info', 'warn', or 'error')
	 * @private
	 */
	private getMethod(statusCategory: number): 'info' | 'warn' | 'error' {
		if (statusCategory <= OK_STATUS) return 'info';
		return statusCategory < SERVER_ERROR_CATEGORY ? 'warn' : 'error';
	}
}
