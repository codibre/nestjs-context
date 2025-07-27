import { ExecutionContext, Type } from '@nestjs/common';

export function matchController(
	controller: Type,
): (context: ExecutionContext) => boolean {
	return (context: ExecutionContext): boolean => {
		return (
			context.getClass() === controller ||
			context.getHandler().prototype instanceof controller
		);
	};
}
