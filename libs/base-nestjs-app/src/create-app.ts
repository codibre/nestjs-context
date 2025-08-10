import { BaseNestjsOptions } from './types/base-nestjs-app-options';
import {
	createNestjsApp,
	enableOpenApi,
	listen,
	processCors,
	processMicroservices,
} from './internal';

/**
 * Creates and configures a NestJS application using Fastify.
 *
 * Sets up HTTP2, custom Fastify hooks, compression, CORS, API versioning, OpenAPI docs, and microservices.
 * Starts the server on the specified port.
 *
 * @param options Configuration options for the NestJS app.
 * @returns A promise that resolves when the app is listening.
 */
export async function createApp(options: BaseNestjsOptions) {
	const app = await createNestjsApp(options);
	processCors(app, options);
	app.enableVersioning();
	enableOpenApi(app);
	processMicroservices(app, options);

	return {
		app,
		start: () => listen(app, options),
	};
}
