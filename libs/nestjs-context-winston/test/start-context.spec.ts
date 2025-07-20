import { startContext } from 'src';
import { RequestContext } from 'winston-context-logger';

describe(startContext.name, () => {
	it('should set context with name and traceId', () => {
		// Arrange
		const name = 'testContext';
		const traceId = '12345';

		// Act
		startContext(name, traceId);

		// Assert
		expect(RequestContext.currentContext!.routine).toEqual(name);
		expect(RequestContext.currentContext!.correlationId).toEqual(traceId);
	});

	it('should set context with name only', () => {
		// Arrange
		const name = 'testContext';

		// Act
		startContext(name);

		// Assert
		expect(RequestContext.currentContext!.routine).toEqual(name);
		expect(RequestContext.currentContext!.correlationId).toBeString();
	});
});
