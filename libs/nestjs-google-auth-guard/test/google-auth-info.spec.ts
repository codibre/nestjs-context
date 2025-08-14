// Arrange
import { GoogleAuthInfo } from '../src/google-auth-info';
import { UnauthorizedException } from '@nestjs/common';
import { LoginTicket } from 'google-auth-library';
import {
	asyncStoreLoginTicket,
	LoginInfo,
} from '../src/internal/async-store-login-ticket';
import { setImmediate } from 'timers/promises';

describe('GoogleAuthInfo', () => {
	let authInfo: GoogleAuthInfo;
	let store: LoginInfo;

	beforeEach(() => {
		authInfo = new GoogleAuthInfo();
	});

	// Act & Assert
	it('should return token if present', async () => {
		await setImmediate();
		store = {
			token: 'token',
			login: { getPayload: () => ({ email: 'test@email.com' }) } as LoginTicket,
		};
		asyncStoreLoginTicket.run(store, () => {
			// Assert
			expect(authInfo.getToken()).toBe('token');
			expect(authInfo.getLoginTicket()).toBe(store.login);
		});
	});

	it('should throw if required and store is missing', async () => {
		await setImmediate();
		authInfo = new GoogleAuthInfo();
		// Assert
		expect(() => authInfo.getToken(true)).toThrow(UnauthorizedException);
		expect(() => authInfo.getLoginTicket(true)).toThrow(UnauthorizedException);
	});
});
