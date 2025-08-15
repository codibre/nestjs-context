const ts = require('typescript');

function stripDecoratorsTransformer(context) {
	// 1. Remove all decorators
	function visit(node) {
		if (ts.hasDecorators?.(node)) {
			return ts.factory.replaceDecoratorsAndModifiers(
				node,
				undefined,
				ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined,
			);
		}
		return ts.visitEachChild(node, visit, context);
	}

	// 2. Collect all used identifiers in the file (after decorator removal), skipping import declarations
	function collectUsedIdentifiers(node, used = new Set()) {
		function visitId(n) {
			// Skip import declarations
			if (ts.isImportDeclaration(n)) return;
			if (ts.isImportClause(n)) return;
			if (ts.isImportSpecifier(n)) return;
			if (ts.isNamespaceImport(n)) return;
			if (ts.isNamedImports(n)) return;
			if (ts.isIdentifier(n)) {
				used.add(n.text);
			}
			ts.forEachChild(n, visitId);
		}
		visitId(node);
		return used;
	}

	return (sourceFile) => {
		// First, strip decorators from the AST
		const strippedSourceFile = ts.visitNode(sourceFile, visit);

		// Then, collect all used identifiers (excluding import declarations)
		const used = collectUsedIdentifiers(strippedSourceFile);

		// 3. Remove unused imports (but keep side-effect-only imports)
		const unusedImports = [];
		const updatedStatements = [];
		for (const stmt of strippedSourceFile.statements) {
			if (
				ts.isImportDeclaration(stmt) &&
				stmt.importClause &&
				stmt.moduleSpecifier
			) {
				// Side-effect-only import: import "foo";
				if (!stmt.importClause.name && !stmt.importClause.namedBindings) {
					updatedStatements.push(stmt);
					continue;
				}
				// If none of the imported bindings (default or named) are used, remove the import
				let allUnused = true;
				if (stmt.importClause.name && used.has(stmt.importClause.name.text)) {
					allUnused = false;
				}
				if (
					stmt.importClause.namedBindings &&
					ts.isNamedImports(stmt.importClause.namedBindings)
				) {
					for (const el of stmt.importClause.namedBindings.elements) {
						if (used.has(el.name.text)) {
							allUnused = false;
							break;
						}
					}
				}
				if (allUnused) {
					unusedImports.push(stmt.moduleSpecifier.text);
					continue; // Remove this import
				}
			}
			updatedStatements.push(stmt);
		}

		if (unusedImports.length > 0) {
			 
			console.log('Unused imports removed:', unusedImports);
		}

		// Return the updated source file
		return ts.factory.updateSourceFile(strippedSourceFile, updatedStatements);
	};
}

module.exports = {
	before: (program, opts) => (context) => stripDecoratorsTransformer(context),
};
