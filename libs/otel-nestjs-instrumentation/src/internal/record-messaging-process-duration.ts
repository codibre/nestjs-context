import { metrics, type Histogram } from '@opentelemetry/api';
import { tracerName } from './tracer-name';
import {
	type RpcMessagingMetadata,
	toMessagingSpanAttributes,
} from './resolve-rpc-messaging-metadata';

let processDurationHistogram: Histogram | undefined;

function getProcessDurationHistogram(): Histogram {
	processDurationHistogram ??= metrics
		.getMeter(tracerName)
		.createHistogram('messaging.process.duration', {
			description: 'Measures the duration of inbound messaging operations.',
			unit: 'ms',
		});
	return processDurationHistogram;
}

/** @internal Test-only reset for module-level meter instrument cache. */
export function __resetMessagingProcessDurationForTests(): void {
	processDurationHistogram = undefined;
}

export function recordMessagingProcessDuration(
	durationMs: number,
	metadata: RpcMessagingMetadata,
): void {
	if (!metadata.recordMetric) return;

	getProcessDurationHistogram().record(
		durationMs,
		toMessagingSpanAttributes(metadata),
	);
}
