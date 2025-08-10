# Base NestJS App

A comprehensive NestJS application factory that provides a standardized way to create production-ready NestJS applications with Fastify, built-in health checks, logging integration, and microservice support.

[![npm version](https://img.shields.io/npm/v/base-nestjs-app.svg)](https://www.npmjs.com/package/base-nestjs-app)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Overview

This library provides a batteries-included NestJS application factory that handles the common configuration and setup needed for production applications:

- **🚀 Fastify Integration** - High-performance HTTP server with HTTP/2 support
- **🏥 Health Check Module** - Built-in health check endpoints with service metadata
- **📝 Context Logging** - Integrated structured logging with context preservation
- **🔗 Microservice Support** - Easy hybrid application setup for microservices
- **📚 OpenAPI Documentation** - Automatic Swagger documentation generation
- **🗜️ Compression** - Configurable response compression
- **🌐 CORS & Versioning** - Pre-configured CORS and API versioning
- **⚙️ Flexible Configuration** - Extensive customization options

## Features

- 🎯 **Zero-config Setup** - Works out of the box with sensible defaults
- ⚡ **Performance Optimized** - Built on Fastify for maximum throughput
- 🔧 **Highly Configurable** - Extensive options for customization
- 🩺 **Production Ready** - Includes health checks, logging, and monitoring
- 🔄 **Microservice Support** - Hybrid applications with multiple transports
- 📖 **Auto Documentation** - Swagger/OpenAPI docs generated automatically
- 🎭 **Type Safe** - Full TypeScript support with comprehensive types
- 🧪 **Well Tested** - 100% test coverage

## Installation

```bash
npm install base-nestjs-app
# or
yarn add base-nestjs-app
# or
pnpm add base-nestjs-app
```

## Quick Start

### Basic Application

```typescript
import { createApp } from 'base-nestjs-app';
import { ContextLoggingModule } from 'nestjs-context-winston';

async function bootstrap() {
  const { app, start } = await createApp({
    loggingModule: ContextLoggingModule.forRoot({
      // logging configuration
    }),
    imports: [
      // your application modules
    ],
    providers: [
      // global providers
    ],
  });

  // Start the application
  await start();
}

bootstrap();
```

### Advanced Configuration

```typescript
import { createApp } from 'base-nestjs-app';
import { ContextLoggingModule } from 'nestjs-context-winston';

async function bootstrap() {
  const { app, start } = await createApp({
    // Server configuration
    server: {
      port: 4000,
      http2: true,
      compression: 'max',
      bodyLimitMb: 10,
      maxParamLengthKb: 100,
      // Enable GET request body parsing
      allowGetBody: true,
    },

    // Logging integration
    loggingModule: ContextLoggingModule.forRoot({
      // your logging config
    }),

    // Health check configuration
    healthCheck: {
      enabled: true,
      healthCheckRoute: 'health',
    },

    // Application modules and providers
    imports: [YourAppModule],
    providers: [GlobalService],

    // Microservice support
    microservices: [
      {
        hybridOptions: {
          // NestJS hybrid app options
        },
      },
    ],
  });

  await start();
}

bootstrap();
```

## Configuration Options

### BaseNestjsOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `server` | `BaseNestJsServerOptions` | `{}` | Server configuration options |
| `loggingModule` | `ContextLoggingModuleInstance` | **required** | Logging module instance |
| `imports` | `DynamicModule['imports']` | `[]` | NestJS modules to import |
| `providers` | `DynamicModule['providers']` | `[]` | Global providers |
| `microservices` | `MSOptions[]` | `[]` | Microservice configurations |
| `allowGetBody` | `boolean` | `false` | Enable body parsing for GET requests |
| `healthCheck` | `HealthCheckOptions` | `{ enabled: true }` | Health check configuration |

### Server Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `port` | `number` | `3000` | Server port |
| `http2` | `boolean` | `false` | Enable HTTP/2 support |
| `compression` | `'none' \| 'min' \| 'average' \| 'max'` | `undefined` | Response compression level |
| `bodyLimitMb` | `number` | `50` | Request body size limit in MB |
| `maxParamLengthKb` | `number` | `65` | Maximum parameter length in KB |

### Health Check Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable health check endpoint |
| `healthCheckRoute` | `string` | `'health-check'` | Health check endpoint path |

## Built-in Features

### Health Check Endpoint

The library automatically provides a health check endpoint that returns:

```json
{
  "status": "pass",
  "version": "1",
  "releaseID": "1.0.0",
  "serviceID": "your-service-name"
}
```

Access it at: `GET /health-check` (or your configured route)

### OpenAPI Documentation

Swagger documentation is automatically generated and available at `/docs` with:

- Service title and description from package.json
- Version information
- Basic Auth, Bearer Token, and OAuth2 support pre-configured

### Logging Integration

The library integrates with `nestjs-context-winston` for structured logging:

- Request/response logging with context preservation
- Health check endpoints are automatically excluded from logs
- Configurable log levels and formats

### Compression

Built-in response compression with configurable levels:

- `'none'` - No compression
- `'min'` - Minimal compression (fastest)
- `'average'` - Balanced compression
- `'max'` - Maximum compression (smallest size)

### CORS and Versioning

- CORS is enabled by default
- API versioning is pre-configured
- Both can be customized through NestJS standard configuration

## Advanced Usage

### Microservices

Create hybrid applications that can handle both HTTP and microservice protocols:

```typescript
const { app, start } = await createApp({
  loggingModule: myLoggingModule,
  imports: [AppModule],
  microservices: [
    {
      hybridOptions: {
        // Custom hybrid application options
      },
    },
  ],
});
```

### Custom GET Body Parsing

Enable body parsing for GET requests (useful for complex search APIs):

```typescript
const { app, start } = await createApp({
  loggingModule: myLoggingModule,
  imports: [AppModule],
  allowGetBody: true,
});
```

### Health Check Customization

Customize the health check endpoint:

```typescript
const { app, start } = await createApp({
  loggingModule: myLoggingModule,
  imports: [AppModule],
  healthCheck: {
    enabled: true,
    healthCheckRoute: 'api/health',
  },
});
```

## API Reference

### createApp(options: BaseNestjsOptions)

Creates a configured NestJS application with Fastify.

**Returns:**
```typescript
{
  app: INestApplication;
  start: () => Promise<INestApplication>;
}
```

- `app` - The configured NestJS application instance
- `start()` - Function to start the application and listen on the configured port

## TypeScript Support

The library is written in TypeScript and provides comprehensive type definitions for all configuration options and return types.

```typescript
import type {
  BaseNestjsOptions,
  BaseNestJsServerOptions,
  HealthCheckOptions,
  CompressionOptions
} from 'base-nestjs-app';
```

## Contributing

This library is part of the Codibre NestJS Context monorepo. Please see the root README for contribution guidelines.

## License

ISC License - see LICENSE file for details.

---

Built with ❤️ by [Codibre](https://github.com/codibre)

**The instrumentation module MUST be imported as the FIRST module in your main application module.** This ensures proper initialization before any other application code runs.

### 1. Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { NestJsNewrelicInstrumentationModule } from 'newrelic-nestjs-instrumentation';
// Import other modules AFTER the instrumentation module
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    // ⚠️ CRITICAL: Must be the FIRST import
    NestJsNewrelicInstrumentationModule,
    // Other modules come after
    UsersModule,
    OrdersModule,
  ],
})
export class AppModule {}
```

### 2. New Relic Configuration

Ensure you have New Relic configured in your application:

```typescript
// main.ts (before importing any other modules)
import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

