import * as ts from 'typescript';

/**
 * Helper function to create fallback property for unsupported member types
 */
function createFallbackProperty(
	factory: ts.NodeFactory,
): ts.PropertyDeclaration {
	return factory.createPropertyDeclaration(
		undefined,
		factory.createIdentifier('_unsupportedMember'),
		undefined,
		factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
		undefined,
	);
}

/**
 * Transform interface members to abstract class members
 */
function transformInterfaceMember(
	member: ts.TypeElement,
	factory: ts.NodeFactory,
): ts.ClassElement {
	// Transform property signatures to abstract properties
	if (ts.isPropertySignature(member)) {
		if (!member.name) return createFallbackProperty(factory);

		const modifiers: ts.Modifier[] = [];

		// Abstract modifier comes first
		modifiers.push(factory.createModifier(ts.SyntaxKind.AbstractKeyword));

		// Preserve readonly modifier if present (must come after abstract)
		if (
			member.modifiers?.some(
				(mod) => mod.kind === ts.SyntaxKind.ReadonlyKeyword,
			)
		) {
			modifiers.push(factory.createModifier(ts.SyntaxKind.ReadonlyKeyword));
		}

		return factory.createPropertyDeclaration(
			modifiers,
			member.name,
			member.questionToken,
			member.type,
			undefined,
		);
	}

	// Transform method signatures to abstract methods
	if (ts.isMethodSignature(member)) {
		if (!member.name) return createFallbackProperty(factory);

		return factory.createMethodDeclaration(
			[factory.createModifier(ts.SyntaxKind.AbstractKeyword)],
			undefined,
			member.name,
			member.questionToken,
			member.typeParameters,
			member.parameters,
			member.type,
			undefined,
		);
	}

	// Transform get accessor signatures to abstract getters
	if (ts.isGetAccessorDeclaration(member)) {
		if (!member.name) return createFallbackProperty(factory);

		return factory.createGetAccessorDeclaration(
			[factory.createModifier(ts.SyntaxKind.AbstractKeyword)],
			member.name,
			member.parameters,
			member.type,
			undefined,
		);
	}

	// Transform set accessor signatures to abstract setters
	if (ts.isSetAccessorDeclaration(member)) {
		if (!member.name) return createFallbackProperty(factory);

		return factory.createSetAccessorDeclaration(
			[factory.createModifier(ts.SyntaxKind.AbstractKeyword)],
			member.name,
			member.parameters,
			undefined,
		);
	}

	// Transform call signatures to abstract methods named 'call'
	if (ts.isCallSignatureDeclaration(member)) {
		return factory.createMethodDeclaration(
			[factory.createModifier(ts.SyntaxKind.AbstractKeyword)],
			undefined,
			factory.createIdentifier('call'),
			undefined,
			member.typeParameters,
			member.parameters,
			member.type,
			undefined,
		);
	}

	// Transform construct signatures to abstract methods named 'construct'
	if (ts.isConstructSignatureDeclaration(member)) {
		return factory.createMethodDeclaration(
			[factory.createModifier(ts.SyntaxKind.AbstractKeyword)],
			undefined,
			factory.createIdentifier('construct'),
			undefined,
			member.typeParameters,
			member.parameters,
			member.type,
			undefined,
		);
	}

	// For index signatures, create abstract indexer methods
	if (ts.isIndexSignatureDeclaration(member)) {
		const paramName =
			member.parameters[0]?.name || factory.createIdentifier('key');
		const paramType =
			member.parameters[0]?.type ||
			factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);

		return factory.createMethodDeclaration(
			[factory.createModifier(ts.SyntaxKind.AbstractKeyword)],
			undefined,
			factory.createComputedPropertyName(
				factory.createIdentifier('Symbol.iterator'),
			),
			undefined,
			undefined,
			[
				factory.createParameterDeclaration(
					undefined,
					undefined,
					paramName,
					undefined,
					paramType,
				),
			],
			member.type,
			undefined,
		);
	}

	// Fallback: create a comment for unsupported member types
	return createFallbackProperty(factory);
}

/**
 * Transform heritage clauses from interface to class context
 */
function transformHeritageClauses(
	heritageClauses: ts.NodeArray<ts.HeritageClause> | undefined,
	factory: ts.NodeFactory,
): ts.HeritageClause[] | undefined {
	if (!heritageClauses) return undefined;

	return heritageClauses.map((clause) => {
		// Convert interface extends to class extends/implements
		if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
			// For abstract classes, we'll use implements for now to avoid multiple inheritance issues
			// In a more sophisticated implementation, you might want to handle this differently
			return factory.createHeritageClause(
				ts.SyntaxKind.ImplementsKeyword,
				clause.types,
			);
		}

		return clause;
	});
}

/**
 * Transform a TypeScript interface declaration to an abstract class
 */
function transformInterfaceToAbstractClass(
	interfaceDecl: ts.InterfaceDeclaration,
	context: ts.TransformationContext,
): ts.ClassDeclaration {
	const factory = context.factory;

	// Create class modifiers (abstract + export if interface was exported)
	const modifiers: ts.Modifier[] = [
		factory.createModifier(ts.SyntaxKind.AbstractKeyword),
	];

	// Preserve export modifier if interface was exported
	const exportModifier = interfaceDecl.modifiers?.find(
		(m) => m.kind === ts.SyntaxKind.ExportKeyword,
	);
	if (exportModifier) {
		modifiers.unshift(factory.createModifier(ts.SyntaxKind.ExportKeyword));
	}

	// Transform interface members to abstract class members
	const members = interfaceDecl.members.map((member) =>
		transformInterfaceMember(member, factory),
	);

	// Create heritage clauses for extends/implements
	const heritageClauses = transformHeritageClauses(
		interfaceDecl.heritageClauses,
		factory,
	);

	return factory.createClassDeclaration(
		modifiers,
		interfaceDecl.name,
		interfaceDecl.typeParameters,
		heritageClauses,
		members,
	);
}

/**
 * TypeScript transformer that converts interface declarations to abstract classes
 */
export function createInterfaceToAbstractClassTransformer(): ts.TransformerFactory<ts.SourceFile> {
	return (context: ts.TransformationContext) => {
		return (sourceFile: ts.SourceFile) => {
			const visitor = (node: ts.Node): ts.Node => {
				// Transform interface declarations to abstract class declarations
				if (ts.isInterfaceDeclaration(node)) {
					return transformInterfaceToAbstractClass(node, context);
				}

				return ts.visitEachChild(node, visitor, context);
			};

			return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
		};
	};
}
