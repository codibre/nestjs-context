import { HttpRequest } from 'src';
import { httpEnrichHelper } from '../src/http-enrich-helper';

describe('httpEnrichHelper', () => {
	it('should exclude the authorization and cookie headers by default', () => {
		// Arrange
		const enrich = httpEnrichHelper();
		const req = {
			method: 'GET',
			headers: {
				authorization: 'secret',
				cookie: 'sessionid=abc123',
				'x-custom': 'value',
				'content-type': 'application/json',
			},
		} as unknown as HttpRequest;

		// Act
		const result = enrich(req);

		// Assert
		expect(result.request.method).toBe('GET');
		expect(result.request.headers).toEqual({
			'x-custom': 'value',
			'content-type': 'application/json',
		});
	});

	it('should exclude custom fields if provided', () => {
		// Arrange
		const enrich = httpEnrichHelper(['x-custom', 'authorization', 'cookie']);
		const req = {
			method: 'POST',
			headers: {
				authorization: 'secret',
				cookie: 'sessionid=abc123',
				'x-custom': 'value',
				'content-type': 'application/json',
			},
		} as unknown as HttpRequest;

		// Act
		const result = enrich(req);

		// Assert
		expect(result.request.method).toBe('POST');
		expect(result.request.headers).toEqual({
			'content-type': 'application/json',
		});
	});

	it('should handle empty headers', () => {
		// Arrange
		const enrich = httpEnrichHelper();
		const req = { method: 'PUT', headers: {} } as unknown as HttpRequest;

		// Act
		const result = enrich(req);

		// Assert
		expect(result.request.method).toBe('PUT');
		expect(result.request.headers).toEqual({});
	});
});
