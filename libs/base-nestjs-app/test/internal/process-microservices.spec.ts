import { processMicroservices } from '../../src/internal/process-microservices';

jest.mock('../../src/internal', () => ({
	processMSOptions: jest.fn((msOptions) => msOptions),
}));

describe('processMicroservices', () => {
	const { processMSOptions } = require('../../src/internal');
	const mockApp = {
		connectMicroservice: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be a function', () => {
		expect(typeof processMicroservices).toBe('function');
	});

	it('should not connect microservices when none are provided', () => {
		// Arrange
		const options = {} as any;

		// Act
		processMicroservices(mockApp as any, options);

		// Assert
		expect(mockApp.connectMicroservice).not.toHaveBeenCalled();
	});

	it('should not connect microservices when array is empty', () => {
		// Arrange
		const options = { microservices: [] } as any;

		// Act
		processMicroservices(mockApp as any, options);

		// Assert
		expect(mockApp.connectMicroservice).not.toHaveBeenCalled();
	});

	it('should connect single microservice', () => {
		// Arrange
		const msOptions = { hybridOptions: { test: true } };
		const options = { microservices: [msOptions] } as any;

		// Act
		processMicroservices(mockApp as any, options);

		// Assert
		expect(processMSOptions).toHaveBeenCalledWith(msOptions);
		expect(mockApp.connectMicroservice).toHaveBeenCalledWith(msOptions, {
			inheritAppConfig: true,
			test: true,
		});
	});

	it('should connect multiple microservices', () => {
		// Arrange
		const msOptions1 = { hybridOptions: { option1: true } };
		const msOptions2 = { hybridOptions: { option2: false } };
		const options = { microservices: [msOptions1, msOptions2] } as any;

		// Act
		processMicroservices(mockApp as any, options);

		// Assert
		expect(processMSOptions).toHaveBeenCalledTimes(2);
		expect(processMSOptions).toHaveBeenNthCalledWith(1, msOptions1);
		expect(processMSOptions).toHaveBeenNthCalledWith(2, msOptions2);

		expect(mockApp.connectMicroservice).toHaveBeenCalledTimes(2);
		expect(mockApp.connectMicroservice).toHaveBeenNthCalledWith(1, msOptions1, {
			inheritAppConfig: true,
			option1: true,
		});
		expect(mockApp.connectMicroservice).toHaveBeenNthCalledWith(2, msOptions2, {
			inheritAppConfig: true,
			option2: false,
		});
	});

	it('should handle microservice options without hybridOptions', () => {
		// Arrange
		const msOptions = {};
		const options = { microservices: [msOptions] } as any;

		// Act
		processMicroservices(mockApp as any, options);

		// Assert
		expect(processMSOptions).toHaveBeenCalledWith(msOptions);
		expect(mockApp.connectMicroservice).toHaveBeenCalledWith(msOptions, {
			inheritAppConfig: true,
		});
	});
});
