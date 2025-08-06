import {
	customNewrelicContext,
	InternalContext,
} from '../src/internal/internal-context';
import newrelic from 'newrelic';

describe('CustomNewrelicContext', () => {
	let context: InternalContext;
	let mockTransaction: newrelic.TransactionHandle;
	let mockTraceData: newrelic.TraceMetadata;

	beforeEach(() => {
		context = new InternalContext();
		mockTransaction = { end: jest.fn() } as any;
		mockTraceData = { traceId: 'trace-123' } as any;
	});

	it('should return undefined for customTransactionId if not set', () => {
		// Arrange // Act
		const id = context.customTransactionId;
		// Assert
		expect(id).toBeUndefined();
	});

	it('should set and get customTransactionId', () => {
		// Arrange
		context.setCustomTransaction(mockTransaction, mockTraceData);
		// Act
		const id = context.customTransactionId;
		// Assert
		expect(id).toBe('trace-123');
	});

	it('should set and get transaction', () => {
		// Arrange
		context.setCustomTransaction(mockTransaction, mockTraceData);
		// Act
		const tx = context.transaction;
		// Assert
		expect(tx).toBe(mockTransaction);
	});

	it('should update transaction and traceData', () => {
		// Arrange
		context.setCustomTransaction(mockTransaction, mockTraceData);
		const newTx = { end: jest.fn() } as any;
		const newTrace = { traceId: 'trace-456' } as any;
		// Act
		context.setCustomTransaction(newTx, newTrace);
		// Assert
		expect(context.transaction).toBe(newTx);
		expect(context.customTransactionId).toBe('trace-456');
	});
});

describe('customNewrelicContext singleton', () => {
	it('should be an instance of CustomNewrelicContext', () => {
		// Assert
		expect(customNewrelicContext).toBeInstanceOf(InternalContext);
	});
});
