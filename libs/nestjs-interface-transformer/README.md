# NestJS Interface Transformer

> ⚠️ **EXPERIMENTAL - NOT FOR PRODUCTION USE**
>
> This is an experimental plugin created for educational purposes and TypeScript compiler API exploration. While it demonstrates advanced AST transformation techniques, it has fundamental limitations:
> - TypeScript type checking occurs before AST transformations, causing "interface used as value" errors if you try to use them as if they were an abstract class (passing as a parameter, for example);
> - Ecosystem incompatibility issues with third-party packages that use interfaces
> - Not recommended for production applications
>
> Use existing NestJS patterns (classes, symbols, abstract classes) for dependency injection in production code.

A TypeScript compiler plugin for NestJS that automatically transforms TypeScript interfaces into abstract classes, making interface metadata accessible at runtime through reflection.

## Why This Plugin?

In TypeScript, interfaces are purely compile-time constructs and are erased during compilation. This means you can't use reflection or dependency injection with interfaces at runtime. This plugin solves that problem by transforming interfaces into abstract classes, which preserve their metadata through the use of pluging like [nestjs-auto-reflect-metadata-emitter](https://www.npmjs.com/package/nestjs-auto-reflect-metadata-emitter) or [@nestjs/swagger](https://www.npmjs.com/package/@nestjs/swagger).

## Features

- ✅ Transforms TypeScript interfaces to abstract classes
- ✅ Preserves all interface members (properties, methods, getters, setters)
- ✅ Supports generic interfaces
- ✅ Handles heritage clauses (extends/implements)
- ✅ Maintains TypeScript type safety
- ✅ Integrates seamlessly with NestJS build process
- ✅ Configurable transformation options

## Installation

```bash
npm install nestjs-interface-transformer
# or
yarn add nestjs-interface-transformer
# or
pnpm add nestjs-interface-transformer
```

## Usage

### Basic Setup

1. **Configure NestJS CLI** - Add the plugin to your `nest-cli.json`:

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": [
      {
        "name": "nestjs-interface-transformer",
        "options": {}
      }
    ]
  }
}
```

2. **Or configure with Webpack** - If you're using a custom webpack configuration:

```javascript
const { webpackTransformerConfig } = require('nestjs-interface-transformer');

module.exports = {
  ...webpackTransformerConfig,
  // your other webpack config
};
```

### Interface Transformation Examples

**Before transformation:**
```typescript
export interface UserService {
  getUserById(id: string): Promise<User>;
  createUser(userData: CreateUserDto): Promise<User>;
  readonly userCount: number;
  cacheTimeout?: number;
}
```

**After transformation:**
```typescript
export abstract class UserService {
  abstract getUserById(id: string): Promise<User>;
  abstract createUser(userData: CreateUserDto): Promise<User>;
  abstract readonly userCount: number;
  abstract cacheTimeout?: number;
}
```

Although your code is not modified, the generated JavaScript will act like it interface was an abstract class. Also, plugin that auto generate metadata info will be able to do it from interfaces (like [nestjs-auto-reflect-metadata-emitter](https://www.npmjs.com/package/nestjs-auto-reflect-metadata-emitter) or [@nestjs/swagger](https://www.npmjs.com/package/@nestjs/swagger)).

## Configuration Options

The plugin accepts the following options:

```typescript
interface InterfaceTransformerOptions {
  /**
   * Pattern to match interface names that should be transformed
   * Default: all interfaces are transformed
   */
  interfacePattern?: RegExp;

  /**
   * Whether to preserve original interface files alongside transformed classes
   * Default: false
   */
  preserveOriginals?: boolean;

  /**
   * Suffix to add to transformed class names
   * Default: no suffix
   */
  classSuffix?: string;

  /**
   * File patterns to include in transformation
   * Default: all .ts files
   */
  include?: string[];

  /**
   * File patterns to exclude from transformation
   * Default: node_modules, *.spec.ts, *.test.ts
   */
  exclude?: string[];
}
```

### Example Configuration

```json
{
  "name": "nestjs-interface-transformer",
  "options": {
    "interfacePattern": ".*Service$",
    "exclude": ["**/*.spec.ts", "**/*.test.ts"],
    "include": ["src/**/*.ts"]
  }
}
```

## Supported Interface Features

The plugin supports transformation of:

- ✅ Property signatures → Abstract properties
- ✅ Method signatures → Abstract methods
- ✅ Optional properties and methods
- ✅ Readonly properties
- ✅ Generic interfaces
- ✅ Heritage clauses (extends → implements)
- ✅ Get/Set accessors
- ✅ Call signatures → Abstract call methods
- ✅ Construct signatures → Abstract construct methods
- ✅ Index signatures → Abstract indexer methods

## Advanced Examples

### Generic Interface
```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}

// Transforms to:
abstract class Repository<T> {
  abstract findById(id: string): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
}
```

### Interface with Heritage
```typescript
interface AdminUser extends User {
  permissions: string[];
  isActive: boolean;
}

// Transforms to:
abstract class AdminUser implements User {
  abstract permissions: string[];
  abstract isActive: boolean;
}
```

## Integration with Existing Code

This plugin is designed to be backward compatible. Your existing interfaces will continue to work as before, but now they'll also be available as abstract classes for dependency injection and reflection.

## TypeScript Compatibility

- TypeScript 4.0+
- NestJS 8.0+
- Node.js 16+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

If you encounter any issues or have questions, please file an issue on the [GitHub repository](https://github.com/codibre/nestjs-context/issues).
