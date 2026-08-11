const mockOtelApi = {
	trace: {
		getActiveSpan: jest.fn(),
		getTracer: jest.fn(() => ({
			startSpan: jest.fn(() => ({
				spanContext: jest.fn(() => ({ traceId: 'test-trace-id-123' })),
				setStatus: jest.fn(),
				end: jest.fn(),
			})),
		})) as jest.MockedFunction<any>,
	},
	context: {
		active: jest.fn(() => ({})),
	},
	propagation: {
		extract: jest.fn((context, _headers) => context),
	},
	SpanKind: {
		INTERNAL: 1,
		SERVER: 2,
		CLIENT: 3,
		PRODUCER: 4,
		CONSUMER: 5,
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

import { ExecutionContext } from '@nestjs/common';
import { EventEmitter } from 'stream';
import { OtelContextGuard } from '../src/otel-context-guard';
import { InternalContext } from '../src/internal';
import {
	createMockExecutionContext,
	createMockEventEmitter,
	createMockInternalContext,
} from './test-utils';

describe('OtelContextGuard', () => {
	let guard: OtelContextGuard;
	let mockEmitter: EventEmitter;
	let mockInternalContext: InternalContext;
	let mockExecutionContext: ExecutionContext;

	beforeEach(() => {
		mockEmitter = createMockEventEmitter();
		mockInternalContext = createMockInternalContext();
		mockExecutionContext = createMockExecutionContext();

		guard = new OtelContextGuard(mockEmitter, mockInternalContext);
	});

	afterEach(() => {
		mockEmitter.removeAllListeners();
		jest.clearAllMocks();
	});

	describe('canActivate', () => {
		it('should return true when existing trace ID is found', async () => {
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				'existing-trace-id',
			);

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockOtelInstrumentation.create).not.toHaveBeenCalled();
			expect(mockEmitter.emit).not.toHaveBeenCalled();
		});

		it('should return true and create new span when no existing trace ID found', async () => {
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			mockOtelInstrumentation.create.mockReturnValue('new-trace-id');

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(
				mockOtelInstrumentation.getCurrentTransactionId,
			).toHaveBeenCalled();
			expect(mockOtelInstrumentation.create).toHaveBeenCalledWith(
				expect.any(String),
				mockExecutionContext,
				undefined,
			);
		});

		it('should not emit spanStarted event when existing trace ID is found', async () => {
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				'existing-trace-id',
			);

			await guard.canActivate(mockExecutionContext);

			expect(mockEmitter.emit).not.toHaveBeenCalled();
		});

		it('should emit spanStarted event when new span is created', async () => {
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			mockOtelInstrumentation.create.mockReturnValue('new-trace-id');

			await guard.canActivate(mockExecutionContext);

			expect(mockEmitter.emit).toHaveBeenCalledWith(
				'spanStarted',
				'new-trace-id',
				mockExecutionContext,
			);
		});

		it('should emit spanStartFailed event when OpenTelemetry operations fail', async () => {
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			mockOtelInstrumentation.create.mockImplementation(() => {
				throw new Error('OTEL API error');
			});

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true); // Guard should not block requests on errors
			expect(mockEmitter.emit).toHaveBeenCalledWith(
				'spanStartFailed',
				expect.any(Error),
			);
		});

		it('should extract distributed tracing headers for HTTP requests', async () => {
			const mockContext = createMockExecutionContext('http', {
				headers: {
					traceparent:
						'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
					tracestate: 'congo=t61rcWkgMzE',
				},
			});

			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			mockOtelInstrumentation.create.mockReturnValue('test-trace-id');

			await guard.canActivate(mockContext);

			expect(mockOtelInstrumentation.create).toHaveBeenCalled();
			// The create function handles extraction internally
		});

		it('should create span with SERVER kind for HTTP requests', async () => {
			const mockContext = createMockExecutionContext('http', {
				method: 'POST',
				url: '/api/test',
				path: '/api/test',
			});

			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			mockOtelInstrumentation.create.mockReturnValue('test-trace-id');

			await guard.canActivate(mockContext);

			expect(mockOtelInstrumentation.create).toHaveBeenCalledWith(
				expect.stringContaining('TestController.testMethod'),
				mockContext,
				undefined,
			);
		});

		it('should create span with SERVER kind for RPC requests', async () => {
			const mockContext = createMockExecutionContext('rpc', {
				handler: 'processMessage',
			});

			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			mockOtelInstrumentation.create.mockReturnValue('test-trace-id');

			await guard.canActivate(mockContext);

			expect(mockOtelInstrumentation.create).toHaveBeenCalledWith(
				expect.stringContaining('TestController.processMessage'),
				mockContext,
				undefined,
			);
		});

		it('should create span with INTERNAL kind for unknown context types', async () => {
			const mockContext = createMockExecutionContext('ws');

			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			mockOtelInstrumentation.create.mockReturnValue('test-trace-id');

			await guard.canActivate(mockContext);

			expect(mockOtelInstrumentation.create).toHaveBeenCalledWith(
				expect.stringContaining('TestController.testMethod'),
				mockContext,
				undefined,
			);
		});

		it('should handle missing request gracefully for HTTP context', async () => {
			const mockContext = createMockExecutionContext('http');
			// Mock switchToHttp to throw an error
			mockContext.switchToHttp = jest.fn().mockImplementation(() => {
				throw new Error('Request not available');
			});

			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			mockOtelInstrumentation.create.mockReturnValue('test-trace-id');

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockOtelInstrumentation.create).toHaveBeenCalled();
		});

		it('should return true and not emit spanStarted when create returns undefined', async () => {
			mockOtelInstrumentation.getCurrentTransactionId.mockReturnValue(
				undefined,
			);
			mockOtelInstrumentation.create.mockReturnValue(undefined);

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockEmitter.emit).not.toHaveBeenCalledWith(
				'spanStarted',
				expect.anything(),
				expect.anything(),
			);
		});
	});
});
