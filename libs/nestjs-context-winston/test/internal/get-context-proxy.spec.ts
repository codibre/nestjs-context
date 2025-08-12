import { RequestContext } from 'winston-context-logger';
import { getContextProxy } from '../../src/internal/get-context-proxy';

class TestContextData {
	public name = 'default';
	public value = 0;

	public getValue() {
		return this.value;
	}

	public setValue(newValue: number) {
		this.value = newValue;
	}
}

describe('getContextProxy', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('when context is available', () => {
		it('should return context-specific instance', () => {
			// Arrange
			const mockContext = {
				privateMeta: {},
			};
			jest
				.spyOn(RequestContext, 'currentContext', 'get')
				.mockReturnValue(mockContext as any);

			// Act
			const proxy = getContextProxy(TestContextData);

			// Assert
			expect(proxy.name).toBe('default');
			expect(proxy.value).toBe(0);
		});

		it('should maintain separate instances per context', () => {
			// Arrange
			const mockContext1 = { privateMeta: {} };
			const mockContext2 = { privateMeta: {} };

			const proxy = getContextProxy(TestContextData);

			// Act & Assert - Context 1
			jest
				.spyOn(RequestContext, 'currentContext', 'get')
				.mockReturnValue(mockContext1 as any);
			proxy.setValue(100);
			expect(proxy.getValue()).toBe(100);

			// Act & Assert - Context 2
			jest
				.spyOn(RequestContext, 'currentContext', 'get')
				.mockReturnValue(mockContext2 as any);
			expect(proxy.getValue()).toBe(0); // Should be default value for new context
			proxy.setValue(200);
			expect(proxy.getValue()).toBe(200);

			// Act & Assert - Back to Context 1
			jest
				.spyOn(RequestContext, 'currentContext', 'get')
				.mockReturnValue(mockContext1 as any);
			expect(proxy.getValue()).toBe(100); // Should maintain original value
		});

		it('should handle method calls correctly', () => {
			// Arrange
			const mockContext = {
				privateMeta: {},
			};
			jest
				.spyOn(RequestContext, 'currentContext', 'get')
				.mockReturnValue(mockContext as any);

			// Act
			const proxy = getContextProxy(TestContextData);
			proxy.setValue(42);

			// Assert
			expect(proxy.getValue()).toBe(42);
		});

		it('should return undefined for non-existent properties', () => {
			// Arrange
			const mockContext = {
				privateMeta: {},
			};
			jest
				.spyOn(RequestContext, 'currentContext', 'get')
				.mockReturnValue(mockContext as any);

			// Act
			const proxy = getContextProxy(TestContextData);

			// Assert
			expect((proxy as any).nonExistentProperty).toBeUndefined();
		});

		it('should allow setting properties via proxy', () => {
			// Arrange
			const mockContext = {
				privateMeta: {},
			};
			jest
				.spyOn(RequestContext, 'currentContext', 'get')
				.mockReturnValue(mockContext as any);

			// Act
			const proxy = getContextProxy(TestContextData);
			proxy.name = 'modified';
			proxy.value = 999;

			// Assert
			expect(proxy.name).toBe('modified');
			expect(proxy.value).toBe(999);
		});
	});

	describe('when context is not available', () => {
		it('should return root instance when no context', () => {
			// Arrange
			jest
				.spyOn(RequestContext, 'currentContext', 'get')
				.mockReturnValue(undefined);

			// Act
			const proxy = getContextProxy(TestContextData);

			// Assert
			expect(proxy.name).toBe('default');
			expect(proxy.value).toBe(0);
		});

		it('should use root instance for method calls when no context', () => {
			// Arrange
			jest
				.spyOn(RequestContext, 'currentContext', 'get')
				.mockReturnValue(undefined);

			// Act
			const proxy = getContextProxy(TestContextData);
			proxy.setValue(99);

			// Assert
			expect(proxy.getValue()).toBe(99);
		});
	});
});
