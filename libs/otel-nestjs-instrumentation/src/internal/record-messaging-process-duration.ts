import { metrics, type Histogram } from '@opentelemetry/api';
import { tracerName } from './tracer-name';
import type { RpcMessagingMetadata } from './resolve-rpc-messaging-metadata';

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

	getProcessDurationHistogram().record(durationMs, {
		'messaging.system': metadata.system,
		'messaging.destination.name': metadata.destination,
		'messaging.operation.type': 'process',
		'messaging.operation.name': metadata.operationName,
	});
}
