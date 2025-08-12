import { BaseContextLogger } from '../src/base-context-logger';
import { createTestWinstonLogger, TestMetadata } from './test-utils';

// Test logger class
class TestLogger extends BaseContextLogger<TestMetadata> {}

describe(BaseContextLogger.name, () => {
	let logger: TestLogger;
	let winstonLogger: any;

	beforeEach(() => {
		winstonLogger = createTestWinstonLogger();
		logger = new TestLogger(winstonLogger);
	});

	describe('constructor', () => {
		it('should create logger instance with winston logger', () => {
			// Act is in beforeEach

			// Assert
			expect(logger).toBeInstanceOf(BaseContextLogger);
			expect(logger).toBeInstanceOf(TestLogger);
			expect(logger.winstonLogger).toBe(winstonLogger);
		});
	});

	describe('info', () => {
		it('should have info method', () => {
			// Act & Assert
			expect(typeof logger.info).toBe('function');
			expect(() => logger.info('test message')).not.toThrow();
		});

		it('should accept metadata in info method', () => {
			// Arrange
			const metadata: Partial<TestMetadata> = {
				userId: '123',
				operation: 'test',
			};

			// Act & Assert
			expect(() => logger.info('test message', metadata)).not.toThrow();
		});
	});

	describe('warn', () => {
		it('should have warn method', () => {
			// Act & Assert
			expect(typeof logger.warn).toBe('function');
			expect(() => logger.warn('test warning')).not.toThrow();
		});
	});

	describe('error', () => {
		it('should have error method', () => {
			// Act & Assert
			expect(typeof logger.error).toBe('function');
			expect(() => logger.error('test error')).not.toThrow();
		});
	});

	describe('debug', () => {
		it('should have debug method', () => {
			// Act & Assert
			expect(typeof logger.debug).toBe('function');
			expect(() => logger.debug('test debug')).not.toThrow();
		});
	});

	describe('addMeta', () => {
		it('should have addMeta method', () => {
			// Act & Assert
			expect(typeof logger.addMeta).toBe('function');
			expect(() => logger.addMeta('userId', '123')).not.toThrow();
		});
	});

	describe('addMetas', () => {
		it('should have addMetas method', () => {
			// Arrange
			const metadata: Partial<TestMetadata> = {
				userId: '123',
				operation: 'test',
			};

			// Act & Assert
			expect(typeof logger.addMetas).toBe('function');
			expect(() => logger.addMetas(metadata)).not.toThrow();
		});
	});

	describe('incMeta', () => {
		it('should have incMeta method', () => {
			// Act & Assert
			expect(typeof logger.incMeta).toBe('function');
			expect(() => logger.incMeta('count')).not.toThrow();
			expect(() => logger.incMeta('count', 5)).not.toThrow();
		});
	});

	describe('metadata', () => {
		it('should get metadata from context provider', () => {
			// Arrange
			const mockContextProvider = {
				getContextInfo: jest
					.fn()
					.mockReturnValue({ userId: '123', operation: 'test' }),
			};
			(logger as any)['contextProvider'] = mockContextProvider;

			// Act
			const metadata = logger.metadata;

			// Assert
			expect(mockContextProvider.getContextInfo).toHaveBeenCalled();
			expect(metadata).toEqual({ userId: '123', operation: 'test' });
		});
	});
});
