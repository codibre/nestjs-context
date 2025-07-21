import { Test, TestingModule } from '@nestjs/testing';
import { BaseContextLogger, ContextLoggingModule } from '../src';
import { TestMetadata } from './test-utils';
import * as loggerFactoryLib from 'src/logger-factory';
import winston from 'winston';

// Test logger class
class TestLogger extends BaseContextLogger<TestMetadata> {}

describe(ContextLoggingModule.name, () => {
	let module: TestingModule;

	describe('forRoot', () => {
		beforeEach(async () => {
			jest
				.spyOn(loggerFactoryLib, 'loggerFactory')
				.mockReturnValue(new TestLogger(winston.createLogger()));
			module = await Test.createTestingModule({
				imports: [
					ContextLoggingModule.forRoot({
						logClass: TestLogger,
					}),
				],
			}).compile();
		});

		afterEach(async () => {
			if (module) {
				await module.close();
			}
		});

		it('should provide logger class', () => {
			// Act
			const result = module.get(TestLogger);

			// Assert
			expect(result).toBeDefined();
			expect(result).toBeInstanceOf(TestLogger);
			expect(result).toBeInstanceOf(BaseContextLogger);
		});

		it('should configure module properly', () => {
			// Act & Assert
			expect(module).toBeDefined();
			expect(() => module.get(TestLogger)).not.toThrow();
		});

		it('should export logger class', () => {
			// Act
			const result = module.get(TestLogger);

			// Assert
			expect(result.winstonLogger).toBeDefined();
			expect(typeof result.info).toBe('function');
		});

		it('should return dynamic module', () => {
			// Act
			const result = ContextLoggingModule.forRoot({
				logClass: TestLogger,
			});

			// Assert
			expect(result).toBeDefined();
			expect(result.module).toBe(ContextLoggingModule);
			expect(result.providers).toBeDefined();
			expect(result.exports).toBeDefined();
		});

		it('should have correct exports', () => {
			// Act
			const result = ContextLoggingModule.forRoot({
				logClass: TestLogger,
			});

			// Assert
			expect(result.exports).toContain(TestLogger);
		});

		it('should have correct providers', () => {
			// Act
			const result = ContextLoggingModule.forRoot({
				logClass: TestLogger,
			});

			// Assert
			expect(result.providers).toBeDefined();
			expect(Array.isArray(result.providers)).toBe(true);
			expect(result.providers!.length).toBeGreaterThan(0);
		});
	});
});
