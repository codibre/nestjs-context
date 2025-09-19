import ts from 'typescript';
import { createInterfaceTransformerPlugin } from './plugin';

/**
 * Configuration for NestJS CLI to use the interface transformer plugin
 */
export interface NestCliPluginOptions {
	name: string;
	options: Record<string, unknown>;
}

/**
 * NestJS CLI configuration with interface transformer plugin
 */
export const nestCliConfig = {
	collection: '@nestjs/schematics',
	sourceRoot: 'src',
	compilerOptions: {
		deleteOutDir: true,
		plugins: [
			{
				name: 'nestjs-interface-transformer',
				options: {
					// Transform all interfaces by default
					interfacePattern: /.*Interface$/,
					// Exclude test files
					exclude: ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**'],
					// Include all TypeScript files
					include: ['**/*.ts'],
				},
			},
		],
	},
};

/**
 * Webpack configuration for custom transformers
 */
export const webpackTransformerConfig = {
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							getCustomTransformers: (_program: ts.Program) => {
								const plugin = createInterfaceTransformerPlugin();
								return {
									before: plugin.before
										? [plugin.before(undefined, _program)]
										: [],
								};
							},
						},
					},
				],
			},
		],
	},
};

/**
 * TypeScript configuration for the transformer
 */
export const tsTransformerConfig = {
	compilerOptions: {
		target: 'ES2020',
		module: 'commonjs',
		lib: ['ES2020'],
		experimentalDecorators: true,
		emitDecoratorMetadata: true,
		strict: true,
		esModuleInterop: true,
		skipLibCheck: true,
		forceConsistentCasingInFileNames: true,
	},
	include: ['src/**/*'],
	exclude: ['node_modules', '**/*.spec.ts', '**/*.test.ts'],
};
