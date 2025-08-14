// Arrange
import { GoogleAuthGuardOptions } from 'src';
describe('GoogleAuthGuardOptions', () => {
	// Act & Assert
	it('should allow all options to be set and used', async () => {
		const options: GoogleAuthGuardOptions = {
			clientID: 'id',
			globalGuards: true,
			contextFilter: jest.fn().mockReturnValue(true),
			validate: jest.fn().mockResolvedValue(true),
			extractToken: jest.fn().mockReturnValue('token'),
			canIgnoreMissingToken: jest.fn().mockReturnValue(false),
		};
		expect(options.clientID).toBe('id');
		expect(options.globalGuards).toBe(true);
		expect(options.contextFilter!({} as any)).toBe(true);
		await expect(options.validate!({} as any)).resolves.toBe(true);
		expect(options.extractToken!({} as any)).toBe('token');
		expect(options.canIgnoreMissingToken!({} as any)).toBe(false);
	});
});
