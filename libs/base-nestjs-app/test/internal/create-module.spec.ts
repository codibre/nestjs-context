import { createModule } from '../../src/internal/create-module';

describe('createModule', () => {
	it('should be a function', () => {
		expect(typeof createModule).toBe('function');
	});

	it('should return a DynamicModule with default imports', () => {
		const options: any = {
			loggerModule: 'LoggerModule',
			providers: ['ProviderA'],
		};
		const mod = createModule(options);
		expect(mod.imports).toContain('LoggerModule');
		expect(mod.providers).toEqual(['ProviderA']);
	});

	it('should include custom imports', () => {
		const options: any = {
			imports: ['CustomModule'],
			loggerModule: 'LoggerModule',
			providers: ['ProviderA'],
		};
		const mod = createModule(options);
		expect(mod.imports).toEqual(['CustomModule', 'LoggerModule']);
	});
});
