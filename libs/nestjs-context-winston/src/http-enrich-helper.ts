import { HttpRequest } from './context-logging-options';

/**
 * Generates data from a http request to enrich log metadata based on its headers.
 * By default, it excludes the 'authorization' header to avoid logging sensitive information.
 */
export function httpEnrichHelper(excludeFields: string[] = ['authorization']) {
	const fieldsSet = new Set(excludeFields.map((f) => f.toLowerCase()));
	return (req: HttpRequest) => {
		const headers: Record<string, unknown> = {};
		for (const key in req.headers) {
			if (!fieldsSet.has(key.toLowerCase())) headers[key] = req.headers[key];
		}
		return { headers };
	};
}
