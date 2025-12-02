import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { performance } from 'perf_hooks';
import { BaseContextLogger } from '../base-context-logger';
import {
	ContextLoggingOptions,
	HttpRequest,
	HttpResponse,
} from '../context-logging-options';

const STATUS_RANGE = 100;
const OK_STATUS = 3;
const SERVER_ERROR_CATEGORY = 5;
const RESPONSE_TIME_DECIMALS = 1000;

const getStatusCodeFromError = (
	err: unknown,
	options: ContextLoggingOptions<BaseContextLogger<object>>,
): number =>
	options.statusCodeCallback
		? options.statusCodeCallback(err)
		: HttpStatus.INTERNAL_SERVER_ERROR;

function getStatusFamily(statusCode: number): number {
	return Math.floor(statusCode / STATUS_RANGE);
}

function getLogMethod(statusCategory: number): 'info' | 'warn' | 'error' {
	if (statusCategory <= OK_STATUS) return 'info';
	return statusCategory < SERVER_ERROR_CATEGORY ? 'warn' : 'error';
}

function logResponse(
	start: number,
	logger: BaseContextLogger<object>,
	type: string,
	path: string,
	protocol: string,
	status: string | number,
	logType: 'info' | 'warn' | 'error',
	error: unknown,
	metaInfo?: Record<string, unknown>,
): void {
	const requestData = `${type} ${path} ${protocol}`;
	let duration = performance.now() - start;
	duration =
		Math.round(duration * RESPONSE_TIME_DECIMALS) / RESPONSE_TIME_DECIMALS;
	const responseData = `${status} ${duration}ms`;

	const logFormat = `${requestData} ${responseData}`;
	logger[logType](logFormat, {
		requestPath: path,
		responseStatusCode: status,
		'@autoLog': 'nestjs-context-winston',
		errorMessage:
			error && typeof error === 'object' && 'message' in error
				? error.message
				: undefined,
		duration,
		...metaInfo,
	});
}

/**
 * Logs HTTP response for requests and responses
 * Used by both interceptor and middleware for HTTP contexts
 */
export function logHttpResponse(
	start: number,
	logger: BaseContextLogger<object>,
	options: ContextLoggingOptions<BaseContextLogger<object>>,
	request: HttpRequest,
	response: HttpResponse,
	error?: unknown,
): void {
	try {
		const statusCode = error
			? getStatusCodeFromError(error, options)
			: response.statusCode;
		const statusFamily = getStatusFamily(statusCode);
		const logType = getLogMethod(statusFamily);

		const req = request;
		const httpVersion =
			('httpVersionMajor' in req
				? req.httpVersionMajor
				: req.raw?.httpVersionMajor) ?? 'x';

		logResponse(
			start,
			logger,
			request.method,
			request.originalUrl,
			`${request.protocol.toUpperCase()}/${httpVersion}`,
			statusCode,
			logType,
			error,
			options.httpEnrich?.(request, response) ?? {},
		);
	} catch (err) {
		logger.warn('Error while logging response time!', {
			errorMessage: (err as Error).message,
		});
	}
}

/**
 * Logs RPC response for RPC contexts
 * Used by interceptor for RPC contexts
 */
export function logRpcResponse(
	start: number,
	logger: BaseContextLogger<object>,
	options: ContextLoggingOptions<BaseContextLogger<object>>,
	context: ExecutionContext,
	error?: unknown,
): void {
	try {
		const statusCode = error ? 1 : 0;
		const logType = error ? 'error' : 'info';

		logResponse(
			start,
			logger,
			context.getClass()?.name ?? 'RPC',
			context.getHandler()?.name ?? 'Call',
			'RPC',
			statusCode,
			logType,
			error,
			options.rpcEnrich?.(context) ?? {},
		);
	} catch (err) {
		logger.warn('Error while logging response time!', {
			errorMessage: (err as Error).message,
		});
	}
}
