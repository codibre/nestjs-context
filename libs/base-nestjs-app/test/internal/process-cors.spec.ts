import { processCors } from '../../src/internal/process-cors';

describe('processCors', () => {
	const mockApp = {
		enableCors: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be a function', () => {
		expect(typeof processCors).toBe('function');
	});

	it('should enable CORS with permissive settings when cors is not set', () => {
		// Arrange
		const options = {} as any;

		// Act
		processCors(mockApp as any, options);

		// Assert
		expect(mockApp.enableCors).toHaveBeenCalledWith({
			origin: true,
			credentials: true,
		});
	});

	it('should enable CORS with permissive settings when cors is true', () => {
		// Arrange
		const options = { cors: true } as any;

		// Act
		processCors(mockApp as any, options);

		// Assert
		expect(mockApp.enableCors).toHaveBeenCalledWith({
			origin: true,
			credentials: true,
		});
	});

	it('should enable CORS with specific origins when cors is an array', () => {
		// Arrange
		const allowedOrigins = ['https://example.com', 'https://app.example.com'];
		const options = { cors: allowedOrigins } as any;

		// Act
		processCors(mockApp as any, options);

		// Assert
		expect(mockApp.enableCors).toHaveBeenCalledWith({
			origin: allowedOrigins,
			credentials: true,
		});
	});

	it('should not enable CORS when cors is false', () => {
		// Arrange
		const options = { cors: false } as any;

		// Act
		processCors(mockApp as any, options);

		// Assert
		expect(mockApp.enableCors).not.toHaveBeenCalled();
	});
});
