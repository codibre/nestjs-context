import type { PackageJson } from 'read-pkg' with {
	'resolution-mode': 'require',
};
import path from 'path';

/**
 * Contains package.json data.
 *
 * @remarks
 * This object is intended for informational and diagnostic purposes.
 */
export const packageInfo: PackageJson = require(
	path.join(process.cwd(), 'package.json'),
);
