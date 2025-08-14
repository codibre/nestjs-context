import { ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export function defaultTokenExtractor(context: ExecutionContext) {
	if (context.getType() !== 'http') {
		throw new Error('Not an HTTP context. Specify a custom token extractor');
	}
	const req: FastifyRequest = context.switchToHttp().getRequest();
	const authHeader = req.headers['authorization'];
	return authHeader ? authHeader.replace('Bearer ', '') : undefined;
}
