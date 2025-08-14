import { OptPromise } from './types';
import { ExecutionContext } from '@nestjs/common';
import { LoginTicket } from 'google-auth-library';

/**
 * Options for configuring Google authentication guard behavior.
 *
 * @property clientID - The Google client ID to validate tokens against.
 * @property globalGuards - If true, applies guards globally; otherwise, use the decorator per controller.
 * @property contextFilter - Optional function to filter which contexts should be validated.
 * @property validate - Optional function for custom validation of the Google login ticket.
 * @property extractToken - Optional function to extract the token from the context (useful for non-HTTP apps).
 * @property canIgnoreMissingToken - Optional function to allow skipping validation if no token is present for a context.
 */
export interface GoogleAuthGuardOptions {
	/** The Google client ID to validate tokens against. */
	clientID: string;
	/**
	 * If true, applies guards globally to all controllers/routes. If false (default),
	 * you must use the UseGoogleAuth decorator on each controller you want to protect.
	 */
	globalGuards?: boolean;
	/**
	 * Optional function to filter which contexts should be validated. Useful for excluding
	 * certain controllers (e.g., health checks) when using global guards.
	 */
	contextFilter?(context: ExecutionContext): boolean;
	/**
	 * Optional function for custom validation of the Google login ticket.
	 * Allows for additional checks after Google authentication.
	 */
	validate?(ticket: LoginTicket): OptPromise<boolean | undefined>;
	/**
	 * Optional function to extract the token from the context. Useful if you are not using HTTP
	 * or have a custom way to provide the token.
	 */
	extractToken?(context: ExecutionContext): string | undefined;
	/**
	 * Optional function to allow skipping validation if no token is present for a context.
	 * Useful if you want to validate when a token is present, but allow unauthenticated access otherwise.
	 */
	canIgnoreMissingToken?(context: ExecutionContext): boolean;
}
