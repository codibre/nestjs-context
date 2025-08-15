# fast-class-stringify

Faster class stringification for TypeScript/JavaScript classes, with special support for NestJS and Swagger-decorated classes.

## What is this?

`fast-class-stringify` is a utility library that allows you to serialize (stringify) class instances and arrays of class instances much faster than the default `JSON.stringify`, by wrapping [fast-json-stringify](https://github.com/fastify/fast-json-stringify) and use it based on the constructor of the class informed.

It is especially useful for:
- High-performance APIs that need to serialize large arrays of objects
- Projects using NestJS and Swagger decorators
- Scenarios where you want to avoid the runtime cost of reflection-based serialization

## Features

- Register custom schemas for your classes for fast serialization
- Automatically generate schemas from NestJS Swagger-decorated classes
- Serialize single instances or arrays
- Optionally monkey-patch `JSON.stringify` to use your fast serializers

## Installation

```sh
pnpm add fast-class-stringify fast-json-stringify
# or
npm install fast-class-stringify fast-json-stringify
```

## Usage

### 1. Register a schema for your class

```ts
import { registerClassSchema, stringifyClass } from 'fast-class-stringify';

class User {
	id: number;
	name: string;
}

registerClassSchema(User, {
	type: 'object',
	properties: {
		id: { type: 'number' },
		name: { type: 'string' },
	},
});

const user = new User();
user.id = 1;
user.name = 'Alice';

console.log(stringifyClass(user)); // Fast JSON string
```

### 2. Use with NestJS Swagger-decorated classes

```ts
import { registerSwaggerSchema, stringifyClass } from 'fast-class-stringify';
import { ApiProperty } from '@nestjs/swagger';

class Product {
	@ApiProperty()
	id: number;
	@ApiProperty()
	name: string;
}

registerSwaggerSchema(Product);

const product = new Product();
product.id = 42;
product.name = 'Widget';
console.log(stringifyClass(product));
```

### 3. Monkey-patch JSON.stringify

```ts
import { monkeyPatchStringify } from 'fast-class-stringify';
monkeyPatchStringify();

// Now JSON.stringify will use your fast serializers for registered classes
JSON.stringify(new Product());
```

### 4. Benchmarking

See the `benchmark/` folder for a ready-to-run benchmark comparing `stringifyClass` and `JSON.stringify` on complex objects.

### 5. Registering all classes from a module or file

If you have a file that exports many DTO classes (e.g., `export * from './my-dtos'`), you can register all of them at once using `registerSchemaRecord`:

```ts
import * as MyDtos from './my-dtos';
import { registerSchemaRecord } from 'fast-class-stringify';

registerSchemaRecord(MyDtos);
```

This will automatically register every exported class in the module for fast serialization.

## API

- `registerClassSchema(cls, schema)` — Register a class and its fast-json-stringify schema
- `getClassStringify(cls)` — Get the stringifier function for a class
- `getArrayClassStringify(cls)` — Get the stringifier for arrays of a class
- `stringifyClass(instance)` — Fast stringify for a class instance or array
- `registerSwaggerSchema(cls)` — Register a NestJS Swagger-decorated class
- `registerSwaggerSchemas(classes)` — Register multiple Swagger-decorated classes
- `generateSwaggerSchema(cls)` — Generate a fast-json-stringify schema from a Swagger-decorated class
- `monkeyPatchStringify()` — Patch JSON.stringify to use fast serializers

## Advanced Usage with NestJS Swagger Plugin

If you are using the NestJS Swagger plugin in your build pipeline (see example nest-cli config below), you do **not** need to manually decorate every DTO property with `@ApiProperty` for it to be included in the schema. The plugin automatically emits the necessary metadata for all DTOs it processes.

**Example nest-cli.json with Swagger plugin:**

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "assets": ["**/*.hbs"],
    "deleteOutDir": true,
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "dtoFileNameSuffix": ["my-dto.s"]
        }
      }
    ]
  }
}
```

With this setup, you only need to:
- Use **classes** (not interfaces) for your DTOs, so that TypeScript can emit metadata.
- **Manually register** every class you want to be considered by `fast-class-stringify` using `registerSwaggerSchema` or `registerSwaggerSchemas`.

> **Note:** Interfaces are not supported, as TypeScript does not emit metadata for them. Always use classes for DTOs you want to serialize.

## Using with plainToClass

In TypeScript, it is common to rely on duck typing, so the objects returned by controllers may not actually be instances of the expected classes. This can prevent `fast-class-stringify` from recognizing and serializing them optimally.

To fix this, you can use `plainToClass` from `@nestjs/class-transformer` to convert plain objects to class instances before serialization:

```ts
import { plainToClass } from '@nestjs/class-transformer';
import { MyDto } from './my-dto';

const plain = { id: 1, name: 'Alice' };
const instance = plainToClass(MyDto, plain);
console.log(stringifyClass(instance));
```

This ensures that your objects are true class instances, enabling fast serialization.

## Limitations

- **No union type support (yet):** The library does not currently support union types (e.g., `string | number`). Attempting to use union types in your schemas or classes will not work as expected.
- **No circular reference support:** If your class or object graph contains circular references, schema generation will throw an error. Circular references are not supported by fast-json-stringify or this library.
