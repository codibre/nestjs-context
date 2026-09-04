import * as otel from '@opentelemetry/api';
import {
	resolveRpcMessagingMetadata,
	type RpcMessagingMetadata,
} from '../../src/internal/resolve-rpc-messaging-metadata';
import { createMockExecutionContext } from '../test-utils';

const TRACE_PARENT = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';

const consumerDefaults: Pick<
	RpcMessagingMetadata,
	'spanKind' | 'recordMetric' | 'propagationCarrier'
> = {
	propagationCarrier: {},
	spanKind: otel.SpanKind.CONSUMER,
	recordMetric: true,
};

describe('resolveRpcMessagingMetadata', () => {
	it('returns undefined for HTTP contexts', () => {
		expect(
			resolveRpcMessagingMetadata(createMockExecutionContext('http')),
		).toBeUndefined();
	});

	it('falls back to generic Nest RPC metadata without metrics', () => {
		const context = createMockExecutionContext('rpc', {
			controller: 'RpcController',
			handler: 'rpcHandler',
		});

		expect(resolveRpcMessagingMetadata(context)).toEqual({
			system: 'nestjs',
			destination: 'RpcController.rpcHandler',
			operationName: 'RpcController.rpcHandler',
			propagationCarrier: {},
			spanKind: otel.SpanKind.SERVER,
			recordMetric: false,
		});
	});

	it.each([
		[
			'Kafka',
			'OrdersController',
			'handleOrder',
			{
				getTopic: () => 'orders.created',
				getMessage: () => ({
					offset: '42',
					headers: {
						traceparent: Buffer.from(TRACE_PARENT),
					},
				}),
			},
			{
				system: 'kafka',
				destination: 'orders.created',
				operationName: 'OrdersController.handleOrder',
				messageId: '42',
				propagationCarrier: { traceparent: TRACE_PARENT },
			},
		],
		[
			'SQS',
			'Announcements',
			'handleAnnouncement',
			{
				getMessage: () => ({
					MessageId: 'msg-123',
					MessageAttributes: {
						traceparent: { StringValue: TRACE_PARENT },
					},
				}),
			},
			{
				system: 'aws_sqs',
				destination: 'Announcements.handleAnnouncement',
				operationName: 'Announcements.handleAnnouncement',
				messageId: 'msg-123',
				propagationCarrier: { traceparent: TRACE_PARENT },
			},
		],
		[
			'RabbitMQ',
			'EventsController',
			'handleEvent',
			{
				getPattern: () => 'events.created',
				getChannelRef: () => ({ fields: { routingKey: 'events.created' } }),
			},
			{
				system: 'rabbitmq',
				destination: 'events.created',
				operationName: 'EventsController.handleEvent',
			},
		],
	] as const)(
		'resolves %s metadata from RPC contexts',
		(_label, controller, handler, rpcContext, expected) => {
			const context = createMockExecutionContext('rpc', {
				controller,
				handler,
			});
			jest
				.spyOn(context.switchToRpc(), 'getContext')
				.mockReturnValue(rpcContext);

			expect(resolveRpcMessagingMetadata(context)).toEqual({
				...consumerDefaults,
				...expected,
			});
		},
	);
});
