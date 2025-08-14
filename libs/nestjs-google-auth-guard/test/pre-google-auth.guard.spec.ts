// (Setup mocks and dependencies for PreGoogleAuthGuard)
import { PreGoogleAuthGuard } from '../src/pre-google-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GoogleAuthGuardOptions } from '../src/google-auth-guard-options';
import { asyncStoreLoginTicket } from '../src/internal/async-store-login-ticket';

describe('PreGoogleAuthGuard', () => {
	let guard: PreGoogleAuthGuard;
	let context: ExecutionContext;
	let options: GoogleAuthGuardOptions;
	let mockContextFilter: jest.Mock;
	let mockExtractToken: jest.Mock;
	let mockCanIgnoreMissingToken: jest.Mock;

	beforeEach(() => {
		mockContextFilter = jest.fn();
		mockExtractToken = jest.fn();
		mockCanIgnoreMissingToken = jest.fn();
		options = {
			clientID: 'test-client-id',
			contextFilter: mockContextFilter,
			extractToken: mockExtractToken,
			canIgnoreMissingToken: mockCanIgnoreMissingToken,
		};
		guard = new PreGoogleAuthGuard(options);
		context = {
			switchToHttp: jest.fn(),
			getType: jest.fn(),
			// ...other ExecutionContext methods as needed
		} as any;
	});

	// Act & Assert
	it('should return true if asyncStoreLoginTicket already set', () => {
		asyncStoreLoginTicket.enterWith({ token: 'abc' });
		expect(guard.canActivate(context)).toBe(true);
	});

	it('should return true if contextFilter returns true', () => {
		mockContextFilter.mockReturnValue(true);
		asyncStoreLoginTicket.enterWith(undefined as any);
		expect(guard.canActivate(context)).toBe(true);
	});

	it('should store token and return true if token is present', () => {
		mockContextFilter.mockReturnValue(false);
		mockExtractToken.mockReturnValue('token-123');
		asyncStoreLoginTicket.enterWith(undefined as any);
		expect(guard.canActivate(context)).toBe(true);
	});

	it('should throw UnauthorizedException if no token and cannot ignore missing token', () => {
		mockContextFilter.mockReturnValue(false);
		mockExtractToken.mockReturnValue(undefined);
		mockCanIgnoreMissingToken.mockReturnValue(false);
		asyncStoreLoginTicket.enterWith(undefined as any);
		expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
	});

	it('should return true if no token and can ignore missing token', () => {
		mockContextFilter.mockReturnValue(false);
		mockExtractToken.mockReturnValue(undefined);
		mockCanIgnoreMissingToken.mockReturnValue(true);
		asyncStoreLoginTicket.enterWith(undefined as any);
		expect(guard.canActivate(context)).toBe(true);
	});
});
