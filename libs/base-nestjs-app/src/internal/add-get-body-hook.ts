import { FastifyInstance } from 'fastify';
import { BaseNestJsServerOptions } from 'src/types/base-nestjs-app-options';

export function addGetBodyHook(
	instance: FastifyInstance,
	options: BaseNestJsServerOptions | undefined,
) {
	if (options?.allowGetBody ?? false) {
		instance.addHttpMethod('GET', {
			hasBody: true,
		});
	}
}