### 3. Environment Variables

```bash
NEW_RELIC_LICENSE_KEY=your_license_key
NEW_RELIC_APP_NAME=your_app_name
NEW_RELIC_LOG_LEVEL=info
```

## Use Cases

### SQS Message Processing

```typescript
@Controller('sqs')
export class SqsController {
  constructor(private readonly sqsService: SqsService) {}

  @Post('process-message')
  async processMessage(@Body() sqsEvent: any) {
    // New Relic transaction automatically created
    // Transaction name: "SqsController.processMessage"

    for (const record of sqsEvent.Records) {
      await this.sqsService.processMessage(record);
    }

    return { processed: sqsEvent.Records.length };
  }
}
```

### Kafka Consumer

```typescript
@Controller('kafka')
export class KafkaController {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly events: NewReliNestjsEvent
  ) {
    // Monitor Kafka message processing
    this.events.on('transactionStarted', (transactionId) => {
      console.log(`Processing Kafka message in transaction: ${transactionId}`);
    });
  }

  @Post('handle-message')
  async handleMessage(@Body() kafkaMessage: any) {
    // Automatic transaction tracking for Kafka messages
    const result = await this.kafkaService.process(kafkaMessage);

    // Transaction context preserved throughout processing
    return result;
  }
}
```

### HTTP/2 Application

