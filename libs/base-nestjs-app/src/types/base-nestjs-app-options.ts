import {
	DynamicModule,
	InjectionToken,
	NestHybridApplicationOptions,
} from '@nestjs/common';
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

export interface GlobalInjections {
	/**
	 * Injection tokens for global filters
	 */
	filters?: InjectionToken[];

	/**
	 * Injection tokens for global guards
	 */
	guards?: InjectionToken[];

	/**
	 * Injection tokens for global interceptors
	 */
	interceptors?: InjectionToken[];
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
	/**
	 * Server configuration options.
	 */
	server?: BaseNestJsServerOptions;
	/**
	 * Logging module instance.
	 */
	loggingModule: ContextLoggingModuleInstance;
	/**
	 * CORS configuration options.
	 */
	cors?: boolean | string[];
	/**
	 * Optional imports that will be added before everyone else
	 * Use it if you need to guarantee a specific module loading order.
	 */
	preImports?: DynamicModule['imports'];
	/**
	 * Imports to be added. Will be imported after loggingModule
	 */
	imports: DynamicModule['imports'];
	/**
	 * Providers to be added.
	 */
	providers?: DynamicModule['providers'];
	/**
	 * Microservices configuration options, if you want to use a hybrid app
	 */
	microservices?: MSOptions[];
	/**
	 * Healthcheck options. If not informed, GET /health-check will be added
	 * by default.
	 */
	healthCheck?: HealthCheckOptions;

	/**
	 * Allow to inject global filters, guards, and interceptors.
	 */
	globals?: GlobalInjections;
}
