import winston from 'winston';
import { correlationToTraceIdFactory } from '../../src/internal/correlation-to-trace-id-factory';

describe('correlationToTraceIdFactory', () => {
	it('should rename correlationId to trace.id when correlationId exists and trace.id does not', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			level: 'info',
			message: 'Test message',
			correlationId: 'test-correlation-id',
			timestamp: '2023-01-01T00:00:00.000Z',
		};

		// Act
		const result = correlationToTraceIdFactory(info);

		// Assert
		expect(result['trace.id']).toBe('test-correlation-id');
		expect(result.correlationId).toBeUndefined();
		expect(result.level).toBe('info');
		expect(result.message).toBe('Test message');
	});

	it('should not modify info when correlationId does not exist', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			level: 'info',
			message: 'Test message',
			timestamp: '2023-01-01T00:00:00.000Z',
		};

		// Act
		const result = correlationToTraceIdFactory(info);

		// Assert
		expect(result['trace.id']).toBeUndefined();
		expect(result.correlationId).toBeUndefined();
		expect(result.level).toBe('info');
		expect(result.message).toBe('Test message');
	});

	it('should not modify info when trace.id already exists', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			level: 'info',
			message: 'Test message',
			correlationId: 'test-correlation-id',
			'trace.id': 'existing-trace-id',
			timestamp: '2023-01-01T00:00:00.000Z',
		};

		// Act
		const result = correlationToTraceIdFactory(info);

		// Assert
		expect(result['trace.id']).toBe('existing-trace-id');
		expect(result.correlationId).toBe('test-correlation-id');
		expect(result.level).toBe('info');
		expect(result.message).toBe('Test message');
	});

	it('should preserve all other properties', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			level: 'error',
			message: 'Error message',
			correlationId: 'test-correlation-id',
			timestamp: '2023-01-01T00:00:00.000Z',
			userId: 'user-123',
			requestId: 'req-456',
			error: new Error('Test error'),
		};

		// Act
		const result = correlationToTraceIdFactory(info);

		// Assert
		expect(result['trace.id']).toBe('test-correlation-id');
		expect(result.correlationId).toBeUndefined();
		expect(result.level).toBe('error');
		expect(result.message).toBe('Error message');
		expect(result.userId).toBe('user-123');
		expect(result.requestId).toBe('req-456');
		expect(result.error).toBeInstanceOf(Error);
	});

	it('should handle empty correlationId', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			level: 'info',
			message: 'Test message',
			correlationId: '',
			timestamp: '2023-01-01T00:00:00.000Z',
		};

		// Act
		const result = correlationToTraceIdFactory(info);

		// Assert
		// Empty string is falsy, so it won't be processed
		expect(result['trace.id']).toBeUndefined();
		expect(result.correlationId).toBe('');
	});

	it('should handle null correlationId', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			level: 'info',
			message: 'Test message',
			correlationId: null,
			timestamp: '2023-01-01T00:00:00.000Z',
		};

		// Act
		const result = correlationToTraceIdFactory(info);

		// Assert
		// null is falsy, so it won't be processed
		expect(result['trace.id']).toBeUndefined();
		expect(result.correlationId).toBeNull();
	});

	it('should handle truthy values correctly', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			level: 'info',
			message: 'Test message',
			correlationId: 'valid-id',
			timestamp: '2023-01-01T00:00:00.000Z',
		};

		// Act
		const result = correlationToTraceIdFactory(info);

		// Assert
		expect(result['trace.id']).toBe('valid-id');
		expect(result.correlationId).toBeUndefined();
	});
});