```typescript
// Works seamlessly with HTTP/2
@Controller('users')
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    // Full HTTP/2 support with proper transaction tracking
    // Distributed tracing headers automatically handled
    return this.userService.findById(id);
  }
}
```

### Cron Jobs and Background Tasks

```typescript
@Injectable()
export class CronService {
  constructor(private readonly events: NewReliNestjsEvent) {}

  @Cron('0 */6 * * *') // Every 6 hours
  async processScheduledTask() {
    // For cron jobs, manually trigger the guard and interceptor
    // or create a controller endpoint and call it internally
    return this.performTask();
  }
}

// Better approach for cron jobs:
@Controller('cron')
export class CronController {
  @Post('scheduled-task')
  async scheduledTask() {
    // This will be properly instrumented
    return this.cronService.performTask();
  }
}
```

## API Reference

### NestJsNewrelicInstrumentationModule

The main module that sets up New Relic instrumentation.

```typescript
@Module({
  imports: [NestJsNewrelicInstrumentationModule]
})
export class AppModule {}
```

**What it provides:**
- Global `NewrelicContextGuard` for transaction management
- Global `NewrelicInterceptor` for transaction lifecycle
- `NewReliNestjsEvent` service for event monitoring

### NewReliNestjsEvent

Event emitter service for monitoring transaction lifecycle.

```typescript
@Injectable()
export class MyService {
  constructor(private events: NewReliNestjsEvent) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Transaction started successfully
    this.events.on('transactionStarted', (transactionId: string) => {
      console.log(`Transaction ${transactionId} started`);
    });

    // Transaction completed (success or error)
    this.events.on('transactionFinished', (transactionId: string) => {
      console.log(`Transaction ${transactionId} finished`);
    });

    // Transaction creation failed
    this.events.on('transactionStartFailed', (transactionId: string, error: unknown) => {
      console.error(`Transaction ${transactionId} failed to start:`, error);
    });
  }
}
```

### NewrelicContextGuard

Guard that sets up New Relic transaction context (automatically applied globally).

**Transaction Naming Convention:**
- Format: `ControllerName.methodName`
- Example: `UserController.getUser`, `KafkaController.processMessage`

### NewrelicInterceptor

Interceptor that manages transaction lifecycle (automatically applied globally).

## Advanced Usage

### Custom Monitoring Integration

```typescript
@Injectable()
export class CustomMonitoringService {
  private transactionMetrics = new Map<string, { startTime: number }>();

  constructor(private events: NewReliNestjsEvent) {
    this.setupAdvancedMonitoring();
  }

  private setupAdvancedMonitoring() {
    this.events.on('transactionStarted', (transactionId) => {
      this.transactionMetrics.set(transactionId, {
        startTime: Date.now()
      });

      // Send to external monitoring system
      this.externalMonitoring.trackTransactionStart(transactionId);
    });

    this.events.on('transactionFinished', (transactionId) => {
      const metrics = this.transactionMetrics.get(transactionId);
      if (metrics) {
        const duration = Date.now() - metrics.startTime;
        this.externalMonitoring.trackTransactionEnd(transactionId, duration);
        this.transactionMetrics.delete(transactionId);
      }
    });
  }
}
```

