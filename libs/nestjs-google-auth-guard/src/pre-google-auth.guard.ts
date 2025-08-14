import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthGuardOptions } from './google-auth-guard-options';
import { asyncStoreLoginTicket } from './internal/async-store-login-ticket';
import { defaultTokenExtractor } from './internal';

/**
 * Guard that establishes the async context for Google authentication as early as possible.
 *
 * Use this guard as one of the first guards in your controller or globally to ensure
 * AsyncLocalStorage is initialized before any other async guard runs. This helps preserve
 * access to Google login information throughout the request lifecycle, avoiding Node.js async context issues.
 *
 * @example
 * // In your controller or globally
 * @UseGuards(PreGoogleAuthGuard, OtherGuards...)
 *
 * @see https://github.com/codibre/nestjs-context#async-local-storage-caveat
 */
@Injectable()
export class PreGoogleAuthGuard implements CanActivate {
	private readonly client: OAuth2Client;

	/**
	 * Creates a new PreGoogleAuthGuard.
	 * @param options Google authentication guard options.
	 */
	constructor(private readonly options: GoogleAuthGuardOptions) {
		this.client = new OAuth2Client(options.clientID);
	}

	/**
	 * Establishes async context for Google authentication and stores the token if present.
	 *
	 * @param context The current execution context.
	 * @returns True if the request can proceed; throws if token is required but missing.
	 */
	canActivate(context: ExecutionContext): boolean | Promise<boolean> {
		if (
			asyncStoreLoginTicket.getStore() ||
			(this.options.contextFilter?.(context) ?? false)
		) {
			return true;
		}
		const extractToken = this.options.extractToken ?? defaultTokenExtractor;
		const token = extractToken(context);
		if (token) asyncStoreLoginTicket.enterWith({ token });
		else if (!this.options.canIgnoreMissingToken?.(context)) {
			throw new UnauthorizedException('No Authorization header');
		}
		return true;
	}
}
