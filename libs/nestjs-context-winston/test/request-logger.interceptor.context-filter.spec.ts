import { RequestLoggerInterceptor } from '../src/request-logger.interceptor';
import { BaseContextLogger } from '../src/base-context-logger';
import { ContextLoggingOptions } from '../src/context-logging-options';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('RequestLoggerInterceptor contextFilter', () => {
	class DummyLogger extends BaseContextLogger<object> {
		info() {
			return undefined;
		}
		warn() {
			return undefined;
		}
		error() {
			return undefined;
		}
		debug() {
			return undefined;
		}
	}

	function createWinstonMock(): Record<string, any> {
		return {
			log: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			child: jest.fn(() => createWinstonMock()),
			add: jest.fn(),
			remove: jest.fn(),
			close: jest.fn(),
			on: jest.fn(),
			once: jest.fn(),
			end: jest.fn(),
			write: jest.fn(),
			level: 'info',
			levels: {},
			silent: false,
			format: {},
			transports: [],
			exceptions: {},
			exitOnError: false,
		};
	}

	it('should skip logging when contextFilter returns false', (done) => {
		const dummyWinston = createWinstonMock();
		const logger = new DummyLogger(dummyWinston as any);
		const options: ContextLoggingOptions<any> = {
			logClass: DummyLogger,
			contextFilter: () => false,
		};
		const interceptor = new RequestLoggerInterceptor(logger, options);
		const context = {
			getType: () => 'http',
		} as ExecutionContext;
		const next: CallHandler = { handle: () => of('response') };
		const spy = jest.spyOn(logger, 'info');
		interceptor.intercept(context, next).subscribe((res) => {
			expect(res).toBe('response');
			expect(spy).not.toHaveBeenCalled();
			done();
		});
	});

	it('should log when contextFilter returns true', (done) => {
		const dummyWinston = createWinstonMock();
		const logger = new DummyLogger(dummyWinston as any);
		const options: ContextLoggingOptions<any> = {
			logClass: DummyLogger,
			contextFilter: () => true,
		};
		const interceptor = new RequestLoggerInterceptor(logger, options);
		const context = {
			getType: () => 'http',
			switchToHttp: () => ({
				getRequest: () => ({
					method: 'GET',
					url: '/test',
					protocol: 'http',
					httpVersionMajor: 1,
				}),
				getResponse: () => ({ statusCode: 200 }),
			}),
		} as any;
		const next: CallHandler = { handle: () => of('response') };
		const spy = jest.spyOn(logger, 'info');
		interceptor.intercept(context, next).subscribe((res) => {
			expect(res).toBe('response');
			expect(spy).toHaveBeenCalled();
			done();
		});
	});
});
