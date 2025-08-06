import { getContext, setContext } from 'test/jest-setup';
import {
	getNewrelicContext,
	setNewrelicContext,
} from '../../src/internal/newrelic-context';

describe('newrelic-context', () => {
	it('should get context from tracer', () => {
		// Arrange
		const mockContext = { foo: 'bar' };
		getContext.mockReturnValue(mockContext);
		// Act
		const result = getNewrelicContext();
		// Assert
		expect(result).toBe(mockContext);
	});

	it('should set context using tracer._contextManager', () => {
		// Arrange
		const context = { baz: 'qux' };
		// Act
		setNewrelicContext(context as any);
		// Assert
		expect(setContext).toHaveBeenCalledWith(context);
	});
});
