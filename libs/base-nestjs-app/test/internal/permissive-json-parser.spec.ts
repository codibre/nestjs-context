import { permissiveJsonParserFactory } from '../../src/internal/permissive-json-parser';

describe('permissiveJsonParserFactory', () => {
	let mockDone: jest.Mock;
	let mockRequest: any;

	beforeEach(() => {
		mockDone = jest.fn();
		mockRequest = {};
	});

	it('should be a function', () => {
		expect(typeof permissiveJsonParserFactory).toBe('function');
	});

	it('should return a parser function', () => {
		const parser = permissiveJsonParserFactory('ignore', 'ignore');
		expect(typeof parser).toBe('function');
	});

	describe('parser function', () => {
		it('should return empty object for empty body', () => {
			const parser = permissiveJsonParserFactory('ignore', 'ignore');
			parser(mockRequest, '', mockDone);

			expect(mockDone).toHaveBeenCalledWith(null, {});
		});

		it('should return empty object for empty buffer', () => {
			const parser = permissiveJsonParserFactory('ignore', 'ignore');
			parser(mockRequest, Buffer.from(''), mockDone);

			expect(mockDone).toHaveBeenCalledWith(null, {});
		});

		it('should parse valid JSON successfully', () => {
			const parser = permissiveJsonParserFactory('ignore', 'ignore');
			const testData = { key: 'value', number: 42 };
			parser(mockRequest, JSON.stringify(testData), mockDone);

			expect(mockDone).toHaveBeenCalledWith(null, testData);
		});

		it('should handle invalid JSON with statusCode 400', () => {
			const parser = permissiveJsonParserFactory('ignore', 'ignore');
			const invalidJson = '{ invalid json }';
			parser(mockRequest, invalidJson, mockDone);

			expect(mockDone).toHaveBeenCalledTimes(1);
			const [error] = mockDone.mock.calls[0];
			expect(error).toBeInstanceOf(Error);
			expect(error.statusCode).toBe(400);
		});

		it('should pass protoAction and constructorAction to secure-json-parse', () => {
			const parser = permissiveJsonParserFactory('error', 'remove');
			const testData = { key: 'value' };
			parser(mockRequest, JSON.stringify(testData), mockDone);

			expect(mockDone).toHaveBeenCalledWith(null, testData);
		});

		it('should handle Buffer input', () => {
			const parser = permissiveJsonParserFactory('ignore', 'ignore');
			const testData = { buffer: true };
			const buffer = Buffer.from(JSON.stringify(testData));
			parser(mockRequest, buffer, mockDone);

			expect(mockDone).toHaveBeenCalledWith(null, testData);
		});
	});
});
