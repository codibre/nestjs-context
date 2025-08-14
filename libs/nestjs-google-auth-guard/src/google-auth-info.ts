import { LoginTicket } from 'google-auth-library';
import { asyncStoreLoginTicket, LoginInfo } from './internal';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OptRequired } from './types';

/**
 * Injectable service to access Google authentication information for the current request.
 *
 * Uses AsyncLocalStorage to store and retrieve the Google login ticket and token.
 * Note: If any guard with an async canActivate runs before GoogleAuth, async context may be lost (Node.js limitation).
 */
@Injectable()
export class GoogleAuthInfo {
	/**
	 * Internal method to retrieve the login info from async local storage.
	 * Throws UnauthorizedException if required is true and no login info is present.
	 * @param required Whether login info is required (throws if missing)
	 */
	private store(required: boolean): OptRequired<typeof required, LoginInfo> {
		const store = asyncStoreLoginTicket.getStore();
		if (required && !store) {
			throw new UnauthorizedException('Login not stablished');
		}
		return store;
	}

	/**
	 * Returns the Google token for the current request, or undefined if not present.
	 * @param required If true, throws if token is missing.
	 */
	public getToken(required = false): OptRequired<typeof required, string> {
		return this.store(required)?.token;
	}

	/**
	 * Returns the Google LoginTicket for the current request, or undefined if not present.
	 * @param required If true, throws if login ticket is missing.
	 */
	public getLoginTicket(
		required = false,
	): OptRequired<typeof required, LoginTicket> {
		return this.store(required)?.login;
	}
}
