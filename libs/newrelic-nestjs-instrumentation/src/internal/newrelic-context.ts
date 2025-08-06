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
const tracer: MockedExposition | undefined = (newrelic as any).agent?.tracer;

export function getNewrelicContext(): NewRelicContext | undefined {
	return tracer?.getContext();
}

export function setNewrelicContext(context: NewRelicContext | undefined) {
	if (!context) return;
	tracer?._contextManager.setContext(context);
}
