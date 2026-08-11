const mockOtelApi = {
	trace: {
		getActiveSpan: jest.fn(),
		getTracer: jest.fn(() => ({
			startSpan: jest.fn(() => ({
				spanContext: jest.fn(() => ({ traceId: 'test-trace-id-123' })),
				setStatus: jest.fn(),
				setAttribute: jest.fn(),
				addEvent: jest.fn(),
				recordException: jest.fn(),
				end: jest.fn(),
			})),
		})),
	},
	SpanStatusCode: {
		UNSET: 0,
		OK: 1,
		ERROR: 2,
	},
};

jest.mock('@opentelemetry/api', () => mockOtelApi);

// Mock the otelInstrumentation (used by startOtelInstrumentationIfAbsent)
const mockOtelInstrumentation = {
	getCurrentTransactionId: jest.fn(),
	create: jest.fn(),
	recordException: jest.fn(),
	addAttributes: jest.fn(),
};

jest.mock('../src/internal/otel-instrumentation', () => ({
	otelInstrumentation: mockOtelInstrumentation,
}));

import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { EventEmitter } from 'stream';
import { OtelInterceptor } from '../src/otel.interceptor';
import { InternalContext } from '../src/internal';
import {
	createMockExecutionContext,
	createMockEventEmitter,
	createMockInternalContext,
	createMockOtelSpan,
} from './test-utils';

