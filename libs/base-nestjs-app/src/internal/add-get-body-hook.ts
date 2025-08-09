import { FastifyAdapter } from '@nestjs/platform-fastify';
import { BaseNestjsOptions } from 'src/types/base-nestjs-app-options';

export function addGetBodyHook(
	options: BaseNestjsOptions,
	adapter: FastifyAdapter,
) {
	if (options.allowGetBody ?? false) {
		adapter.getInstance().addHook('onRequest', async (request) => {
			if (request.method === 'GET') await request.body;
		});
	}
}
