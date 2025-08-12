import { NestFactory } from '@nestjs/core';
import { BaseNestjsOptions } from '../types';
import { getAdapter } from './get-adapter';
import { processCompression } from './process-compression';
import { createModule } from './create-module';
import { toProperCase } from './to-proper';

const globalFields = ['filters', 'guards', 'interceptors'] as const;

export async function createNestjsApp(options: BaseNestjsOptions) {
	const adapter = getAdapter(options.server);
	await processCompression(adapter, options.server);
	const appModule = createModule(options);
	const app = await NestFactory.create(appModule, adapter, {
		logger: options.loggingModule.nestLogger,
		bodyParser: false,
	});
	const { globals } = options;
	if (globals) {
		globalFields.forEach((field) => {
			if (!globals[field]) return;
			app[`useGlobal${toProperCase(field)}`](
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				...globals[field].map((x) => app.get(x)),
			);
		});
	}
	return app;
}
