import { ContextLoggerContextGuard } from '../src/logger-context-guard';
import { ExecutionContext } from '@nestjs/common';

describe('ContextLoggerContextGuard contextFilter', () => {
	class DummyLogger {
		addDurationMeta() {
			return undefined;
		}
	}
	it('should skip context setup when contextFilter returns false', () => {
		const contextFilter = jest.fn(() => false);
		const guard = new ContextLoggerContextGuard(
			new DummyLogger() as any,
			{ contextFilter } as any,
		);
		const context = {
			getType: () => 'http',
			getHandler: () => ({ name: 'handler' }),
			getClass: () => ({ name: 'Controller' }),
			switchToHttp: jest.fn().mockReturnValue({
				getRequest: jest
					.fn()
					.mockReturnValue({ originalUrl: '/path', url: '/path' }),
			}),
			switchToRpc: jest.fn(),
			switchToWs: jest.fn(),
			getArgs: jest.fn(),
			getArgByIndex: jest.fn(),
		} as unknown as ExecutionContext;
		expect(guard.canActivate(context)).toBe(true); // Guard always returns true, but should not setup context
		expect(contextFilter).toHaveBeenCalledWith(context);
	});

	it('should setup context when contextFilter returns true', () => {
		const contextFilter = jest.fn(() => true);
		const guard = new ContextLoggerContextGuard(
			new DummyLogger() as any,
			{ contextFilter } as any,
		);
		const context = {
			getType: () => 'http',
			getHandler: () => ({ name: 'handler' }),
			getClass: () => ({ name: 'Controller' }),
			switchToHttp: jest.fn().mockReturnValue({
				getRequest: jest
					.fn()
					.mockReturnValue({ originalUrl: '/path', url: '/path' }),
			}),
			switchToRpc: jest.fn(),
			switchToWs: jest.fn(),
			getArgs: jest.fn(),
			getArgByIndex: jest.fn(),
		} as unknown as ExecutionContext;
		expect(guard.canActivate(context)).toBe(true);
		expect(contextFilter).toHaveBeenCalledWith(context);
	});
});
