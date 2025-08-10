import { FastifyAdapter } from '@nestjs/platform-fastify';
import { BaseNestJsServerOptions } from 'src/types/base-nestjs-app-options';

export function addGetBodyHook(
	adapter: FastifyAdapter,
	options: BaseNestJsServerOptions | undefined,
) {
	if (options?.allowGetBody ?? false) {
		adapter.getInstance().addHttpMethod('GET', {
			hasBody: true,
		});
	}
}
