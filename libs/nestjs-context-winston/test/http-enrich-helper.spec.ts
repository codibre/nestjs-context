import { HttpRequest } from 'src';
import { httpEnrichHelper } from '../src/http-enrich-helper';

describe('httpEnrichHelper', () => {
	it('should exclude the authorization header by default', () => {
		// Arrange
		const enrich = httpEnrichHelper();
		const req = {
			headers: {
				authorization: 'secret',
				'x-custom': 'value',
				'content-type': 'application/json',
			},
		} as unknown as HttpRequest;

		// Act
		const result = enrich(req);

		// Assert
		expect(result.headers).not.toHaveProperty('authorization');
		expect(result.headers['x-custom']).toBe('value');
		expect(result.headers['content-type']).toBe('application/json');
	});

	it('should exclude custom fields if provided', () => {
		// Arrange
		const enrich = httpEnrichHelper(['x-custom', 'authorization']);
		const req = {
			headers: {
				authorization: 'secret',
				'x-custom': 'value',
				'content-type': 'application/json',
			},
		} as unknown as HttpRequest;

		// Act
		const result = enrich(req);

		// Assert
		expect(result.headers).not.toHaveProperty('authorization');
		expect(result.headers).not.toHaveProperty('x-custom');
		expect(result.headers['content-type']).toBe('application/json');
	});

	it('should handle empty headers', () => {
		// Arrange
		const enrich = httpEnrichHelper();
		const req = { headers: {} } as unknown as HttpRequest;

		// Act
		const result = enrich(req);

		// Assert
		expect(result.headers).toEqual({});
	});
});
