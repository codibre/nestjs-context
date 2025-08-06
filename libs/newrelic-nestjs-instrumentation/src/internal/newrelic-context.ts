import newrelic from 'newrelic';

const newrelicContext: unique symbol = Symbol('newrelicContext');
export interface NewRelicContext {
	[newrelicContext]: unknown;
}

type MockedExposition = {
	getContext(): NewRelicContext;
	_contextManager: {
		setContext(context: NewRelicContext): void;
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
const tracer = (newrelic as any).agent.tracer as MockedExposition;

export function getNewrelicContext(): NewRelicContext {
	return tracer.getContext();
}

export function setNewrelicContext(context: NewRelicContext) {
	tracer._contextManager.setContext(context);
}
