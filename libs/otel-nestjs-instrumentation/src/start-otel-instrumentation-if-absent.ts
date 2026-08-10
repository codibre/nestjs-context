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
 */
export function startOtelInstrumentationIfAbsent(
	context: ExecutionContext,
	internalContext: InternalContext,
	emitter: EventEmitter,
): void {
	// If a span is already active, don't create another one
	const existingTraceId = otelInstrumentation.getCurrentTransactionId();
	if (existingTraceId) return;

	let traceId: string | undefined;
	const transactionName = getTransactionName(context);

	try {
		traceId = otelInstrumentation.create(transactionName, context);
	} catch (error) {
		emitter.emit('spanStartFailed', error);
		return;
	}

	if (!traceId) return;

	internalContext.customTransactionId = traceId;
	emitter.emit('spanStarted', traceId, context);
}
