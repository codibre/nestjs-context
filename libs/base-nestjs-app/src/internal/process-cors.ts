import { INestApplication } from '@nestjs/common';
import { BaseNestjsOptions } from '../types';

export function processCors(app: INestApplication, options: BaseNestjsOptions) {
	if (options.cors === false) return;
	app.enableCors({
		origin: Array.isArray(options.cors) ? options.cors : true,
		credentials: true,
	});
}
