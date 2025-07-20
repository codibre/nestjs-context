import { HttpStatus } from '@nestjs/common';
import { defaultErrorLevelCallback } from './default-error-level-callback';

describe('defaultErrorLevelCallback', () => {
	it('should return HttpStatus.INTERNAL_SERVER_ERROR', () => {
		expect(defaultErrorLevelCallback()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
	});
});
