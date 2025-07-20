import winston from 'winston';

export function printColoredMeta({
	timestamp,
	level,
	message,
	...meta
}: winston.Logform.TransformableInfo) {
	const metaStr =
		Object.keys(meta).length > 0
			? `\n\x1b[33m${JSON.stringify(meta, null, 2)}\x1b[0m`
			: '';
	return `${timestamp} [${level}]: ${message}${metaStr}`;
}
