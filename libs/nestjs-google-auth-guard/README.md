# nestjs-google-auth-guard

A NestJS module for authenticating requests using Google OAuth tokens. Provides flexible options for token extraction, context filtering, and custom validation, with support for both global and per-controller guard application.

## Features
- Validates Bearer tokens in the `Authorization` header using Google Auth and your provided `client_id`.
- Supports custom token extraction (for non-HTTP or custom scenarios).
- Allows filtering which contexts are validated (e.g., skip health checks).
- Optionally ignores validation if no token is present for a context.
- Supports custom validation logic after Google login.
- Provides easy access to Google login ticket via dependency injection.
- Can be applied globally or per-controller.

## Installation

```sh
npm install nestjs-google-auth-guard
```

## Usage

### 1. Register the Module

```typescript
import { GoogleAuthModule } from 'nestjs-google-auth-guard';

@Module({
  imports: [
    GoogleAuthModule.forRoot({
      clientID: 'YOUR_GOOGLE_CLIENT_ID',
      // Optional advanced options below
      // globalGuards: true,
      // contextFilter: (ctx) => true,
      // extractToken: (ctx) => customTokenExtractor(ctx),
      // canIgnoreMissingToken: (ctx) => false,
      // validate: async (ticket) => true,
    }),
  ],
})
export class AppModule {}
```

### 2. Protect Controllers

- **Global Guards**: If `globalGuards` is `true`, all controllers are protected unless filtered out by `contextFilter`.
- **Per-Controller**: If `globalGuards` is `false` (default), use the `@UseGoogleAuth()` decorator on each controller you want to protect.

```typescript
import { UseGoogleAuth } from 'nestjs-google-auth-guard';

@UseGoogleAuth()
@Controller('my-protected')
export class MyProtectedController {}
```

### 3. Access Google Login Info

Inject `GoogleAuthInfo` to access the Google login ticket and token for the current request:

```typescript
import { GoogleAuthInfo } from 'nestjs-google-auth-guard';

@Injectable()
export class MyService {
  constructor(private readonly authInfo: GoogleAuthInfo) {}

  getUserEmail(): string | undefined {
    return this.authInfo.getLoginTicket()?.getPayload()?.email;
  }
}
```

## Options

- `clientID` (**required**): Your Google OAuth client ID.
- `globalGuards` (default: `false`): If `true`, guards are applied globally.
- `contextFilter(context)`: Filter which contexts are validated (e.g., skip health checks).
- `extractToken(context)`: Custom function to extract the token (for non-HTTP or custom scenarios).
- `canIgnoreMissingToken(context)`: If `true`, skips validation if no token is present for the context.
- `validate(ticket)`: Custom validation logic after Google login.


## AsyncLocalStorage Caveat

`GoogleAuthInfo` uses AsyncLocalStorage to store login information. If any guard with an async `canActivate` runs before GoogleAuth, async context may be lost (Node.js limitation).

**How to avoid this:**
- Use the `validate` option to store the login ticket in a safe async local storage if needed (one you initialize before any async guard).
- Avoid having async guards before GoogleAuth.
- **Alternatively,** you can manually set `PreGoogleAuthGuard` as one of the first guards to be executed. This ensures the async context is established before any other async guard runs, preserving access to login information throughout the request lifecycle.

## License
MIT
