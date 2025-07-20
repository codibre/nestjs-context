import { ContextNestLogger } from '../../src/context-nest-logger';
import { BaseContextLogger } from '../../src/base-context-logger';

describe('ContextNestLogger', () => {
	let logger: BaseContextLogger<object>;
	let contextLogger: ContextNestLogger;

	beforeEach(() => {
		logger = {
			info: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
		} as any;
		contextLogger = new ContextNestLogger(logger);
	});

	it('should delegate log() to logger.info()', () => {
		contextLogger.log('test message', { foo: 'bar' });
		expect(logger.info).toHaveBeenCalledWith('test message', [{ foo: 'bar' }]);
	});

	it('should delegate error() to logger.error()', () => {
		contextLogger.error('error message', { err: true });
		expect(logger.error).toHaveBeenCalledWith('error message', [{ err: true }]);
	});

	it('should delegate warn() to logger.warn()', () => {
		contextLogger.warn('warn message', { warn: 1 });
		expect(logger.warn).toHaveBeenCalledWith('warn message', [{ warn: 1 }]);
	});
});
