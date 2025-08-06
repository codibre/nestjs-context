import 'jest-callslike';
import 'jest-extended';

const matchers = require('jest-extended');
expect.extend(matchers);
export const getContext = jest.fn();
export const setContext = jest.fn();
export const mockNewRelic = {
	agent: {
		tracer: {
			getContext,
			_contextManager: { setContext },
		},
	},
	getTraceMetadata: jest.fn(),
	startWebTransaction: jest.fn(),
	createBackgroundTransaction: jest.fn(),
	getTransaction: jest.fn(),
	endTransaction: jest.fn(),
	addAttribute: jest.fn(),
	setTransactionName: jest.fn(),
	incrementMetric: jest.fn(),
	recordMetric: jest.fn(),
	noticeError: jest.fn(),
	api: {
		createBackgroundTransaction: jest.fn(),
		getTransaction: jest.fn(),
		endTransaction: jest.fn(),
		addAttribute: jest.fn(),
		setTransactionName: jest.fn(),
		incrementMetric: jest.fn(),
		recordMetric: jest.fn(),
		noticeError: jest.fn(),
	},
	default: undefined as unknown,
};
mockNewRelic.default = mockNewRelic;
jest.mock('newrelic', () => mockNewRelic);
jest.mock('../src/internal', () => ({
	...jest.requireActual('../src/internal'),
	getNewrelicContext: jest.fn(() => ({ mocked: true })),
	setNewrelicContext: jest.fn(),
}));

jest.spyOn(console, 'error').mockImplementation(() => undefined);
afterEach(() => {
	jest.restoreAllMocks();
	jest.clearAllMocks();
});
