import { BaseContextLogger } from 'src/base-context-logger';
import { ContextLoggingOptions } from 'src/context-logging-options';
import { startContext } from 'src/start-context';
import { getTransactionName } from './internal/get-transaction-name';
import { BaseLogMetadata } from 'src/base-log-metadata';
import { ExecutionContext } from '@nestjs/common';
import { RequestContext } from 'winston-context-logger';
import { createRoutePattern as createRoutePattern } from './internal';

const metaInfo = Symbol('routePattern');
interface MetaInfo {
	routePattern?: string;
}

function getMetaInfo(): MetaInfo | undefined {
	return RequestContext.currentContext
		? (RequestContext.currentContext.privateMeta[metaInfo] ??= {})
		: undefined;
}

export const getRoutePattern = () => getMetaInfo()?.routePattern;

/**
 * Start a new log context based on ExecutioContext if no context was set
 * @param context ExecutionContext to use
 * @param options LoggerOptions to use contextFilter
 * @param logger Logger if you want to start a responseTime counter
 * @returns true if contextFilter hasn't filtered out context
 */
export function startLogContextIfAbsent(
	context: ExecutionContext,
	options?: ContextLoggingOptions<BaseContextLogger<object>>,
	logger?: BaseContextLogger<BaseLogMetadata>,
) {
	if (options?.contextFilter && !options.contextFilter(context)) {
		return false; // Skip logging context setup if filter returns false
	}
	const correlationId = RequestContext.currentContext?.correlationId;
	if (correlationId && correlationId !== 'root') {
		if (
			RequestContext.currentContext?.routine ===
			'NestJsContextLoggerMiddleware.use'
		) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
			(RequestContext.currentContext as any).routine =
				getTransactionName(context);
		}
		return true;
	}
	// Get routine name from NestJS execution context first
	const transactionName = getTransactionName(context);

	// Try each provider until we get a trace ID
	const traceId = options?.getCorrelationId?.();
	startContext(transactionName, traceId);
	logger?.addDurationMeta('responseTime');
	if (context.getType() !== 'http') return true;
	const meta: MetaInfo | undefined = getMetaInfo();
	if (meta) meta.routePattern = createRoutePattern(context);
	return true;
}
