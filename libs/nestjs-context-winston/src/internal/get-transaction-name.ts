import { ExecutionContext, Type } from '@nestjs/common';

export function getTransactionName(context: ExecutionContext) {
	const handler: Function | undefined = context.getHandler();
	const controller: Type | undefined = context.getClass();
	const transactionName = `${controller?.name ?? 'Unknown'}.${handler?.name ?? 'unknown'}`;
	return transactionName;
}
