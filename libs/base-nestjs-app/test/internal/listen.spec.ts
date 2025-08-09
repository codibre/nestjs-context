import { listen } from '../../src/internal/listen';

describe('listen', () => {
	it('should call app.listen with default port and log url', async () => {
		const app = {
			listen: jest.fn(async () => undefined),
			getUrl: jest.fn(async () => 'http://localhost:3000'),
			startAllMicroservices: jest.fn(),
		};
		const logger = { info: jest.fn() };
		const options = {
			server: {},
			loggerModule: { logger },
			imports: [],
			providers: [],
		};
		const result = await listen(app as any, options as any);
		expect(app.listen).toHaveBeenCalledWith(3000, '0.0.0.0');
		expect(logger.info).toHaveBeenCalledWith(
			'Listening on http://localhost:3000',
		);
		expect(result).toBe(app);
	});

	it('should call startAllMicroservices if microservices are present', async () => {
		const app = {
			listen: jest.fn(async () => undefined),
			getUrl: jest.fn(async () => 'http://localhost:3000'),
			startAllMicroservices: jest.fn(),
		};
		const logger = { info: jest.fn() };
		const options = {
			server: {},
			loggerModule: { logger },
			imports: [],
			providers: [],
			microservices: [{}],
		};
		await listen(app as any, options as any);
		expect(app.startAllMicroservices).toHaveBeenCalled();
	});

	it('should use custom port if provided', async () => {
		const app = {
			listen: jest.fn(async () => undefined),
			getUrl: jest.fn(async () => 'http://localhost:4000'),
			startAllMicroservices: jest.fn(),
		};
		const logger = { info: jest.fn() };
		const options = {
			server: { port: 4000 },
			loggerModule: { logger },
			imports: [],
			providers: [],
		};
		await listen(app as any, options as any);
		expect(app.listen).toHaveBeenCalledWith(4000, '0.0.0.0');
	});
});
