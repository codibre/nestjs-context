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

export function toMessagingSpanAttributes(
	metadata: RpcMessagingMetadata,
): Record<string, string> {
	const attributes: Record<string, string> = {
		'messaging.system': metadata.system,
		'messaging.destination.name': metadata.destination,
		'messaging.operation.type': 'process',
		'messaging.operation.name': metadata.operationName,
	};
	if (metadata.messageId) {
		attributes['messaging.message.id'] = metadata.messageId;
	}
	return attributes;
}

function buildConsumerMetadata(
	system: string,
	destination: string,
	operationName: string,
	extras?: Pick<RpcMessagingMetadata, 'messageId' | 'propagationCarrier'>,
): RpcMessagingMetadata {
	return {
		system,
		destination,
		operationName,
		messageId: extras?.messageId,
		propagationCarrier: extras?.propagationCarrier ?? {},
		spanKind: otel.SpanKind.CONSUMER,
		recordMetric: true,
	};
}

function normalizeCarrier(
	entries: Record<string, unknown>,
	resolveValue: (value: unknown) => string | undefined,
): Record<string, string> {
	const carrier: Record<string, string> = {};
	for (const [key, value] of Object.entries(entries)) {
		const normalized = resolveValue(value);
		if (normalized) {
			carrier[key.toLowerCase()] = normalized;
		}
	}
	return carrier;
}

function extractSqsCarrier(message: SqsMessageLike): Record<string, string> {
	return normalizeCarrier(message.MessageAttributes ?? {}, (value) => {
		if (
			typeof value === 'object' &&
			value !== null &&
			'StringValue' in value &&
			typeof (value as { StringValue?: string }).StringValue === 'string'
		) {
			return (value as { StringValue: string }).StringValue;
		}
		return undefined;
	});
}

function extractKafkaCarrier(
	message: KafkaMessageLike | undefined,
): Record<string, string> {
	return normalizeCarrier(message?.headers ?? {}, (value) => {
		if (value === undefined) return undefined;
		return Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
	});
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
		return buildConsumerMetadata(
			'kafka',
			rpcContext.getTopic(),
			operationName,
			{
				messageId:
					message?.offset === undefined ? undefined : String(message.offset),
				propagationCarrier: extractKafkaCarrier(message),
			},
		);
	}

	const message = rpcContext.getMessage?.();
	if (isSqsMessage(message)) {
		return buildConsumerMetadata('aws_sqs', operationName, operationName, {
			messageId: message.MessageId,
			propagationCarrier: extractSqsCarrier(message),
		});
	}

	if (typeof rpcContext.getPattern === 'function') {
		const pattern = rpcContext.getPattern();
		const routingKey = rpcContext.getChannelRef?.()?.fields?.routingKey;
		return buildConsumerMetadata(
			'rabbitmq',
			routingKey ?? pattern,
			operationName,
		);
	}

	return buildGenericRpcMetadata(operationName);
}
