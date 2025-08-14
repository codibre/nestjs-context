// Arrange
import { GoogleAuthModule } from '../src/google-auth-module';
describe('GoogleAuthModule', () => {
	// Act & Assert
	it('should return a dynamic module with correct providers and exports', () => {
		const options: any = { clientID: 'id', globalGuards: false };
		const mod = GoogleAuthModule.forRoot(options);
		expect(mod.module).toBe(GoogleAuthModule);
		expect(mod.providers).toBeDefined();
		expect(mod.exports).toContainEqual(expect.any(Function));
	});

	it('should add guards as providers if globalGuards is true', () => {
		const options: any = { clientID: 'id', globalGuards: true };
		const mod = GoogleAuthModule.forRoot(options);
		expect(mod.providers!.length).toBeGreaterThan(1);
	});
});
