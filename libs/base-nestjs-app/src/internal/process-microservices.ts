import { INestApplication } from '@nestjs/common';
import { processMSOptions } from '.';
import { BaseNestjsOptions } from '../types';

export function processMicroservices(
	app: INestApplication,
	options: BaseNestjsOptions,
) {
	options.microservices?.forEach((msOptions) => {
		app.connectMicroservice(processMSOptions(msOptions), {
			inheritAppConfig: true,
			...msOptions.hybridOptions,
		});
	});
}
