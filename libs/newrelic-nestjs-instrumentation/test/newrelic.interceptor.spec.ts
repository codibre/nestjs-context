import { ExecutionContext, CallHandler } from '@nestjs/common';
import { EventEmitter } from 'stream';
import { of, throwError } from 'rxjs';
import { NewRelicInterceptor } from '../src/newrelic.interceptor';
import { InternalContext } from '../src/internal';
import { createMockExecutionContext } from './test-utils-new';
import { mockNewRelic } from './jest-setup';

describe('NewrelicInterceptor', () => {
	let interceptor: NewRelicInterceptor;
	let mockEmitter: EventEmitter;
	let mockInternalContext: InternalContext;
	let mockExecutionContext: ExecutionContext;
	let mockCallHandler: CallHandler;

	beforeEach(() => {
		mockEmitter = new EventEmitter();
		mockInternalContext = new InternalContext();
		mockExecutionContext = createMockExecutionContext();
		mockCallHandler = {
			handle: jest.fn(),
		};

		jest.spyOn(mockEmitter, 'emit');
		jest.spyOn(mockInternalContext, 'customTransactionId', 'get');

		interceptor = new NewRelicInterceptor(mockInternalContext, mockEmitter);

		jest.clearAllMocks();
	});

	afterEach(() => {
		mockEmitter.removeAllListeners();
	});

	describe('intercept', () => {
		it('should call next handler and return observable', () => {
			const testData = { result: 'success' };
			mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			expect(mockCallHandler.handle).toHaveBeenCalled();
			expect(result$).toBeDefined();
		});

		it('should emit transactionFinished event on error', (done) => {
			const testError = new Error('Test error');
			const traceId = 'test-trace-456';

			mockCallHandler.handle = jest
				.fn()
				.mockReturnValue(throwError(() => testError));
			mockNewRelic.getTraceMetadata.mockReturnValue({ traceId });
			jest
				.spyOn(mockInternalContext, 'customTransactionId', 'get')
				.mockReturnValue(traceId);
			jest
				.spyOn(mockInternalContext, 'transaction', 'get')
				.mockReturnValue({ end: mockNewRelic.endTransaction } as any);

			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			result$.subscribe({
				error: (error) => {
					expect(error).toBe(testError);
					expect(mockEmitter.emit).toHaveBeenCalledWith(
						'transactionFinished',
						traceId,
					);
					expect(mockNewRelic.endTransaction).toHaveBeenCalled();
					done();
				},
			});
		});
	});

	describe('error handling', () => {
		it('should handle NewRelic getTraceMetadata errors gracefully', (done) => {
			const testData = { result: 'success' };

			mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));
			mockNewRelic.getTraceMetadata.mockImplementation(() => {
				throw new Error('NewRelic error');
			});

			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			result$.subscribe({
				next: (data) => {
					expect(data).toBe(testData);
				},
				complete: () => {
					done();
				},
			});
		});

		it('should handle NewRelic endTransaction errors gracefully', (done) => {
			const testData = { result: 'success' };
			const traceId = 'test-trace-error';

			mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));
			mockNewRelic.getTraceMetadata.mockReturnValue({ traceId });
			mockNewRelic.endTransaction.mockImplementation(() => {
				throw new Error('EndTransaction error');
			});
			// Ensure customTransactionId and transaction are set so finishTransaction will run
			jest
				.spyOn(mockInternalContext, 'customTransactionId', 'get')
				.mockReturnValue(traceId);
			jest
				.spyOn(mockInternalContext, 'transaction', 'get')
				.mockReturnValue({ end: mockNewRelic.endTransaction } as any);

			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			result$.subscribe({
				complete: () => {
					expect(mockEmitter.emit).toHaveBeenCalledWith(
						'transactionFinished',
						traceId,
					);
					expect(mockNewRelic.endTransaction).toHaveBeenCalled();
					done();
				},
			});
		});
	});
});
