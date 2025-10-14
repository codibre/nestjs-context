import { RequestContext } from 'winston-context-logger';

const logExecutionSymbol = Symbol('__contextLoggerInterceptorCalled');

export interface LogExecutionMeta {
	loggerInterceptorCalled?: boolean;
}

export function getLogExecutionMeta(): LogExecutionMeta | undefined {
	return RequestContext.currentContext?.privateMeta?.[logExecutionSymbol];
}
