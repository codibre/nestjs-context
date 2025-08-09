import { packageInfo } from '../src/package-info';

describe('packageInfo', () => {
	it('should be defined and contain name and version', () => {
		expect(packageInfo).toBeDefined();
		expect(typeof packageInfo.name).toBe('string');
		expect(typeof packageInfo.version).toBe('string');
	});
});
