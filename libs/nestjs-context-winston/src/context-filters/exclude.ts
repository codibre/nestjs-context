import { ExecutionContext } from '@nestjs/common';

export function exclude(
	filter: (context: ExecutionContext) => boolean,
): (context: ExecutionContext) => boolean {
	return (context: ExecutionContext): boolean => {
		return !filter(context);
	};
}
