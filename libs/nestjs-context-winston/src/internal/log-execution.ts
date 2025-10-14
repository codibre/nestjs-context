import { RequestContext } from 'winston-context-logger';

const logExecutionSymbol = Symbol('__contextLoggerInterceptorCalled');

export interface LogExecutionMeta {
	usingMiddleware?: boolean;
}

export function getLogExecutionMeta(): LogExecutionMeta | undefined {
	if (!RequestContext.currentContext) return undefined;
	const result = (RequestContext.currentContext.privateMeta[
		logExecutionSymbol
	] ??= {});
	return result;
}
