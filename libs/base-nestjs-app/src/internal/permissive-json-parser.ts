import { FastifyError, FastifyRequest } from 'fastify';
import { ContentTypeParserDoneFunction } from 'fastify/types/content-type-parser';
import parse, { ParseOptions } from 'secure-json-parse';

export function permissiveJsonParserFactory(
	onProtoPoisoning: ParseOptions['protoAction'],
	onConstructorPoisoning: ParseOptions['constructorAction'],
) {
	return (
		_: FastifyRequest,
		body: string | Buffer<ArrayBufferLike>,
		done: ContentTypeParserDoneFunction,
	) => {
		if (body.length === 0) {
			done(null, {});
			return;
		}
		try {
			done(
				null,
				parse(body, {
					protoAction: onProtoPoisoning,
					constructorAction: onConstructorPoisoning,
				}),
			);
		} catch (err) {
			(err as FastifyError).statusCode = 400;
			done(err as FastifyError, undefined);
		}
	};
}
