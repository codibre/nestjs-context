import winston from 'winston';

// Test metadata interface
export interface TestMetadata {
	userId: string;
	operation: string;
	requestId: string;
	count: number;
}

// Helper to create winston logger for testing
export function createTestWinstonLogger(): winston.Logger {
	return winston.createLogger({
		level: 'debug',
		format: winston.format.json(),
		transports: [
			new winston.transports.Console({
				silent: true, // Silence output during tests
			}),
		],
	});
}

// Mock execution context helper
export function createMockExecutionContext() {
	return {
		getHandler: jest.fn().mockReturnValue({ name: 'testMethod' }),
		getClass: jest.fn().mockReturnValue({ name: 'TestController' }),
		switchToHttp: jest.fn(),
		switchToRpc: jest.fn(),
		switchToWs: jest.fn(),
		getType: jest.fn(),
		getArgs: jest.fn(),
		getArgByIndex: jest.fn(),
	};
}
