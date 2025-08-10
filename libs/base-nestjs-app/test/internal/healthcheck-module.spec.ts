import { HealthCheckModule } from 'src/internal/healthcheck-module';
import { packageInfo } from 'src/package-info';

describe('HealthCheckModule', () => {
	it('should be a class', () => {
		expect(typeof HealthCheckModule).toBe('function');
	});

	it('should have a forRoot static method', () => {
		expect(typeof HealthCheckModule.forRoot).toBe('function');
	});

	it('should return a module with default route', () => {
		const module = HealthCheckModule.forRoot();
		expect(module.module).toBe(HealthCheckModule);
		expect(module.controllers).toHaveLength(1);
		expect(module.controller).toBeDefined();
	});

	it('should return a module with custom route', () => {
		const module = HealthCheckModule.forRoot('custom-health');
		expect(module.module).toBe(HealthCheckModule);
		expect(module.controllers).toHaveLength(1);
		expect(module.controller).toBeDefined();
	});

	it('should create a controller that returns health status', () => {
		const module = HealthCheckModule.forRoot();
		const Controller = module.controller;
		const instance = new Controller();
		const health = instance.health();

		expect(health).toEqual({
			status: 'pass',
			version: expect.any(String),
			releaseID: expect.any(String),
			serviceID: expect.any(String),
		});
	});

	it('should create a controller that returns health status', () => {
		const module = HealthCheckModule.forRoot();
		delete packageInfo.version;
		delete packageInfo.name;

		const Controller = module.controller;
		const instance = new Controller();
		const health = instance.health();

		expect(health).toEqual({
			status: 'pass',
			version: '0',
			releaseID: '0.0.0',
			serviceID: 'api',
		});
	});
});
