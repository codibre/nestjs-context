import * as ts from 'typescript';

// TypeScript error codes
const TS_ERROR_TYPE_USED_AS_VALUE = 2693;

/**
 * Custom TypeScript checker that treats interfaces as values
 */
export class InterfaceAwareTypeChecker {
	private program: ts.Program;
	private checker: ts.TypeChecker;

	constructor(configPath: string) {
		const config = ts.readConfigFile(configPath, ts.sys.readFile);
		const parsedConfig = ts.parseJsonConfigFileContent(
			config.config,
			ts.sys,
			process.cwd(),
		);

		this.program = ts.createProgram({
			rootNames: parsedConfig.fileNames,
			options: parsedConfig.options,
		});

		this.checker = this.program.getTypeChecker();
	}

	/**
	 * Check files and suppress interface-as-value errors
	 */
	public getDiagnostics(): ts.Diagnostic[] {
		const allDiagnostics = [
			...this.program.getConfigFileParsingDiagnostics(),
			...this.program.getSyntacticDiagnostics(),
			...this.program.getSemanticDiagnostics(),
		];

		return allDiagnostics.filter((diagnostic) => {
			// Skip "type used as value" errors for interfaces that will be transformed
			if (diagnostic.code === TS_ERROR_TYPE_USED_AS_VALUE) {
				const sourceFile = diagnostic.file;
				if (sourceFile && diagnostic.start !== undefined) {
					const node = this.findNodeAtPosition(sourceFile, diagnostic.start);
					if (node && ts.isIdentifier(node)) {
						const symbol = this.checker.getSymbolAtLocation(node);
						if (
							symbol?.declarations?.some((decl) =>
								ts.isInterfaceDeclaration(decl),
							)
						) {
							return false; // Skip this error
						}
					}
				}
			}
			return true;
		});
	}

	private findNodeAtPosition(
		sourceFile: ts.SourceFile,
		position: number,
	): ts.Node | undefined {
		function find(node: ts.Node): ts.Node | undefined {
			if (position >= node.getStart() && position < node.getEnd()) {
				return ts.forEachChild(node, find) || node;
			}
			return undefined;
		}
		return find(sourceFile);
	}
}

/**
 * CLI tool to run custom type checking
 */
export function runCustomTypeCheck(configPath: string): boolean {
	const checker = new InterfaceAwareTypeChecker(configPath);
	const diagnostics = checker.getDiagnostics();

	if (diagnostics.length > 0) {
		const formatHost: ts.FormatDiagnosticsHost = {
			getCanonicalFileName: (path) => path,
			getCurrentDirectory: ts.sys.getCurrentDirectory,
			getNewLine: () => ts.sys.newLine,
		};

		console.error(
			ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost),
		);
		return false;
	}

	return true;
}

// CLI usage
if (require.main === module) {
	const configPath = process.argv[2] || 'tsconfig.json';
	const success = runCustomTypeCheck(configPath);
	process.exit(success ? 0 : 1);
}
