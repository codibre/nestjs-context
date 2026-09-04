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

		expect(mockRecord).toHaveBeenCalledWith(12.5, {
			'messaging.system': 'aws_sqs',
			'messaging.destination.name': 'announcements',
			'messaging.operation.type': 'process',
			'messaging.operation.name': 'announcement-dispatch',
		});
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
