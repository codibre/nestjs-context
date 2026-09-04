import { ExecutionContext } from '@nestjs/common';
import * as otel from '@opentelemetry/api';
import { getTransactionName } from './get-transaction-name';

type SqsMessageLike = {
	MessageId?: string;
	MessageAttributes?: Record<string, { StringValue?: string }>;
};

type KafkaMessageLike = {
	headers?: Record<string, Buffer | string | undefined>;
	offset?: string | number;
};

type RpcContextLike = {
	getTopic?: () => string;
	getPattern?: () => string;
	getMessage?: () => unknown;
	getChannelRef?: () => { fields?: { routingKey?: string } };
};

export type RpcMessagingMetadata = {
	system: string;
	destination: string;
	operationName: string;
	messageId?: string;
	propagationCarrier: Record<string, string>;
	spanKind: otel.SpanKind;
	recordMetric: boolean;
};

function extractSqsCarrier(message: SqsMessageLike): Record<string, string> {
	const carrier: Record<string, string> = {};
	for (const [key, value] of Object.entries(message.MessageAttributes ?? {})) {
		if (value.StringValue) {
			carrier[key.toLowerCase()] = value.StringValue;
		}
	}
	return carrier;
}

function extractKafkaCarrier(
	message: KafkaMessageLike | undefined,
): Record<string, string> {
	const carrier: Record<string, string> = {};
	for (const [key, value] of Object.entries(message?.headers ?? {})) {
		if (value === undefined) continue;
		carrier[key.toLowerCase()] = Buffer.isBuffer(value)
			? value.toString('utf8')
			: String(value);
	}
	return carrier;
}

function isSqsMessage(message: unknown): message is SqsMessageLike {
	return (
		typeof message === 'object' &&
		message !== null &&
		'MessageId' in message &&
		typeof (message as SqsMessageLike).MessageId === 'string'
	);
}

function buildGenericRpcMetadata(operationName: string): RpcMessagingMetadata {
	return {
		system: 'nestjs',
		destination: operationName,
		operationName,
		propagationCarrier: {},
		spanKind: otel.SpanKind.SERVER,
		recordMetric: false,
	};
}

/**
 * Resolves messaging semantic attributes for NestJS RPC/microservice handlers.
 *
 * Works across custom and built-in transports (SQS, Kafka, RabbitMQ, etc.)
 * by duck-typing `context.switchToRpc().getContext()`.
 */
export function resolveRpcMessagingMetadata(
	context: ExecutionContext,
): RpcMessagingMetadata | undefined {
	if (context.getType() !== 'rpc') return undefined;

	const operationName = getTransactionName(context);
	let rpcContext: RpcContextLike;
	try {
		rpcContext = context.switchToRpc().getContext();
	} catch {
		return buildGenericRpcMetadata(operationName);
	}

	if (typeof rpcContext.getTopic === 'function') {
		const message = rpcContext.getMessage?.() as KafkaMessageLike | undefined;
		return {
			system: 'kafka',
			destination: rpcContext.getTopic(),
			operationName,
			messageId:
				message?.offset === undefined ? undefined : String(message.offset),
			propagationCarrier: extractKafkaCarrier(message),
			spanKind: otel.SpanKind.CONSUMER,
			recordMetric: true,
		};
	}

	const message = rpcContext.getMessage?.();
	if (isSqsMessage(message)) {
		return {
			system: 'aws_sqs',
			destination: operationName,
			operationName,
			messageId: message.MessageId,
			propagationCarrier: extractSqsCarrier(message),
			spanKind: otel.SpanKind.CONSUMER,
			recordMetric: true,
		};
	}

	if (typeof rpcContext.getPattern === 'function') {
		const pattern = rpcContext.getPattern();
		const routingKey = rpcContext.getChannelRef?.()?.fields?.routingKey;
		return {
			system: 'rabbitmq',
			destination: routingKey ?? pattern,
			operationName,
			propagationCarrier: {},
			spanKind: otel.SpanKind.CONSUMER,
			recordMetric: true,
		};
	}

	return buildGenericRpcMetadata(operationName);
}
