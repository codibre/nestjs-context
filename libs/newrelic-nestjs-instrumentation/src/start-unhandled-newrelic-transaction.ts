import newrelic from 'newrelic';
import {
	customNewrelicContext,
	getNewrelicContext,
	setNewrelicContext,
} from './internal';

export function startUnhandledNewrelicTransaction(
	transactionName: string,
	type: 'web' | 'background' = 'web',
	customCB?: (transaction: newrelic.TransactionHandle) => void,
): { transaction?: newrelic.TransactionHandle; transactionId?: string } {
	const transaction = newrelic.getTraceMetadata();
	let transactionId = transaction?.traceId;
	if (transactionId) return {};
	// If no trace ID, create a new transaction
	const startResult = newrelic[
		type === 'web' ? 'startWebTransaction' : 'startBackgroundTransaction'
	](transactionName, () => {
		const result = newrelic.getTransaction();
		customCB?.(result);
		return {
			traceData: newrelic.getTraceMetadata(),
			newTransaction: result,
			context: getNewrelicContext(),
		};
	});
	transactionId = startResult.traceData.traceId;
	if (transactionId) {
		setNewrelicContext(startResult.context);
		customNewrelicContext.setCustomTransaction(
			startResult.newTransaction,
			startResult.traceData,
		);
	}
	return {
		transaction: startResult.newTransaction,
		transactionId,
	};
}
