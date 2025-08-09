import { BaseNestjsOptions } from './types/base-nestjs-app-options';
import { NestFactory } from '@nestjs/core';
import {
	addGetBodyHook,
	createModule,
	enableOpenApi,
	getAdapter,
	listen,
	processCompression,
	processMSOptions,
} from './internal';
import { BaseNestApplication } from './types';

export const DEFAULT_PORT = 3000;

/**
 * Creates and configures a NestJS application using Fastify.
 *
 * Sets up HTTP2, custom Fastify hooks, compression, CORS, API versioning, OpenAPI docs, and microservices.
 * Starts the server on the specified port.
 *
 * @param options Configuration options for the NestJS app.
 * @returns A promise that resolves when the app is listening.
 */
export async function createApp(
	options: BaseNestjsOptions,
): Promise<BaseNestApplication> {
	const adapter = getAdapter(options.server);
	addGetBodyHook(options, adapter);
	await processCompression(adapter, options.server);
	const appModule = createModule(options);
	const app = await NestFactory.create(appModule, adapter, {
		logger: options.loggerModule.nestLogger,
	});
	app.enableCors();
	app.enableVersioning();
	enableOpenApi(app);

	options.microservices?.forEach((msOptions) => {
		app.connectMicroservice(processMSOptions(msOptions), {
			inheritAppConfig: true,
			...msOptions.hybridOptions,
		});
	});

	return Object.assign(app, {
		start: () => listen(app, options),
	});
}
