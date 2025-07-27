import { ExecutionContext } from '@nestjs/common';

export function or(
	...filters: ((context: ExecutionContext) => boolean)[]
): (context: ExecutionContext) => boolean {
	return (context: ExecutionContext): boolean => {
		return filters.some((filter) => filter(context));
	};
}
