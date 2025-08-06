import { getTransactionName } from '../../src/internal/get-transaction-name';
import { emitterSymbol } from '../../src/internal/emitter-symbol';
import { createMockExecutionContext } from '../test-utils-new';

describe('Internal Utilities', () => {
	describe('getTransactionName', () => {
		it('should create transaction name from controller and handler', () => {
			const context = createMockExecutionContext('UserController', 'getUsers');

			const result = getTransactionName(context);

			expect(result).toBe('UserController.getUsers');
		});

		it('should handle different controller and handler names', () => {
			const context = createMockExecutionContext(
				'OrderController',
				'createOrder',
			);

			const result = getTransactionName(context);

			expect(result).toBe('OrderController.createOrder');
		});

		it('should call getHandler and getClass on context', () => {
			const context = createMockExecutionContext();

			getTransactionName(context);

			expect(context.getHandler).toHaveBeenCalled();
			expect(context.getClass).toHaveBeenCalled();
		});
	});

	describe('emitterSymbol', () => {
		it('should be defined', () => {
			expect(emitterSymbol).toBeDefined();
		});

		it('should be a symbol', () => {
			expect(typeof emitterSymbol).toBe('symbol');
		});

		it('should be a unique symbol that can be used as a DI token', () => {
			// Test that the symbol is unique and suitable for dependency injection
			expect(typeof emitterSymbol).toBe('symbol');
			expect(emitterSymbol.toString()).toContain(
				'NewrelicInstrumentationEmitter',
			);

			// Should be truthy and usable as a Map key (important for DI systems)
			const testMap = new Map();
			testMap.set(emitterSymbol, 'test-value');
			expect(testMap.get(emitterSymbol)).toBe('test-value');
		});
	});
});
