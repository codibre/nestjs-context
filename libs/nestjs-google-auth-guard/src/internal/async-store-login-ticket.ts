import { LoginTicket } from 'google-auth-library';
import { AsyncLocalStorage } from 'async_hooks';

export interface LoginInfo {
	login?: LoginTicket;
	token: string;
}

export const asyncStoreLoginTicket = new AsyncLocalStorage<LoginInfo>();
