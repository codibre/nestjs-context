describe('getTraceId', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	it('should return undefined if both customTransactionId and newrelic.getTraceMetadata are undefined', () => {
		// Arrange
		jest.mock('../src/internal/internal-context', () => ({
			customNewrelicContext: { customTransactionId: undefined },
		}));
		jest.mock('newrelic', () => ({
			getTraceMetadata: jest.fn(() => undefined),
		}));
		const { getTraceId } = require('../src/get-trace-id');
		// Act
		const result = getTraceId();
		// Assert
		expect(result).toBeUndefined();
	});

	it('should return customTransactionId if present', () => {
		// Arrange
		jest.mock('../src/internal/internal-context', () => ({
			customNewrelicContext: { customTransactionId: 'custom-123' },
		}));
		jest.mock('newrelic', () => ({
			getTraceMetadata: jest.fn(() => ({ traceId: 'abc-123' })),
		}));
		const { getTraceId } = require('../src/get-trace-id');
		// Act
		const result = getTraceId();
		// Assert
		expect(result).toBe('custom-123');
	});

	it('should return traceId from newrelic if customTransactionId is undefined', () => {
		// Arrange
		jest.mock('../src/internal/internal-context', () => ({
			customNewrelicContext: { customTransactionId: undefined },
		}));
		jest.mock('newrelic', () => ({
			getTraceMetadata: jest.fn(() => ({ traceId: 'abc-123' })),
		}));
		const { getTraceId } = require('../src/get-trace-id');
		// Act
		const result = getTraceId();
		// Assert
		expect(result).toBe('abc-123');
	});
});
