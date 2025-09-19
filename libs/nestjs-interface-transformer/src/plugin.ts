import * as ts from 'typescript';
import { createInterfaceToAbstractClassTransformer } from './transformer';

export interface InterfaceTransformerOptions {
	/**
	 * Pattern to match interface names that should be transformed
	 * Default: all interfaces are transformed
	 */
	interfacePattern?: RegExp;

	/**
	 * Whether to preserve original interface files alongside transformed classes
	 * Default: false
	 */
	preserveOriginals?: boolean;

	/**
	 * Suffix to add to transformed class names
	 * Default: no suffix
	 */
	classSuffix?: string;

	/**
	 * File patterns to include in transformation
	 * Default: all .ts files
	 */
	include?: string[];

	/**
	 * File patterns to exclude from transformation
	 * Default: node_modules, *.spec.ts, *.test.ts
	 */
	exclude?: string[];
}

/**
 * Plugin interface for TypeScript transformers
 */
export interface Plugin {
	name: string;
	before(
		options: unknown,
		program: ts.Program,
	): ts.TransformerFactory<ts.SourceFile>;
	after?(_program: ts.Program): ts.TransformerFactory<ts.SourceFile>;
	afterDeclarations?(
		_program: ts.Program,
	): ts.TransformerFactory<ts.SourceFile | ts.Bundle>;
}

/**
 * NestJS CLI Plugin for transforming interfaces to abstract classes
 */
export class InterfaceTransformerPlugin implements Plugin {
	public readonly name = 'nestjs-interface-transformer';

	constructor(private readonly options: InterfaceTransformerOptions = {}) {}

	/**
	 * Initialize the plugin with the TypeScript program
	 */
	before(
		_options: unknown,
		_program: ts.Program,
	): ts.TransformerFactory<ts.SourceFile> {
		return createInterfaceToAbstractClassTransformer();
	}
}

/**
 * Factory function for creating the plugin instance
 */
export function createInterfaceTransformerPlugin(
	options?: InterfaceTransformerOptions,
): InterfaceTransformerPlugin {
	return new InterfaceTransformerPlugin(options);
}

/**
 * Plugin factory function compatible with NestJS CLI
 * This is the function that NestJS CLI will call to create the plugin
 */
export const name = 'nestjs-interface-transformer';
export function before(
	_opts: unknown,
	_program: ts.Program,
): ts.TransformerFactory<ts.SourceFile> {
	return createInterfaceToAbstractClassTransformer();
}
