import 'jest-callslike';
import 'jest-extended';

jest.spyOn(console, 'error').mockImplementation(() => undefined);
afterEach(() => {
	jest.restoreAllMocks();
	jest.clearAllMocks();
});
