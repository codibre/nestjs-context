import * as otel from '@opentelemetry/api';
import { resolveRpcMessagingMetadata } from '../../src/internal/resolve-rpc-messaging-metadata';
import { createMockExecutionContext } from '../test-utils';

describe('resolveRpcMessagingMetadata', () => {
	it('returns undefined for HTTP contexts', () => {
		expect(
			resolveRpcMessagingMetadata(createMockExecutionContext('http')),
		).toBeUndefined();
	});

	it('resolves Kafka metadata from KafkaContext-like RPC contexts', () => {
		const context = createMockExecutionContext('rpc', {
			controller: 'OrdersController',
			handler: 'handleOrder',
		});
		jest.spyOn(context.switchToRpc(), 'getContext').mockReturnValue({
			getTopic: () => 'orders.created',
			getMessage: () => ({
				offset: '42',
				headers: {
					traceparent: Buffer.from(
						'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
					),
				},
			}),
		});

		expect(resolveRpcMessagingMetadata(context)).toEqual({
			system: 'kafka',
			destination: 'orders.created',
			operationName: 'OrdersController.handleOrder',
			messageId: '42',
			propagationCarrier: {
				traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
			},
			spanKind: otel.SpanKind.CONSUMER,
			recordMetric: true,
		});
	});

	it('resolves SQS metadata from message-shaped RPC contexts', () => {
		const context = createMockExecutionContext('rpc', {
			controller: 'Announcements',
			handler: 'handleAnnouncement',
		});
		jest.spyOn(context.switchToRpc(), 'getContext').mockReturnValue({
			getMessage: () => ({
				MessageId: 'msg-123',
				MessageAttributes: {
					traceparent: {
						StringValue:
							'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
					},
				},
			}),
		});

		expect(resolveRpcMessagingMetadata(context)).toEqual({
			system: 'aws_sqs',
			destination: 'Announcements.handleAnnouncement',
			operationName: 'Announcements.handleAnnouncement',
			messageId: 'msg-123',
			propagationCarrier: {
				traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
			},
			spanKind: otel.SpanKind.CONSUMER,
			recordMetric: true,
		});
	});

	it('resolves RabbitMQ metadata from pattern-based RPC contexts', () => {
		const context = createMockExecutionContext('rpc', {
			controller: 'EventsController',
			handler: 'handleEvent',
		});
		jest.spyOn(context.switchToRpc(), 'getContext').mockReturnValue({
			getPattern: () => 'events.created',
			getChannelRef: () => ({ fields: { routingKey: 'events.created' } }),
		});

		expect(resolveRpcMessagingMetadata(context)).toEqual({
			system: 'rabbitmq',
			destination: 'events.created',
			operationName: 'EventsController.handleEvent',
			propagationCarrier: {},
			spanKind: otel.SpanKind.CONSUMER,
			recordMetric: true,
		});
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
});
