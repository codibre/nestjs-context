import { MSOptions } from 'src/types';
import { processMSOptions } from '../../src/internal/process-ms-options';

describe('processMSOptions', () => {
	it('should be a function', () => {
		expect(typeof processMSOptions).toBe('function');
	});

	it('should return the input options object', () => {
		const input = { hybridOptions: { some: 'value' } } as unknown as MSOptions;
		expect(processMSOptions(input)).toBe(input);
	});
});
