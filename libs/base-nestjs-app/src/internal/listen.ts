import { INestApplication } from '@nestjs/common';
import { DEFAULT_PORT } from '../create-app';
import { BaseNestjsOptions } from '../types';

export async function listen(
	app: INestApplication,
	options: BaseNestjsOptions,
) {
	if (options.microservices?.length) {
		await app.startAllMicroservices();
	}
	await app.listen(options.server?.port ?? DEFAULT_PORT, '0.0.0.0');
	options.loggingModule.logger.info(`Listening on ${await app.getUrl()}`);
	return app;
}
