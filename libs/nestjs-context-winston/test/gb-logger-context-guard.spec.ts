// Mock winston context logger
const mockRequestContext = {
	setContext: jest.fn(),
	currentContext: {
		correlationId: 'root' as string | undefined,
		routine: undefined as string | undefined,
		privateMeta: {},
	},
};
jest.mock('winston-context-logger', () => ({
	...jest.requireActual('winston-context-logger'),
	RequestContext: mockRequestContext,
}));

import { ExecutionContext } from '@nestjs/common';
import { BaseContextLogger } from '../src/base-context-logger';
import { BaseLogMetadata } from '../src/base-log-metadata';
import { createMockExecutionContext } from './test-utils';
import { ContextLoggerContextGuard } from '../src/logger-context-guard';
import * as getTransactionNameLib from '../src/internal/get-transaction-name';
import { ContextLoggingOptions } from 'src';

describe(ContextLoggerContextGuard.name, () => {
	let target: ContextLoggerContextGuard;
	let mockExecutionContext: ExecutionContext;
	let logger: BaseContextLogger<BaseLogMetadata>;
	let getCorrelationId: jest.Mock<string | undefined>;

	beforeEach(() => {
		logger = {
			addDurationMeta: jest.fn(),
			warn: jest.fn(),
		} as any;
		mockExecutionContext = createMockExecutionContext();
		getCorrelationId = jest.fn();
		target = new ContextLoggerContextGuard(logger, {
			getCorrelationId,
		} as any);
	});

	describe('canActivate', () => {
		it('should set context with correlationId if provided', async () => {
			getCorrelationId.mockReturnValue('corr-id-123');
			jest
				.spyOn(getTransactionNameLib, 'getTransactionName')
				.mockReturnValue('TestController.testMethod');

			const result = await target.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(logger.addDurationMeta).toHaveBeenCalledWith('responseTime');
			expect(mockRequestContext.setContext).toHaveBeenCalledWith(
				'TestController.testMethod',
				'corr-id-123',
			);
		});

		it('should set context with undefined correlationId if getter returns undefined', async () => {
			getCorrelationId.mockReturnValue(undefined);
			jest
				.spyOn(getTransactionNameLib, 'getTransactionName')
				.mockReturnValue('TestController.testMethod');

			const result = await target.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockRequestContext.setContext).toHaveBeenCalledWith(
				'TestController.testMethod',
				undefined,
			);
		});

		// Removed test for transactionName falsy handling, as guard now always sets context and routine

		it('should call execution context methods for transaction name', async () => {
			jest.spyOn(getTransactionNameLib, 'getTransactionName');
			await target.canActivate(mockExecutionContext);
			expect(mockExecutionContext.getHandler).toHaveBeenCalled();
			expect(mockExecutionContext.getClass).toHaveBeenCalled();
			expect(logger.addDurationMeta).toHaveBeenCalledWith('responseTime');
		});

		it('should support no correlation id getter', async () => {
			const testTarget = new ContextLoggerContextGuard(logger, {
				getCorrelationId: undefined,
			} as ContextLoggingOptions<any>);

			jest
				.spyOn(getTransactionNameLib, 'getTransactionName')
				.mockReturnValue('TestController.testMethod');
			const result = await testTarget.canActivate(mockExecutionContext);
			expect(result).toBe(true);
			expect(mockRequestContext.setContext).toHaveBeenCalledWith(
				'TestController.testMethod',
				undefined,
			);
		});
	});
});
