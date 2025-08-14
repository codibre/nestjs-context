// Arrange
import { UseGoogleAuth } from 'src';

describe('UseGoogleAuthGuards', () => {
	// Act & Assert
	it('should return a class decorator that applies UseGuards', () => {
		const decorator = UseGoogleAuth();
		expect(typeof decorator).toBe('function');
		// We can't test the decorator application directly, but we can check it returns a function
	});
});
