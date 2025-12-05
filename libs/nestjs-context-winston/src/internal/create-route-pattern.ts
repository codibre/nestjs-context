import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const reflector = new Reflector();
export function createRoutePattern(
	context: ExecutionContext,
): string | undefined {
	if (!context || !context.getClass || !context.getHandler) return undefined;
	try {
		const controllerPath = reflector.get('path', context.getClass()) || '';
		const methodPath = reflector.get('path', context.getHandler()) || '';
		const combined = `${controllerPath}/${methodPath}`
			.replace(/\/+/g, '/')
			.replace(/\/$/, '');
		if (combined) return combined;
	} catch {
		// Ignore errors when getting route pattern
	}
}
