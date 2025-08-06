import { customNewrelicContext } from './internal/internal-context';
import newrelic from 'newrelic';

export function getTraceId(): string | undefined {
	return (
		customNewrelicContext.customTransactionId ??
		newrelic.getTraceMetadata()?.traceId
	);
}
