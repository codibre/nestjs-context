import { INestApplication } from '@nestjs/common';

/**
 * Base interface for NestJS applications.
 */
export interface BaseNestApplication extends INestApplication {
	/**
	 * Starts the NestJS application and listens on the configured port.
	 * It also starts connected microservices.
	 */
	start(): Promise<unknown>;
}
