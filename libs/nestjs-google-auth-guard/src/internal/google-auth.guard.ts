import { Injectable, CanActivate, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthGuardOptions } from '../google-auth-guard-options';
import { asyncStoreLoginTicket } from './async-store-login-ticket';

@Injectable()
export class GoogleAuthGuard implements CanActivate {
	private readonly client: OAuth2Client;
	constructor(private readonly options: GoogleAuthGuardOptions) {
		this.client = new OAuth2Client(options.clientID);
	}

	public async canActivate() {
		const store = asyncStoreLoginTicket.getStore();
		if (!store) return true;
		const loginTicket = await this.getLoginTicket(store.token);
		if (!loginTicket) throw new UnauthorizedException('Invalid Google token');
		store.login = loginTicket;
		let validationResult = this.options.validate?.(loginTicket);
		if (validationResult === undefined) return true;
		if (typeof validationResult !== 'boolean') {
			validationResult = await validationResult;
		}
		return validationResult ?? true;
	}

	private async getLoginTicket(token: string) {
		try {
			return await this.client.verifyIdToken({
				idToken: token,
				audience: this.options.clientID,
			});
		} catch {
			return undefined;
		}
	}
}
