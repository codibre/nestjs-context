import { NestFactory } from '@nestjs/core';
import { BaseNestjsOptions } from '../types';
import { getAdapter } from './get-adapter';
import { processCompression } from './process-compression';
import { createModule } from './create-module';

export async function createNestjsApp(options: BaseNestjsOptions) {
	const adapter = getAdapter(options.server);
	await processCompression(adapter, options.server);
	const appModule = createModule(options);
	const app = await NestFactory.create(appModule, adapter, {
		logger: options.loggingModule.nestLogger,
		bodyParser: false,
	});
	return app;
}
