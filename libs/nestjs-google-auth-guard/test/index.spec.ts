// Arrange
import * as index from 'src';

describe('index exports', () => {
	// Act & Assert
	it('should export expected modules and types', () => {
		expect(index.GoogleAuthInfo).toBeDefined();
		expect(index.GoogleAuthModule).toBeDefined();
	});
});
