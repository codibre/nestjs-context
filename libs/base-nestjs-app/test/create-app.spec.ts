const listen = jest.fn();
jest.mock('../src/internal', () => ({
	getAdapter: jest.fn(() => ({})),
	listen,
	processCompression: jest.fn(),
	createModule: jest.fn(() => ({})),
	enableOpenApi: jest.fn(),
	processMSOptions: jest.fn((msOptions) => msOptions),
	addGetBodyHook: jest.fn(),
}));

const create = jest.fn();
jest.mock('@nestjs/core', () => ({
	NestFactory: {
		create,
	},
}));

import { createApp, DEFAULT_PORT } from '../src';
import { BaseNestjsOptions } from '../src';

describe('createApp', () => {
	it('should export DEFAULT_PORT', () => {
		expect(DEFAULT_PORT).toBe(3000);
	});

	it('should connect microservices if present', async () => {
		const connectMicroservice = jest.fn();
		const appMock = {
			enableCors: jest.fn(),
			enableVersioning: jest.fn(),
			connectMicroservice,
		};
		const options = {
			loggingModule: {} as any,
			imports: [],
			providers: [],
			microservices: [{ hybridOptions: {} }],
			server: {},
		} as BaseNestjsOptions;
		create.mockResolvedValue(appMock);
		const app = await createApp(options);
		expect(connectMicroservice).toHaveBeenCalledWith(
			{ hybridOptions: {} },
			{ inheritAppConfig: true },
		);
		expect(typeof app.start).toBe('function');
		await app.start();
		expect(listen).toHaveBeenCalledWith(appMock, options);
	});
});
