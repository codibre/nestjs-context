import { listen } from '../../src/internal/listen';
import { createServer } from 'net';

jest.mock('net', () => ({
	createServer: jest.fn(() => ({
		listen: jest.fn((port, callback) => callback()),
		address: jest.fn(() => ({ port: 4000 })),
		close: jest.fn(),
		on: jest.fn(),
	})),
}));

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
			loggingModule: { logger },
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
			getMicroservices: jest.fn(() => []),
		};
		const logger = { info: jest.fn() };
		const options = {
			server: {},
			loggingModule: { logger },
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
			loggingModule: { logger },
			imports: [],
			providers: [],
		};
		await listen(app as any, options as any);
		expect(app.listen).toHaveBeenCalledWith(4000, '0.0.0.0');
	});

	it('should resolve microservice port conflicts', async () => {
		const app = {
			listen: jest.fn(async () => undefined),
			getUrl: jest.fn(async () => 'http://localhost:3000'),
			startAllMicroservices: jest.fn(),
			getMicroservices: jest.fn(() => [
				{ serverInstance: { port: 3000 } }, // conflicts with main port
				{ serverInstance: { port: 4000 } }, // no conflict
			]),
		};
		const logger = { info: jest.fn(), warn: jest.fn() };
		const options = {
			server: { port: 3000 },
			loggingModule: { logger },
			imports: [],
			providers: [],
			microservices: [{}],
		};
		await listen(app as any, options as any);
		expect(app.startAllMicroservices).toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringMatching(
				/Microservice port conflicted with main server port\. Changed microservice port to \d+/,
			),
		);
	});

	it('should not resolve port conflicts when microservice has no serverInstance', async () => {
		const app = {
			listen: jest.fn(async () => undefined),
			getUrl: jest.fn(async () => 'http://localhost:3000'),
			startAllMicroservices: jest.fn(),
			getMicroservices: jest.fn(() => [
				{}, // no serverInstance
				{ serverInstance: null }, // null serverInstance
			]),
		};
		const logger = { info: jest.fn(), warn: jest.fn() };
		const options = {
			server: { port: 3000 },
			loggingModule: { logger },
			imports: [],
			providers: [],
			microservices: [{}],
		};
		await listen(app as any, options as any);
		expect(app.startAllMicroservices).toHaveBeenCalled();
		expect(logger.warn).not.toHaveBeenCalled();
	});

	it('should throw error when server address cannot be obtained', async () => {
		const mockServer = {
			listen: jest.fn((port, callback) => callback()),
			address: jest.fn(() => null),
			close: jest.fn(),
			on: jest.fn(),
		};
		(createServer as any).mockImplementationOnce(() => mockServer);

		const app = {
			listen: jest.fn(async () => undefined),
			getUrl: jest.fn(async () => 'http://localhost:3000'),
			startAllMicroservices: jest.fn(),
			getMicroservices: jest.fn(() => [{ serverInstance: { port: 3000 } }]),
		};
		const logger = { info: jest.fn(), warn: jest.fn() };
		const options = {
			server: { port: 3000 },
			loggingModule: { logger },
			imports: [],
			providers: [],
			microservices: [{}],
		};

		await expect(listen(app as any, options as any)).rejects.toThrow(
			'Could not get server address',
		);
	});
});
