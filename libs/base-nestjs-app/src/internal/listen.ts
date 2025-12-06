import { INestApplication } from '@nestjs/common';
import { BaseNestjsOptions } from '../types';
import { Server, createServer } from 'net';

const DEFAULT_PORT = 3000;

async function getUnusedPortOtherThan(mainPort: number) {
	const servers: Server[] = [];
	let port = 0;
	do {
		const server = createServer();
		await new Promise<void>((resolve, reject) => {
			server.on('error', reject);
			server.listen(0, () => {
				servers.push(server);
				const address = server.address();
				if (address && typeof address === 'object') {
					const serverPort = address.port;
					if (serverPort !== mainPort) port = serverPort;
				} else {
					reject(new Error('Could not get server address'));
				}
				resolve();
			});
		});
	} while (!port || port === mainPort);
	servers.forEach((server) => server.close());
	return port;
}

export async function listen(
	app: INestApplication,
	options: BaseNestjsOptions,
) {
	const mainPort = options.server?.port ?? DEFAULT_PORT;
	if (options.microservices?.length) {
		for (const ms of app.getMicroservices()) {
			if (
				'serverInstance' in ms &&
				typeof ms.serverInstance === 'object' &&
				ms.serverInstance &&
				'port' in ms.serverInstance &&
				ms.serverInstance.port === mainPort
			) {
				ms.serverInstance.port = await getUnusedPortOtherThan(mainPort);
				options.loggingModule.logger.warn(
					`Microservice port conflicted with main server port. Changed microservice port to ${ms.serverInstance.port}`,
				);
			}
		}
		await app.startAllMicroservices();
	}
	await app.listen(mainPort, '0.0.0.0');
	options.loggingModule.logger.info(`Listening on ${await app.getUrl()}`);
	return app;
}
