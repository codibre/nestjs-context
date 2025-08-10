import { createModule } from '../../src/internal/create-module';

describe('createModule', () => {
	it('should be a function', () => {
		expect(typeof createModule).toBe('function');
	});

	it('should return a DynamicModule with default imports', () => {
		const options: any = {
			loggingModule: {
				excludeFilter: jest.fn(),
			},
			providers: ['ProviderA'],
		};
		const mod = createModule(options);
		expect(mod.imports).toContain(options.loggingModule);
		expect(mod.providers).toEqual(['ProviderA']);
	});

	it('should include custom imports', () => {
		const options: any = {
			imports: ['CustomModule'],
			loggingModule: {
				excludeFilter: jest.fn(),
			},
			providers: ['ProviderA'],
		};
		const mod = createModule(options);
		expect(mod.imports).toEqual([
			options.loggingModule,
			expect.any(Object), // health check module
			'CustomModule',
		]);
	});

	it('should include health check module when enabled', () => {
		const excludeFilter = jest.fn();
		const options: any = {
			loggingModule: { excludeFilter },
			healthCheck: { enabled: true, healthCheckRoute: 'health' },
		};
		const mod = createModule(options);
		expect(mod.imports).toHaveLength(2); // health check + logging module
		expect(excludeFilter).toHaveBeenCalled();
	});

	it('should not include health check module when disabled', () => {
		const excludeFilter = jest.fn();
		const options: any = {
			loggingModule: { excludeFilter },
			healthCheck: { enabled: false },
		};
		const mod = createModule(options);
		expect(mod.imports).toHaveLength(1); // only logging module
		expect(excludeFilter).not.toHaveBeenCalled();
	});
});