### Error Tracking

```typescript
@Injectable()
export class ErrorTrackingService {
  constructor(private events: NewReliNestjsEvent) {
    this.events.on('transactionStartFailed', (transactionId, error) => {
      // Log to external error tracking service
      this.errorTracker.captureException(error, {
        transactionId,
        context: 'newrelic-transaction-start'
      });
    });
  }
}
```

## Best Practices

### 1. Module Import Order

Always import the New Relic module early in your application:

```typescript
// Correct order
@Module({
  imports: [
    NestJsNewrelicInstrumentationModule, // First
    DatabaseModule,
    AuthModule,
    // Other modules...
  ],
})
export class AppModule {}
```

### 2. Environment Configuration

Use environment-specific New Relic configuration:

```typescript
// config/newrelic.config.ts
export const newRelicConfig = {
  development: {
    enabled: false,
    logging: { level: 'trace' }
  },
  production: {
    enabled: true,
    logging: { level: 'info' }
  }
};
```

### 3. Error Handling

Always handle New Relic instrumentation errors gracefully:

```typescript
@Injectable()
export class SafeInstrumentationService {
  constructor(private events: NewReliNestjsEvent) {
    this.events.on('transactionStartFailed', (transactionId, error) => {
      // Log but don't throw - keep application functional
      this.logger.warn(`New Relic transaction failed: ${transactionId}`, error);
    });
  }
}
```

### 4. Performance Monitoring

Monitor the performance impact of instrumentation:

```typescript
@Injectable()
export class PerformanceMonitoringService {
  constructor(private events: NewReliNestjsEvent) {
    this.events.on('transactionStarted', (transactionId) => {
      // Track instrumentation overhead
      this.performanceMonitor.startTimer(`instrumentation.${transactionId}`);
    });
  }
}
```

## Troubleshooting

### Common Issues

1. **Transactions not appearing in New Relic**
   - Ensure New Relic agent is properly configured
   - Check that `NEW_RELIC_LICENSE_KEY` is set
   - Verify the module is imported before other modules

2. **HTTP/2 requests not tracked**
   - This library specifically addresses HTTP/2 compatibility
   - Ensure you're using NestJS controllers (not pure HTTP/2 handlers)

3. **SQS/Kafka messages not instrumented**
   - Make sure your message handlers are in NestJS controllers
   - Use `@Post()` or similar decorators for handler methods

4. **Events not firing**
   - Verify `NewReliNestjsEvent` is properly injected
   - Check that the module is correctly imported

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
@Injectable()
export class DebugService {
  constructor(private events: NewReliNestjsEvent) {
    // Log all transaction events
    this.events.on('transactionStarted', (id) =>
      console.log(`[DEBUG] Transaction started: ${id}`));
    this.events.on('transactionFinished', (id) =>
      console.log(`[DEBUG] Transaction finished: ${id}`));
    this.events.on('transactionStartFailed', (id, error) =>
      console.error(`[DEBUG] Transaction failed: ${id}`, error));
  }
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../README.md#🤝-contributing) for details on development setup, testing, and submission guidelines.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/newrelic-nestjs-instrumentation.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run linting
pnpm lint

# Build the project
pnpm build
```

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://github.com/your-org/newrelic-nestjs-instrumentation/wiki)
- 🐛 [Issue Tracker](https://github.com/your-org/newrelic-nestjs-instrumentation/issues)
- 💬 [Discussions](https://github.com/your-org/newrelic-nestjs-instrumentation/discussions)

## Related Projects

- [New Relic Node.js Agent](https://github.com/newrelic/node-newrelic)
- [NestJS Framework](https://github.com/nestjs/nest)
- [New Relic Winston Enricher](https://github.com/newrelic/node-newrelic-winston)
