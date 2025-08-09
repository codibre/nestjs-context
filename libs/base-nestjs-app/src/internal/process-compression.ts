import { FastifyAdapter } from '@nestjs/platform-fastify';
import type * as CompressType from '@fastify/compress';
import { FastifyPluginOptions, FastifyRegisterOptions } from 'fastify';
import { BaseNestJsServerOptions } from 'src/types';

export async function processCompression(
	adapter: FastifyAdapter,
	serverOptions: BaseNestJsServerOptions | undefined,
) {
	const compression = serverOptions?.compression;
	if (!compression || compression === 'none') return;
	const compress = (require('@fastify/compress') as typeof CompressType)
		.fastifyCompress;
	let compressOptions: FastifyRegisterOptions<FastifyPluginOptions>;
	switch (compression) {
		case 'min':
			compressOptions = {
				global: true,
				encodings: ['gzip'],
				brotliOptions: { params: { 1: 2 } },
				zlibOptions: { level: 2 },
			};
			break;
		case 'average':
			compressOptions = {
				global: true,
				encodings: ['gzip'],
				brotliOptions: { params: { 1: 7 } },
				zlibOptions: { level: 6 },
			};
			break;
		case 'max':
			compressOptions = {
				global: true,
				encodings: ['gzip'],
				brotliOptions: { params: { 1: 11 } },
				zlibOptions: { level: 9 },
			};
			break;
		default:
			throw new Error(`Unknown compression option: ${compression}`);
	}
	await adapter.register(compress, compressOptions);
}
