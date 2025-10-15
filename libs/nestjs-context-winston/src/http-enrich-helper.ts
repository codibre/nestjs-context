import { HttpRequest } from './context-logging-options';

/**
 * Generates data from a http request to enrich log metadata based on its headers.
 * By default, it excludes the 'authorization' and 'cookie' headers to avoid logging sensitive information.
 *
 * @param excludeFields - Array of header names to exclude (case-insensitive). Defaults to ['authorization', 'cookie'].
 * @returns A function that takes a HttpRequest and returns an object with filtered headers.
 */
export function httpEnrichHelper(
	excludeFields: string[] = ['authorization', 'cookie'],
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
