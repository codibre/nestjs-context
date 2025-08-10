import { DynamicModule, NestHybridApplicationOptions } from '@nestjs/common';
import { ContextLoggingModuleInstance } from 'nestjs-context-winston';

export interface MSOptions {
	hybridOptions?: NestHybridApplicationOptions;
}

export type CompressionOptions = 'none' | 'min' | 'average' | 'max';

export interface BaseNestJsServerOptions {
	port?: number;
	bodyLimitMb?: number;
	http2?: boolean;
	compression?: CompressionOptions;
	maxParamLengthKb?: number;
	allowGetBody?: boolean;
}

export interface HealthCheckOptions {
	enabled: boolean;
	healthCheckRoute?: string;
}

/**
 * Options for configuring the base NestJS application.
 *
 * @property port - The port to listen on.
 * @property http2 - Whether to enable HTTP2 support.
 * @property compression - Compression options for Fastify.
 * @property microservices - Array of microservice configuration objects.
 */
export interface BaseNestjsOptions {
	server?: BaseNestJsServerOptions;
	loggingModule: ContextLoggingModuleInstance;
	imports: DynamicModule['imports'];
	providers?: DynamicModule['providers'];
	microservices?: MSOptions[];
	healthCheck?: HealthCheckOptions;
}
