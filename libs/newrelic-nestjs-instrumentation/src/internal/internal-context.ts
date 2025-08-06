import { AsyncLocalStorage } from 'async_hooks';
import newrelic from 'newrelic';

const internalContext = new AsyncLocalStorage<{
	traceData?: newrelic.TraceMetadata;
	newTransaction?: newrelic.TransactionHandle;
}>();

export class InternalContext {
	/**
	 * Gets the current async local storage store, creating one if it doesn't exist.
	 * @returns The current store object
	 * @private
	 */
	private get store() {
		let store = internalContext.getStore();
		if (!store) internalContext.enterWith((store = {}));
		return store;
	}

	/**
	 * Gets the custom transaction ID from the current context.
	 * @returns The transaction ID if available, undefined otherwise
	 * @public
	 */
	public get customTransactionId(): string | undefined {
		return this.store.traceData?.traceId;
	}

	public setCustomTransaction(
		newTransaction: newrelic.TransactionHandle,
		traceData: newrelic.TraceMetadata,
	) {
		this.store.newTransaction = newTransaction;
		this.store.traceData = traceData;
	}

	public get transaction(): newrelic.TransactionHandle | undefined {
		return this.store.newTransaction;
	}
}

export const customNewrelicContext = new InternalContext();
