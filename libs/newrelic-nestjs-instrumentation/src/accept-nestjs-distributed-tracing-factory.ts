import { ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import newrelic from 'newrelic';

export function acceptNestjsDistributedTracingFactory(
	context: ExecutionContext,
) {
	return (transaction: newrelic.TransactionHandle) => {
		if (context.getType() === 'http') {
			transaction.acceptDistributedTraceHeaders(
				'HTTP',
				context.switchToHttp().getRequest<FastifyRequest>().headers,
			);
		}
	};
}
