import { FastifyAdapter } from '@nestjs/platform-fastify';
import { BaseNestJsServerOptions } from '../types';

const KB = 1024;
const MB = KB * KB;
const DEFAULT_MAX_PARAM_SIZE = 65;
const DEFAULT_BODY_LIMIT = 50;

export function getAdapter(options: BaseNestJsServerOptions = {}) {
	const http2 = (options.http2 ?? process.env.HTTP2_SERVER === 'true') as true;
	const adapter = new FastifyAdapter({
		http2,
		maxParamLength: (options.maxParamLengthKb ?? DEFAULT_MAX_PARAM_SIZE) * KB,
		bodyLimit: (options.bodyLimitMb ?? DEFAULT_BODY_LIMIT) * MB,
	});
	return adapter;
}
