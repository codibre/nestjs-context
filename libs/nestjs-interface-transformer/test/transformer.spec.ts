import * as ts from 'typescript';
import { createInterfaceToAbstractClassTransformer } from '../src/transformer';

/**
 * Helper function to transform TypeScript code
 */
function transformCode(sourceCode: string): string {
	const transformer = createInterfaceToAbstractClassTransformer();
	const sourceFile = ts.createSourceFile(
		'test.ts',
		sourceCode,
		ts.ScriptTarget.ES2020,
		true,
	);

	const result = ts.transform(sourceFile, [transformer]);
	const transformedSourceFile = result.transformed[0];

	if (!transformedSourceFile) {
		throw new Error('Transformation failed');
	}

	const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
	const transformedCode = printer.printFile(transformedSourceFile);

	result.dispose();

	return transformedCode;
}

describe('InterfaceTransformer', () => {
	describe('interface to abstract class transformation', () => {
		it('should transform simple interface to abstract class', () => {
			// Arrange
			const sourceCode = `
        export interface UserService {
          getUserById(id: string): Promise<User>;
          createUser(userData: CreateUserDto): Promise<User>;
        }
      `;

			// Act
			const result = transformCode(sourceCode);

			// Assert
			expect(result).toContain('export abstract class UserService');
			expect(result).toContain(
				'abstract getUserById(id: string): Promise<User>;',
			);
			expect(result).toContain(
				'abstract createUser(userData: CreateUserDto): Promise<User>;',
			);
		});

		it('should transform interface with properties to abstract class', () => {
			// Arrange
			const sourceCode = `
        interface Repository {
          readonly connection: string;
          timeout?: number;
        }
      `;

			// Act
			const result = transformCode(sourceCode);

			// Assert
			expect(result).toContain('abstract class Repository');
			expect(result).toContain('abstract readonly connection: string;');
			expect(result).toContain('abstract timeout?: number;');
		});

		it('should transform generic interface to generic abstract class', () => {
			// Arrange
			const sourceCode = `
        interface Repository<T> {
          findById(id: string): Promise<T | null>;
          save(entity: T): Promise<T>;
        }
      `;

			// Act
			const result = transformCode(sourceCode);

			// Assert
			expect(result).toContain('abstract class Repository<T>');
			expect(result).toContain(
				'abstract findById(id: string): Promise<T | null>;',
			);
			expect(result).toContain('abstract save(entity: T): Promise<T>;');
		});

		it('should transform interface with heritage clause to abstract class', () => {
			// Arrange
			const sourceCode = `
        interface AdminUser extends User {
          permissions: string[];
          isActive: boolean;
        }
      `;

			// Act
			const result = transformCode(sourceCode);

			// Assert
			expect(result).toContain('abstract class AdminUser implements User');
			expect(result).toContain('abstract permissions: string[];');
			expect(result).toContain('abstract isActive: boolean;');
		});

		it('should preserve method signatures as abstract methods', () => {
			// Arrange
			const sourceCode = `
        interface Calculator {
          add(a: number, b: number): number;
          multiply(x: number, y: number): number;
        }
      `;

			// Act
			const result = transformCode(sourceCode);

			// Assert
			expect(result).toContain('abstract add(a: number, b: number): number;');
			expect(result).toContain(
				'abstract multiply(x: number, y: number): number;',
			);
		});

		it('should handle empty interfaces', () => {
			// Arrange
			const sourceCode = `
        interface EmptyInterface {
        }
      `;

			// Act
			const result = transformCode(sourceCode);

			// Assert
			expect(result).toContain('abstract class EmptyInterface');
		});
	});
});