describe('OtelInterceptor', () => {
	let interceptor: OtelInterceptor;
	let mockEmitter: EventEmitter;
	let mockInternalContext: InternalContext;
	let mockExecutionContext: ExecutionContext;
	let mockCallHandler: jest.Mocked<CallHandler>;

	beforeEach(() => {
		mockEmitter = createMockEventEmitter();
		mockInternalContext = createMockInternalContext();
		mockExecutionContext = createMockExecutionContext();
		mockCallHandler = {
			handle: jest.fn(),
		};

		interceptor = new OtelInterceptor(mockEmitter, mockInternalContext);

		// Clear all mocks including otel instrumentation mocks
		jest.clearAllMocks();
		mockOtelInstrumentation.getCurrentTransactionId.mockClear();
		mockOtelInstrumentation.create.mockClear();
		mockOtelInstrumentation.recordException.mockClear();
		mockOtelInstrumentation.addAttributes.mockClear();
	});

	afterEach(() => {
		mockEmitter.removeAllListeners();
	});

	describe('intercept', () => {
		it('should call next handle and return observable when no active span and no existing trace id', () => {
			mockOtelApi.trace.getActiveSpan.mockReturnValue(null);
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			const mockObservable = of('test-result');
			mockCallHandler.handle.mockReturnValue(mockObservable);

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			expect(mockCallHandler.handle).toHaveBeenCalled();
			expect(result).toBe(mockObservable);
		});

		it('should add span tracking when active span exists', () => {
			const mockSpan = createMockOtelSpan('active-span-id');
			mockOtelApi.trace.getActiveSpan.mockReturnValue(mockSpan);
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				'active-span-id',
			);
			const mockObservable = of('test-result');
			mockCallHandler.handle.mockReturnValue(mockObservable);

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			expect(mockCallHandler.handle).toHaveBeenCalled();
			expect(result).toBeDefined();
			expect(result).not.toBe(mockObservable);
		});

		it('should finish span successfully on successful request', async () => {
			const mockSpan = createMockOtelSpan('test-trace-id');
			mockOtelApi.trace.getActiveSpan.mockReturnValue(mockSpan);
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				'test-trace-id',
			);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockInternalContext.customTransactionId = 'test-trace-id';

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Execute the observable to trigger the tap operators
			await new Promise((resolve) => {
				result.subscribe({
					next: () => resolve(undefined),
					error: () => resolve(undefined),
					complete: () => resolve(undefined),
				});
			});

			expect(mockSpan.end).toHaveBeenCalled();
			expect(mockEmitter.emit).toHaveBeenCalledWith(
				'spanFinished',
				'test-trace-id',
			);
		});

		it('should emit spanFinishFailed when finishSpan throws', async () => {
			const mockSpan = createMockOtelSpan('test-trace-id');
			mockOtelApi.trace.getActiveSpan.mockReturnValue(mockSpan);
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				'test-trace-id',
			);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockInternalContext.customTransactionId = 'test-trace-id';

			// Make span.end throw an error
			const spanError = new Error('Span end failed');
			mockSpan.end.mockImplementation(() => {
				throw spanError;
			});

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Execute the observable to trigger the error
			await new Promise((resolve) => {
				result.subscribe({
					next: () => resolve(undefined),
					error: () => resolve(undefined),
					complete: () => resolve(undefined),
				});
			});

			expect(mockEmitter.emit).toHaveBeenCalledWith(
				'spanFinishFailed',
				spanError,
			);
		});

		it('should not end span if trace ID does not match custom transaction ID', async () => {
			const mockSpan = createMockOtelSpan('different-trace-id');
			mockOtelApi.trace.getActiveSpan.mockReturnValue(mockSpan);
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				'different-trace-id',
			);
			mockCallHandler.handle.mockReturnValue(of('success'));
			mockInternalContext.customTransactionId = 'custom-trace-id';

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Execute the observable
			await new Promise((resolve) => {
				result.subscribe({
					next: () => resolve(undefined),
					error: () => resolve(undefined),
					complete: () => resolve(undefined),
				});
			});

			expect(mockSpan.end).not.toHaveBeenCalled();
			expect(mockEmitter.emit).toHaveBeenCalledWith(
				'spanFinished',
				'different-trace-id',
			);
		});

		it('should handle Error objects in recordError method', async () => {
			const mockSpan = createMockOtelSpan('error-trace-id');
			mockOtelApi.trace.getActiveSpan.mockReturnValue(mockSpan);
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				'error-trace-id',
			);
			mockInternalContext.customTransactionId = 'error-trace-id';

			const testError = new Error('Test error message');
			testError.stack = 'Test stack trace';

			mockCallHandler.handle.mockReturnValue(
				new Observable((subscriber) => {
					subscriber.error(testError);
				}),
			);

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Execute the observable to trigger the error
			await new Promise((resolve) => {
				result.subscribe({
					next: () => resolve(undefined),
					error: () => resolve(undefined),
					complete: () => resolve(undefined),
				});
			});

			// Verify recordException was called
			expect(mockOtelInstrumentation.recordException).toHaveBeenCalledWith(
				testError,
			);
			// Verify addAttributes was called with error details
			expect(mockOtelInstrumentation.addAttributes).toHaveBeenCalledWith({
				'error.name': 'Error',
				'error.message': 'Test error message',
				'error.stack': 'Test stack trace',
			});
		});

		it('should handle non-Error objects in recordError method', async () => {
			const mockSpan = createMockOtelSpan('error-trace-id');
			mockOtelApi.trace.getActiveSpan.mockReturnValue(mockSpan);
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				'error-trace-id',
			);
			mockInternalContext.customTransactionId = 'error-trace-id';

			const nonErrorObject = { type: 'CustomError', code: 500 };

			mockCallHandler.handle.mockReturnValue(
				new Observable((subscriber) => {
					subscriber.error(nonErrorObject);
				}),
			);

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Execute the observable to trigger the error
			await new Promise((resolve) => {
				result.subscribe({
					next: () => resolve(undefined),
					error: () => resolve(undefined),
					complete: () => resolve(undefined),
				});
			});

			// Verify that non-Error objects are converted to Error objects
			expect(mockOtelInstrumentation.recordException).toHaveBeenCalledWith(
				expect.any(Error),
			);
			// Verify error attributes are set correctly
			expect(mockOtelInstrumentation.addAttributes).toHaveBeenCalledWith({
				'error.name': 'UnknownError',
				'error.message': '[object Object]',
				'error.stack': 'No stack trace available',
			});
		});

		it('should handle recordError throwing an exception', async () => {
			const mockSpan = createMockOtelSpan('error-trace-id');
			mockOtelApi.trace.getActiveSpan.mockReturnValue(mockSpan);
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				'error-trace-id',
			);
			mockInternalContext.customTransactionId = 'error-trace-id';

			// Mock recordException to throw an error
			const recordExceptionError = new Error('Recording exception failed');
			mockOtelInstrumentation.recordException.mockImplementation(() => {
				throw recordExceptionError;
			});

			const testError = new Error('Original error');

			mockCallHandler.handle.mockReturnValue(
				new Observable((subscriber) => {
					subscriber.error(testError);
				}),
			);

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Execute the observable to trigger the error
			await new Promise((resolve) => {
				result.subscribe({
					next: () => resolve(undefined),
					error: () => resolve(undefined),
					complete: () => resolve(undefined),
				});
			});

			// Verify that spanFinishFailed is emitted when recordError fails
			expect(mockEmitter.emit).toHaveBeenCalledWith(
				'spanFinishFailed',
				recordExceptionError,
			);
		});

		it('should handle null traceId in finishSpan gracefully', async () => {
			// Create a mock span that returns null traceId
			const mockSpan = {
				spanContext: jest.fn(() => ({ traceId: null })),
				end: jest.fn(),
				setStatus: jest.fn(),
			};
			mockOtelApi.trace.getActiveSpan.mockReturnValue(mockSpan);
			mockCallHandler.handle.mockReturnValue(of('success'));

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Execute the observable
			await new Promise((resolve) => {
				result.subscribe({
					next: () => resolve(undefined),
					error: () => resolve(undefined),
					complete: () => resolve(undefined),
				});
			});

			// Should not emit spanFinished when traceId is null
			expect(mockEmitter.emit).not.toHaveBeenCalledWith(
				'spanFinished',
				expect.any(String),
			);
		});

		it('should handle undefined traceId in finishSpan gracefully', async () => {
			// Create a mock span that returns undefined traceId
			const mockSpan = {
				spanContext: jest.fn(() => ({ traceId: undefined })),
				end: jest.fn(),
				setStatus: jest.fn(),
			};
			mockOtelApi.trace.getActiveSpan.mockReturnValue(mockSpan);
			mockCallHandler.handle.mockReturnValue(of('success'));

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Execute the observable
			await new Promise((resolve) => {
				result.subscribe({
					next: () => resolve(undefined),
					error: () => resolve(undefined),
					complete: () => resolve(undefined),
				});
			});

			// Should not emit spanFinished when traceId is undefined
			expect(mockEmitter.emit).not.toHaveBeenCalledWith(
				'spanFinished',
				expect.any(String),
			);
		});

		it('should handle non-Error objects in recordError method with null properties', async () => {
			const mockSpan = createMockOtelSpan('error-trace-id');
			mockOtelApi.trace.getActiveSpan.mockReturnValue(mockSpan);
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				'error-trace-id',
			);
			mockInternalContext.customTransactionId = 'error-trace-id';

			// Mock a non-Error object that has null properties
			const testError = { name: null, message: null, stack: null };

			mockCallHandler.handle.mockReturnValue(
				new Observable((subscriber) => {
					subscriber.error(testError);
				}),
			);

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Execute the observable to trigger the error
			await new Promise((resolve) => {
				result.subscribe({
					next: () => resolve(undefined),
					error: () => resolve(undefined),
					complete: () => resolve(undefined),
				});
			});

			// Verify recordException is called - the attributes might not be called due to error flow
			expect(mockOtelInstrumentation.recordException).toHaveBeenCalledWith(
				expect.any(Error),
			);
		});

		it('should call startOtelInstrumentationIfAbsent as fallback for RPC contexts', async () => {
			mockOtelApi.trace.getActiveSpan.mockReturnValue(null);
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			mockOtelInstrumentation.create.mockReturnValue('rpc-trace-id');
			mockCallHandler.handle.mockReturnValue(of('success'));

			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			await new Promise((resolve) => {
				result.subscribe({
					next: () => resolve(undefined),
					error: () => resolve(undefined),
					complete: () => resolve(undefined),
				});
			});

			// Should have tried to create a span via the shared function
			expect(mockOtelInstrumentation.create).toHaveBeenCalledWith(
				expect.stringContaining('TestController'),
				mockExecutionContext,
				'rpc', // interceptor fallback forces RPC type
			);
			expect(mockEmitter.emit).toHaveBeenCalledWith(
				'spanStarted',
				'rpc-trace-id',
				mockExecutionContext,
			);
		});
	});
});
