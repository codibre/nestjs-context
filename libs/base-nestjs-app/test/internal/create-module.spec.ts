import { createModule } from '../../src/internal/create-module';

jest.mock('nestjs-context-winston', () => ({
	contextFilters: {
		matchController: jest.fn(() => 'mocked-filter'),
	},
}));

jest.mock('../../src/internal/healthcheck-module', () => ({
	HealthCheckModule: {
		forRoot: jest.fn(() => ({
			module: 'HealthCheckModule',
			controllers: ['HealthCheckController'],
			controller: 'HealthCheckController',
		})),
	},
}));

describe('createModule', () => {
	it('should be a function', () => {
		expect(typeof createModule).toBe('function');
	});

	it('should return a DynamicModule with default imports', () => {
		const excludeFilter = jest.fn();
		const options: any = {
			loggingModule: {
				excludeFilter,
			},
			providers: ['ProviderA'],
		};
		const mod = createModule(options);
		expect(mod.imports).toContain(options.loggingModule);
		expect(mod.providers).toEqual(['ProviderA']);
		expect(mod.imports).toHaveLength(2); // logging module + health check module
		expect(excludeFilter).toHaveBeenCalled();
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

	it('should include preImports before other imports', () => {
		const options: any = {
			preImports: ['PreModule1', 'PreModule2'],
			imports: ['CustomModule'],
			loggingModule: {
				excludeFilter: jest.fn(),
			},
			providers: ['ProviderA'],
		};
		const mod = createModule(options);
		expect(mod.imports).toEqual([
			'PreModule1',
			'PreModule2',
			options.loggingModule,
			expect.any(Object), // health check module
			'CustomModule',
		]);
	});

	it('should enable health check by default', () => {
		const excludeFilter = jest.fn();
		const options: any = {
			loggingModule: { excludeFilter },
		};
		const mod = createModule(options);
		expect(mod.imports).toHaveLength(2); // health check + logging module
		expect(excludeFilter).toHaveBeenCalled();
	});
});
