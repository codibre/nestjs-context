import { HttpRequest } from './context-logging-options';

export const BASIC_HTTP_ENRICH_EXCLUSION = Object.freeze([
	'authorization',
	'cookie',
	'x-api-key',
]);
export const HTTP_PRIVACY_HEADERS = Object.freeze([
	'set-cookie',
	'cookie',
	'authorization',
	'x-api-key',
	'x-user-id',
	'x-customer-id',
	'x-session-id',
	'x-forwarded-for',
	'forwarded',
	'x-device-id',
	'x-app-id',
	'x-email',
	'x-phone-number',
	'x-access-token',
	'x-refresh-token',
]);

/**
 * Generates data from a http request to enrich log metadata based on its headers.
 * By default, it excludes the 'authorization' and 'cookie' headers to avoid logging sensitive information.
 *
 * @param excludeFields - Array of header names to exclude (case-insensitive). Defaults to ['authorization', 'cookie'].
 * @returns A function that takes a HttpRequest and returns an object with filtered headers.
 */
export function httpEnrichHelper(
	excludeFields: readonly string[] = HTTP_PRIVACY_HEADERS,
) {
	const fieldsSet = new Set(excludeFields.map((f) => f.toLowerCase()));
	return (req: HttpRequest) => {
		const headers: Record<string, unknown> = {};
		for (const key in req.headers) {
			if (!fieldsSet.has(key.toLowerCase())) headers[key] = req.headers[key];
		}
		return { headers };
	};
}
