# nestjs-decorators-stripper

Remove all decorators from your NestJS (or TypeScript) source code before transpiling.

## What is this?

`nestjs-decorators-stripper` is a build-time tool (TypeScript transformer) that removes all decorators from your codebase before compilation. This is useful for scenarios where you want to share code (such as models or DTOs) between backend and frontend, but only want decorators present in one of the builds.

## Why would you use it?

- **Dual-target libraries:** If you have a shared package (e.g., models or DTOs) used in both backend (NestJS) and frontend (React, Angular, etc.), you may want decorators (like validation, Swagger, or serialization) in one build but not the other.
- **Reduce bundle size:** Remove unnecessary decorator metadata from production builds.
- **Avoid runtime dependencies:** Eliminate the need for `reflect-metadata` or decorator-related libraries (like @nestjs/swagger) in environments where they're not needed or wanted.
- **Security/obfuscation:** Remove sensitive or internal metadata from distributed code.

## Example Use Case

Suppose you have a shared model package. You want:
- A backend build (with decorators, for validation, Swagger, etc.)
- A frontend build (without decorators, for minimal bundle size and no `reflect-metadata`)

You can use `nestjs-decorators-stripper` in your build pipeline to generate the decorator-free bundle.

## How to use

1. **Install the transformer** (as a dev dependency):

```sh
npm install --save-dev nestjs-decorators-stripper
```

2. **Configure your NestJS CLI (or ts-patch/ttypescript) to use the transformer.**

Example `nest-cli-front.json`:

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "assets": ["**/*.hbs"],
    "deleteOutDir": true,
    "tsConfigPath": "tsconfig.front.json",
    "plugins": [
      "strip-decorators-transformer"
    ]
  },
  "scripts": {
    "prebuild": "rimraf dist"
  }
}
```

3. **Build with the custom config:**

```sh
nest build --config nest-cli-front.json
```

This will output your code with all decorators removed.

## Important Note: Decorator-Dependent Code

Some codebases rely on decorators for business logic, such as dependency injection, validation, routing, or other runtime behaviors. This library is **not** intended for use in those cases. If your application or library requires decorators to function correctly at runtime, do not use `nestjs-decorators-stripper` for those builds, as removing decorators will break your business logic.

Use this tool only when you are certain that decorators are not required for the intended build output.

## When NOT to use it
- If you need decorator metadata at runtime (e.g., for validation, dependency injection, or Swagger in NestJS), do NOT strip decorators from that build.
- Only use this for build targets where decorators are not required.

## License
MIT
