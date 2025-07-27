import { ExecutionContext } from '@nestjs/common';

export function and(
	...filters: ((context: ExecutionContext) => boolean)[]
): (context: ExecutionContext) => boolean {
	return (context: ExecutionContext): boolean => {
		return filters.every((filter) => filter(context));
	};
}
