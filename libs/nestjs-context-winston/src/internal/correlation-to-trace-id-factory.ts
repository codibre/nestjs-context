import winston from 'winston';

export function correlationToTraceIdFactory(
	info: winston.Logform.TransformableInfo,
) {
	if (info.correlationId && !info['trace.id']) {
		info['trace.id'] = info.correlationId;
		delete info.correlationId;
	}
	return info;
}
