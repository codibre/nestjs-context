import { UseGuards, applyDecorators } from '@nestjs/common';
import { GoogleAuthGuard } from './internal';
import { PreGoogleAuthGuard } from './pre-google-auth.guard';

/**
 * Custom class decorator that applies PreGoogleAuthGuard and GoogleAuthGuard in order.
 */
export function UseGoogleAuth(): ClassDecorator {
	return applyDecorators(UseGuards(PreGoogleAuthGuard, GoogleAuthGuard));
}
