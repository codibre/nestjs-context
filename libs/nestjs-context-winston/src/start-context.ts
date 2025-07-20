import { RequestContext } from 'winston-context-logger';

/**
 * Starts a new request context.
 * @param name The name of the context.
 * @param traceId The trace ID for the context. If not provided, a new trace ID will be generated.
 */
export function startContext(name: string, traceId?: string): void {
	RequestContext.setContext(name, traceId);
}
