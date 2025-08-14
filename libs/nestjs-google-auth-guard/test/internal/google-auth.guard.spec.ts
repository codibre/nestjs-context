import { GoogleAuthGuard } from '../../src/internal/google-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { asyncStoreLoginTicket } from '../../src/internal/async-store-login-ticket';

describe('GoogleAuthGuard', () => {
	let guard: GoogleAuthGuard;
	let options: any;
	let verifyIdTokenMock: jest.Mock;

	beforeEach(() => {
		verifyIdTokenMock = jest.fn();
		jest
			.spyOn(OAuth2Client.prototype, 'verifyIdToken')
			.mockImplementation(verifyIdTokenMock);
		options = { clientID: 'id', validate: undefined };
		guard = new GoogleAuthGuard(options);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should return true if no store', async () => {
		jest.spyOn(asyncStoreLoginTicket, 'getStore').mockReturnValue(undefined);
		await expect(guard.canActivate()).resolves.toBe(true);
	});

	it('should throw if token is invalid', async () => {
		jest
			.spyOn(asyncStoreLoginTicket, 'getStore')
			.mockReturnValue({ token: 'bad' });
		verifyIdTokenMock.mockRejectedValue(new Error('fail'));
		await expect(guard.canActivate()).rejects.toThrow(UnauthorizedException);
	});

	it('should store login ticket and return true if valid and no validate option', async () => {
		const loginTicket = { getPayload: () => ({}) };
		jest
			.spyOn(asyncStoreLoginTicket, 'getStore')
			.mockReturnValue({ token: 'good' });
		verifyIdTokenMock.mockResolvedValue(loginTicket);
		await expect(guard.canActivate()).resolves.toBe(true);
	});

	it('should return true if validate returns undefined', async () => {
		const loginTicket = { getPayload: () => ({}) };
		jest
			.spyOn(asyncStoreLoginTicket, 'getStore')
			.mockReturnValue({ token: 'good' });
		verifyIdTokenMock.mockResolvedValue(loginTicket);
		options.validate = jest.fn().mockReturnValue(undefined);
		guard = new GoogleAuthGuard(options);
		await expect(guard.canActivate()).resolves.toBe(true);
	});

	it('should return false if validate returns false', async () => {
		const loginTicket = { getPayload: () => ({}) };
		jest
			.spyOn(asyncStoreLoginTicket, 'getStore')
			.mockReturnValue({ token: 'good' });
		verifyIdTokenMock.mockResolvedValue(loginTicket);
		options.validate = jest.fn().mockReturnValue(false);
		guard = new GoogleAuthGuard(options);
		await expect(guard.canActivate()).resolves.toBe(false);
	});

	it('should await validate if it returns a promise', async () => {
		const loginTicket = { getPayload: () => ({}) };
		jest
			.spyOn(asyncStoreLoginTicket, 'getStore')
			.mockReturnValue({ token: 'good' });
		verifyIdTokenMock.mockResolvedValue(loginTicket);
		options.validate = jest.fn().mockResolvedValue(true);
		guard = new GoogleAuthGuard(options);
		await expect(guard.canActivate()).resolves.toBe(true);
	});
});
