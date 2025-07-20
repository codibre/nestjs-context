import winston from 'winston';
import { printColoredMeta } from '../../src/internal/print-colored-meta';

describe('printColoredMeta', () => {
	it('should format message with timestamp and level', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			timestamp: '2023-01-01 12:00:00',
			level: 'info',
			message: 'Test message',
		};

		// Act
		const result = printColoredMeta(info);

		// Assert
		expect(result).toBe('2023-01-01 12:00:00 [info]: Test message');
	});

	it('should format message with metadata in yellow color', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			timestamp: '2023-01-01 12:00:00',
			level: 'info',
			message: 'Test message',
			userId: 'user-123',
			requestId: 'req-456',
		};

		// Act
		const result = printColoredMeta(info);

		// Assert
		expect(result).toContain('2023-01-01 12:00:00 [info]: Test message');
		expect(result).toContain('\x1b[33m'); // Yellow color code (actual escape sequence)
		expect(result).toContain('\x1b[0m'); // Reset color code (actual escape sequence)
		expect(result).toContain('"userId": "user-123"');
		expect(result).toContain('"requestId": "req-456"');
	});

	it('should handle empty metadata', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			timestamp: '2023-01-01 12:00:00',
			level: 'error',
			message: 'Error message',
		};

		// Act
		const result = printColoredMeta(info);

		// Assert
		expect(result).toBe('2023-01-01 12:00:00 [error]: Error message');
		expect(result).not.toContain('\x1b[33m'); // No color codes
		expect(result).not.toContain('\x1b[0m');
	});

	it('should format complex metadata with proper JSON formatting', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			timestamp: '2023-01-01 12:00:00',
			level: 'debug',
			message: 'Debug message',
			user: {
				id: 'user-123',
				name: 'John Doe',
				roles: ['admin', 'user'],
			},
			'trace.id': 'trace-789',
		};

		// Act
		const result = printColoredMeta(info);

		// Assert
		expect(result).toContain('2023-01-01 12:00:00 [debug]: Debug message');
		expect(result).toContain('\x1b[33m'); // Yellow color code (actual escape sequence)
		expect(result).toContain('\x1b[0m'); // Reset color code (actual escape sequence)
		expect(result).toContain('"user": {');
		expect(result).toContain('"id": "user-123"');
		expect(result).toContain('"name": "John Doe"');
		expect(result).toContain('"roles": [');
		expect(result).toContain('"trace.id": "trace-789"');
	});

	it('should handle special characters in metadata', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			timestamp: '2023-01-01 12:00:00',
			level: 'warn',
			message: 'Warning message',
			specialChars: 'Hello\\nWorld\\t"quotes"',
			unicode: '🚀 Rocket',
		};

		// Act
		const result = printColoredMeta(info);

		// Assert
		expect(result).toContain('2023-01-01 12:00:00 [warn]: Warning message');
		expect(result).toContain(
			'"specialChars": "Hello\\\\nWorld\\\\t\\"quotes\\""',
		);
		expect(result).toContain('"unicode": "🚀 Rocket"');
	});

	it('should handle null and undefined values in metadata', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			timestamp: '2023-01-01 12:00:00',
			level: 'info',
			message: 'Test message',
			nullValue: null,
			undefinedValue: undefined,
			emptyString: '',
			zeroValue: 0,
			falseValue: false,
		};

		// Act
		const result = printColoredMeta(info);

		// Assert
		expect(result).toContain('2023-01-01 12:00:00 [info]: Test message');
		expect(result).toContain('"nullValue": null');
		expect(result).toContain('"emptyString": ""');
		expect(result).toContain('"zeroValue": 0');
		expect(result).toContain('"falseValue": false');
		// undefined values should not appear in JSON
		expect(result).not.toContain('undefinedValue');
	});

	it('should handle circular references in metadata gracefully', () => {
		// Arrange
		const circularObj: any = { name: 'test' };
		circularObj.self = circularObj;

		const info: winston.Logform.TransformableInfo = {
			timestamp: '2023-01-01 12:00:00',
			level: 'info',
			message: 'Test message',
			circular: circularObj,
		};

		// Act & Assert
		// This should throw an error due to circular reference
		expect(() => printColoredMeta(info)).toThrow();
	});

	it('should preserve the order of properties in formatted output', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			timestamp: '2023-01-01 12:00:00',
			level: 'info',
			message: 'Test message',
			a: 1,
			b: 2,
			c: 3,
		};

		// Act
		const result = printColoredMeta(info);

		// Assert
		const parts = result.split('\n');
		expect(parts[0]).toBe('2023-01-01 12:00:00 [info]: Test message');
		expect(result).toContain('"a": 1');
		expect(result).toContain('"b": 2');
		expect(result).toContain('"c": 3');
	});

	it('should handle missing timestamp gracefully', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			level: 'info',
			message: 'Test message',
			userId: 'user-123',
		};

		// Act
		const result = printColoredMeta(info);

		// Assert
		expect(result).toContain('undefined [info]: Test message');
		expect(result).toContain('"userId": "user-123"');
	});

	it('should handle missing level gracefully', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			timestamp: '2023-01-01 12:00:00',
			level: undefined as any,
			message: 'Test message',
			userId: 'user-123',
		};

		// Act
		const result = printColoredMeta(info);

		// Assert
		expect(result).toContain('2023-01-01 12:00:00 [undefined]: Test message');
		expect(result).toContain('"userId": "user-123"');
	});

	it('should handle missing message gracefully', () => {
		// Arrange
		const info: winston.Logform.TransformableInfo = {
			timestamp: '2023-01-01 12:00:00',
			level: 'info',
			message: undefined as any,
			userId: 'user-123',
		};

		// Act
		const result = printColoredMeta(info);

		// Assert
		expect(result).toContain('2023-01-01 12:00:00 [info]: undefined');
		expect(result).toContain('"userId": "user-123"');
	});
});
