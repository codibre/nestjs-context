import { ExecutionContext } from '@nestjs/common';
import { EventEmitter } from 'stream';
import {
	getTransactionName,
	InternalContext,
	otelInstrumentation,
} from './internal';

/**
 * Start a new OpenTelemetry span if one is not already active.
 * @param context ExecutionContext to use
 * @param internalContext The async local storage context
 * @param emitter Event emitter for monitoring
 * @param effectiveType When provided, overrides automatic type detection
 *   (e.g., 'rpc' when called from interceptor as fallback for non-HTTP transports)
 */
export function startOtelInstrumentationIfAbsent(
	context: ExecutionContext,
	internalContext: InternalContext,
	emitter: EventEmitter,
	effectiveType?: 'http' | 'rpc',
): void {
	// If a span is already active, don't create another one
	const existingTraceId = otelInstrumentation.getCurrentTransactionId();
	if (existingTraceId) return;

	let traceId: string | undefined;
	const transactionName = getTransactionName(context);

	try {
		traceId = otelInstrumentation.create(
			transactionName,
			context,
			effectiveType,
		);
	} catch (error) {
		emitter.emit('spanStartFailed', error);
		return;
	}

	if (!traceId) return;

	internalContext.customTransactionId = traceId;
	emitter.emit('spanStarted', traceId, context);
}
