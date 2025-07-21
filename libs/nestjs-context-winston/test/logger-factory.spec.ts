const winstonMock = {
	createLogger: jest.fn().mockReturnValue('logger instance'),
	format: jest
		.fn()
		.mockReturnValue(jest.fn().mockReturnValue('mocked custom format')) as any,
	transports: {
		Console: jest.fn().mockReturnValue('Console transport'),
	},
};

const formatMocks = {
	colorize: jest.fn().mockReturnValue('mocked colorize format'),
	timestamp: jest.fn().mockReturnValue('mocked timestamp format'),
	errors: jest.fn().mockReturnValue('mocked errors format'),
	printf: jest.fn().mockReturnValue('mocked printf format'),
	json: jest.fn().mockReturnValue('mocked json format'),
	combine: jest.fn().mockReturnValue('mocked combined format'),
};

Object.entries(formatMocks).forEach(
	([name, fn]) => (winstonMock.format[name] = fn),
);

jest.mock('winston', () => ({
	...winstonMock,
	default: winstonMock,
}));

import { BaseContextLogger } from '../src/base-context-logger';
import { loggerFactory } from '../src/logger-factory';
import { TestMetadata } from './test-utils';
import { stubSuperConstructor } from 'jest-stub-super-constructor';

// Test logger class
class TestLogger extends BaseContextLogger<TestMetadata> {}

