const mockRecord = jest.fn();

jest.mock('@opentelemetry/api', () => ({
	metrics: {
		getMeter: jest.fn(() => ({
			createHistogram: jest.fn(() => ({ record: mockRecord })),
		})),
	},
}));

import {
	__resetMessagingProcessDurationForTests,
	recordMessagingProcessDuration,
} from '../../src/internal/record-messaging-process-duration';
import { toMessagingSpanAttributes } from '../../src/internal/resolve-rpc-messaging-metadata';

describe('recordMessagingProcessDuration', () => {
	beforeEach(() => {
		mockRecord.mockClear();
		__resetMessagingProcessDurationForTests();
	});

	it('records messaging.process.duration for messaging transports', () => {
		recordMessagingProcessDuration(12.5, {
			system: 'aws_sqs',
			destination: 'announcements',
			operationName: 'announcement-dispatch',
			propagationCarrier: {},
			spanKind: 4,
			recordMetric: true,
		});

		expect(mockRecord).toHaveBeenCalledWith(
			12.5,
			toMessagingSpanAttributes({
				system: 'aws_sqs',
				destination: 'announcements',
				operationName: 'announcement-dispatch',
				propagationCarrier: {},
				spanKind: 4,
				recordMetric: true,
			}),
		);
	});

	it('skips metrics for generic Nest RPC handlers', () => {
		recordMessagingProcessDuration(12.5, {
			system: 'nestjs',
			destination: 'RpcController.rpcHandler',
			operationName: 'RpcController.rpcHandler',
			propagationCarrier: {},
			spanKind: 1,
			recordMetric: false,
		});

		expect(mockRecord).not.toHaveBeenCalled();
	});
});
