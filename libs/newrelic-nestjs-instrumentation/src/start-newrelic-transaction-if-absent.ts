import { startUnhandledNewrelicTransaction } from 'src/start-unhandled-newrelic-transaction';
import { getTransactionName } from './internal/get-transaction-name';
import { ExecutionContext } from '@nestjs/common';
import { acceptNestjsDistributedTracingFactory } from 'src/accept-nestjs-distributed-tracing-factory';
import { newrelicInstrumentationEmitter } from './internal';

/**
 * Start a new New Relic transaction if one is not already active.
 * @param context ExecutionContext to use
 */
export function startNewrelicTransactionIfAbsent(context: ExecutionContext) {
	let transactionId: string | undefined;
	// Get routine name from NestJS execution context first
	const transactionName = getTransactionName(context);

	// Try to get transaction ID from New Relic if available
	try {
		const result = startUnhandledNewrelicTransaction(
			transactionName,
			'web',
			acceptNestjsDistributedTracingFactory(context),
		);
		transactionId = result.transactionId;
		newrelicInstrumentationEmitter.emit('transactionStarted', transactionId);
	} catch (error) {
		newrelicInstrumentationEmitter.emit(
			'transactionStartFailed',
			transactionId,
			error,
		);
	}
}
