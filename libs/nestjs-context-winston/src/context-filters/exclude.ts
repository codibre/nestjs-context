import { ExecutionContext } from '@nestjs/common';

export function exclude(
	...filters: Array<(context: ExecutionContext) => boolean>
): (context: ExecutionContext) => boolean {
	return (context: ExecutionContext): boolean => {
		return !filters.some((filter) => filter(context));
	};
}