describe('loggerFactory', () => {
	let originalEnv: typeof process.env;

	beforeEach(() => {
		originalEnv = process.env;
		process.env = { ...originalEnv };
		stubSuperConstructor(BaseContextLogger);
		jest.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('function definition', () => {
		it('should be a function', () => {
			expect(typeof loggerFactory).toBe('function');
		});

		it('should return a factory function', () => {
			const logger = loggerFactory({ logClass: TestLogger });
			expect(logger).toBeInstanceOf(TestLogger);
		});
	});

	describe('logger creation', () => {
		it('should create logger instance with correct type', () => {
			// Arrange
			delete process.env.VSCODE_INJECTION;

			// Act
			const result = loggerFactory({ logClass: TestLogger });

			// Assert
			expect(result).toBeInstanceOf(BaseContextLogger);
			expect(result).toBeInstanceOf(TestLogger);
			expect(result.winstonLogger).toBeDefined();
		});

		it('should create winston logger with console transport', () => {
			// Arrange
			delete process.env.VSCODE_INJECTION;

			// Act
			loggerFactory({ logClass: TestLogger });

			// Assert
			expect(winstonMock.createLogger).toHaveBeenCalledWith({
				transports: [expect.any(Object)], // Console transport constructor
			});
			expect(winstonMock.transports.Console).toHaveBeenCalledWith({
				format: 'mocked combined format',
				level: process.env.LOG_LEVEL || 'info',
			});
		});
	});

	describe('format configuration', () => {
		describe('when VSCODE_INJECTION is "1" (development mode)', () => {
			beforeEach(() => {
				process.env.VSCODE_INJECTION = '1';
			});

			it('should use colorized format for development', () => {
				// Act
				loggerFactory({ logClass: TestLogger });

				// Assert
				expect(formatMocks.combine).toHaveBeenCalledWith(
					'mocked colorize format',
					'mocked timestamp format',
					'mocked errors format',
					'mocked custom format', // correlationIdToTraceId format
					'mocked printf format',
				);
				expect(formatMocks.colorize).toHaveBeenCalled();
				expect(formatMocks.timestamp).toHaveBeenCalledWith({
					format: 'YYYY-MM-DD HH:mm:ss',
				});
				expect(formatMocks.errors).toHaveBeenCalledWith({ stack: true });
				expect(formatMocks.printf).toHaveBeenCalled();
			});

			it('should not use JSON format in development mode', () => {
				// Act
				loggerFactory({ logClass: TestLogger });

				// Assert
				expect(formatMocks.json).not.toHaveBeenCalled();
			});
		});

		describe('when VSCODE_INJECTION is "2" (another development mode)', () => {
			beforeEach(() => {
				process.env.VSCODE_INJECTION = '2';
			});

			it('should use JSON format for production/non-VS Code environments', () => {
				// Act
				loggerFactory({
					logClass: TestLogger,
					logEnricher: () => 'custom format' as any,
				});

				// Assert
				expect(formatMocks.combine).toHaveBeenCalledWith(
					'mocked json format',
					'mocked custom format', // correlationIdToTraceId format
					'custom format',
				);
				expect(formatMocks.json).toHaveBeenCalled();
			});

			it('should not use colorized format when VSCODE_INJECTION is not "1"', () => {
				// Act
				loggerFactory({ logClass: TestLogger });

				// Assert
				expect(formatMocks.colorize).not.toHaveBeenCalled();
				expect(formatMocks.timestamp).not.toHaveBeenCalled();
				expect(formatMocks.errors).not.toHaveBeenCalled();
				expect(formatMocks.printf).not.toHaveBeenCalled();
			});
		});

		describe('when VSCODE_INJECTION is undefined (production mode)', () => {
			beforeEach(() => {
				delete process.env.VSCODE_INJECTION;
			});

			it('should use JSON format for production', () => {
				// Act
				loggerFactory({ logClass: TestLogger });

				// Assert
				expect(formatMocks.combine).toHaveBeenCalledWith(
					'mocked json format',
					'mocked custom format',
				);
				expect(formatMocks.json).toHaveBeenCalled();
			});
		});

		describe('when VSCODE_INJECTION is an empty string', () => {
			beforeEach(() => {
				process.env.VSCODE_INJECTION = '';
			});

			it('should use JSON format (falsy value)', () => {
				// Act
				loggerFactory({ logClass: TestLogger });

				// Assert
				expect(formatMocks.json).toHaveBeenCalled();
				expect(formatMocks.colorize).not.toHaveBeenCalled();
			});
		});

		describe('when VSCODE_INJECTION is "0"', () => {
			beforeEach(() => {
				process.env.VSCODE_INJECTION = '0';
			});

			it('should use JSON format (not "1")', () => {
				// Act
				loggerFactory({ logClass: TestLogger });

				// Assert
				expect(formatMocks.json).toHaveBeenCalled();
				expect(formatMocks.colorize).not.toHaveBeenCalled();
			});
		});
	});

	describe('correlationId transformation', () => {
		it('should include correlationIdToTraceId formatter in both modes', () => {
			// Test development mode
			process.env.VSCODE_INJECTION = '1';
			loggerFactory({ logClass: TestLogger });
			expect(winstonMock.format).toHaveBeenCalled();

			jest.clearAllMocks();

			// Test production mode
			delete process.env.VSCODE_INJECTION;
			loggerFactory({ logClass: TestLogger });
			expect(winstonMock.format).toHaveBeenCalled();
		});
	});

	describe('multiple logger instances', () => {
		it('should create independent logger instances', () => {
			// Arrange
			const options = { logClass: TestLogger };

			// Act
			const logger1 = loggerFactory(options);
			const logger2 = loggerFactory(options);

			// Assert
			expect(logger1).toBeInstanceOf(TestLogger);
			expect(logger2).toBeInstanceOf(TestLogger);
			expect(logger1).not.toBe(logger2);
			expect(winstonMock.createLogger).toHaveBeenCalledTimes(2);
		});
	});

	describe('different logger classes', () => {
		class AnotherTestLogger extends BaseContextLogger<{
			customField: string;
		}> {}

		it('should work with different logger class types', () => {
			// Act
			const options1 = { logClass: TestLogger };
			const options2 = { logClass: AnotherTestLogger };

			const testLogger = loggerFactory(options1);
			const anotherLogger = loggerFactory(options2);

			// Assert
			expect(testLogger).toBeInstanceOf(TestLogger);
			expect(anotherLogger).toBeInstanceOf(AnotherTestLogger);
			expect(testLogger).not.toBeInstanceOf(AnotherTestLogger);
			expect(anotherLogger).not.toBeInstanceOf(TestLogger);
		});
	});

	describe('LOG_LEVEL environment variable', () => {
		it('should use LOG_LEVEL when provided', () => {
			// Arrange
			process.env.LOG_LEVEL = 'debug';
			delete process.env.VSCODE_INJECTION;

			// Act
			loggerFactory({ logClass: TestLogger });

			// Assert
			expect(winstonMock.transports.Console).toHaveBeenCalledWith({
				format: 'mocked combined format',
				level: 'debug',
			});
		});

		it('should default to "info" when LOG_LEVEL is not set', () => {
			// Arrange
			delete process.env.LOG_LEVEL;
			delete process.env.VSCODE_INJECTION;

			// Act
			loggerFactory({ logClass: TestLogger });

			// Assert
			expect(winstonMock.transports.Console).toHaveBeenCalledWith({
				format: 'mocked combined format',
				level: 'info',
			});
		});

		it('should use LOG_LEVEL even in development mode', () => {
			// Arrange
			process.env.VSCODE_INJECTION = '1';
			process.env.LOG_LEVEL = 'warn';

			// Act
			loggerFactory({ logClass: TestLogger });

			// Assert
			expect(winstonMock.transports.Console).toHaveBeenCalledWith({
				format: 'mocked combined format',
				level: 'warn',
			});
		});

		it('should handle empty LOG_LEVEL as info', () => {
			// Arrange
			process.env.LOG_LEVEL = '';
			delete process.env.VSCODE_INJECTION;

			// Act
			loggerFactory({ logClass: TestLogger });

			// Assert
			expect(winstonMock.transports.Console).toHaveBeenCalledWith({
				format: 'mocked combined format',
				level: 'info',
			});
		});

		it('should accept different log levels', () => {
			const logLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

			logLevels.forEach((level) => {
				// Arrange
				process.env.LOG_LEVEL = level;
				delete process.env.VSCODE_INJECTION;
				jest.clearAllMocks();

				// Act
				loggerFactory({ logClass: TestLogger });

				// Assert
				expect(winstonMock.transports.Console).toHaveBeenCalledWith({
					format: 'mocked combined format',
					level,
				});
			});
		});
	});
});
