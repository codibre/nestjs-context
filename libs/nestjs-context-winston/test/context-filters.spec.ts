import { ExecutionContext } from '@nestjs/common';
import * as contextFilters from '../src/context-filters';

describe('contextFilters', () => {
	class DummyController {}
	class HealthCheckController {}

	const makeContext = (controller: any): ExecutionContext =>
		({
			getType: () => 'http',
			getClass: () => controller,
			getHandler: () => ({ prototype: {} }),
		}) as any;

	it('matchController should match the given controller', () => {
		const ctx = makeContext(DummyController);
		expect(contextFilters.matchController(DummyController)(ctx)).toBe(true);
		expect(contextFilters.matchController(HealthCheckController)(ctx)).toBe(
			false,
		);
	});

	it('exclude should invert the result of the filter', () => {
		const ctx = makeContext(HealthCheckController);
		const filter = contextFilters.exclude(
			contextFilters.matchController(HealthCheckController),
		);
		expect(filter(ctx)).toBe(false);
		const filter2 = contextFilters.exclude(
			contextFilters.matchController(DummyController),
		);
		expect(filter2(ctx)).toBe(true);
	});

	it('and should combine filters with AND logic', () => {
		const ctx = makeContext(DummyController);
		const filter = contextFilters.and(
			contextFilters.matchController(DummyController),
			() => true,
		);
		expect(filter(ctx)).toBe(true);
		const filter2 = contextFilters.and(
			contextFilters.matchController(DummyController),
			() => false,
		);
		expect(filter2(ctx)).toBe(false);
	});

	it('or should combine filters with OR logic', () => {
		const ctx = makeContext(DummyController);
		const filter = contextFilters.or(
			contextFilters.matchController(DummyController),
			() => false,
		);
		expect(filter(ctx)).toBe(true);
		const filter2 = contextFilters.or(
			contextFilters.matchController(HealthCheckController),
			() => false,
		);
		expect(filter2(ctx)).toBe(false);
	});
});
