import { defaultTokenExtractor } from '../../src/internal/default-token-extractor';

describe('defaultTokenExtractor', () => {
	// Arrange
	const makeContext = (type: string, authHeader?: string) => ({
		getType: () => type,
		switchToHttp: () => ({
			getRequest: () => ({ headers: { authorization: authHeader } }),
		}),
	});

	// Act & Assert
	it('should extract bearer token from authorization header', () => {
		const context = makeContext('http', 'Bearer mytoken');
		expect(defaultTokenExtractor(context as any)).toBe('mytoken');
	});

	it('should return undefined if no authorization header', () => {
		const context = makeContext('http');
		expect(defaultTokenExtractor(context as any)).toBeUndefined();
	});

	it('should throw if not http context', () => {
		const context = makeContext('rpc');
		expect(() => defaultTokenExtractor(context as any)).toThrow(
			'Not an HTTP context. Specify a custom token extractor',
		);
	});
});
