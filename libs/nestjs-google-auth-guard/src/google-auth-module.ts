import { APP_GUARD } from '@nestjs/core';
import { DynamicModule, Provider } from '@nestjs/common';
import { GoogleAuthGuardOptions } from './google-auth-guard-options';
import { GoogleAuthInfo } from './google-auth-info';
import { GoogleAuthGuard } from './internal';
import { PreGoogleAuthGuard } from './pre-google-auth.guard';

/**
 * Dynamic module for enabling Google authentication guards in a NestJS application.
 *
 * Use `forRoot` to configure the module with your Google client ID and options.
 *
 * If `globalGuards` is true, guards are applied globally; otherwise, use the decorator per controller.
 */
export class GoogleAuthModule {
	/**
	 * Registers the Google authentication guards and providers.
	 * @param options Configuration options for the Google authentication guard.
	 * @returns A dynamic module with the configured providers and guards.
	 */
	static forRoot(options: GoogleAuthGuardOptions): DynamicModule {
		const providers: Provider[] = [GoogleAuthInfo];

		if (options.globalGuards) {
			providers.push(
				{
					provide: APP_GUARD,
					useClass: PreGoogleAuthGuard,
				},
				{
					provide: APP_GUARD,
					useClass: GoogleAuthGuard,
				},
			);
		}

		return {
			module: GoogleAuthModule,
			providers,
			exports: [GoogleAuthInfo],
		};
	}
}
