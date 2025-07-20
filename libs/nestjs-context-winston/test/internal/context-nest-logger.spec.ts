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
		const spy = jest
			.spyOn<any, any>(contextLogger as any, 'transformParams')
			.mockReturnValue({ transformed: true });
		contextLogger.log('test message', { foo: 'bar' });
		expect(spy).toHaveBeenCalledWith([{ foo: 'bar' }]);
		expect(logger.info).toHaveBeenCalledWith('test message', {
			transformed: true,
		});
		spy.mockRestore();
	});

	it('should delegate error() to logger.error()', () => {
		const spy = jest
			.spyOn<any, any>(contextLogger as any, 'transformParams')
			.mockReturnValue({ transformed: 'err' });
		contextLogger.error('error message', { err: true });
		expect(spy).toHaveBeenCalledWith([{ err: true }]);
		expect(logger.error).toHaveBeenCalledWith('error message', {
			transformed: 'err',
		});
		spy.mockRestore();
	});

	it('should delegate warn() to logger.warn()', () => {
		const spy = jest
			.spyOn<any, any>(contextLogger as any, 'transformParams')
			.mockReturnValue({ transformed: 'warn' });
		contextLogger.warn('warn message', { warn: 1 });
		expect(spy).toHaveBeenCalledWith([{ warn: 1 }]);
		expect(logger.warn).toHaveBeenCalledWith('warn message', {
			transformed: 'warn',
		});
		spy.mockRestore();
	});

	describe('transformParams', () => {
		it('should merge objects and collect non-objects as context', () => {
			const params = [{ foo: 1 }, { bar: 2 }, 'baz', 42];
			const result1 = contextLogger['transformParams'](params);
			expect(result1).toEqual({ foo: 1, bar: 2, context: ['baz', 42] });
		});

		it('should return only merged objects if no non-objects', () => {
			const params = [{ a: 1 }, { b: 2 }];
			const result2 = contextLogger['transformParams'](params);
			expect(result2).toEqual({ a: 1, b: 2 });
		});

		it('should return only context if no objects', () => {
			const params = ['foo', 'bar'];
			const result3 = contextLogger['transformParams'](params);
			expect(result3).toEqual({ context: ['foo', 'bar'] });
		});

		it('should return empty object if params is empty', () => {
			const result4 = contextLogger['transformParams']([]);
			expect(result4).toEqual({});
		});
	});
});
