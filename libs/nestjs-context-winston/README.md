# Nestjs Context Winston

Contextual logging library for NestJS applications  based on AsyncLocalStorage with third party enricher support.

## Features

- 🚀 **Native NestJS integration** - Ready-to-use module
- 📝 **Contextual logging** - Automatic logs with transaction information using AsyncLocalStorage
- 🔍 **Third party enrichment support** - Integrate with New Relic using the `@newrelic/log-enricher` package or others!
- ⚡ **Performance** - Efficient logs with per-request metadata accumulation
- 🔒 **Type-safe** - Fully typed in TypeScript with standardized metadata
- 🎯 **Standardized metadata** - Full control over accepted metadata fields

## Best Practices

### Use addMeta/addMetas instead of multiple logs

```typescript
// ✅ Correct - accumulate metadata and log once
this.logger.addMeta('userId', '123');
this.logger.addMeta('operation', 'login');

// ❌ Avoid - multiple logs
this.logger.info('Starting login', { userId: '123' });
this.logger.info('Login performed', { operation: 'login' });
```

### 3. Automatic Per-Request Logging

By default, this library includes a `RequestLoggerInterceptor` that automatically generates a single structured log for every request. This means you do not need to manually call a log method in your controllers or services for each request. Instead, you can simply use `addMeta`, `addMetas`, or `incMeta` throughout your request handling to accumulate metadata, and the interceptor will log everything at the end of the request.

#### Disabling the Automatic Request Log

If you want to disable this automatic per-request log (for example, if you want to handle logging manually), you can do so in two ways:

1. **Via options:**
   Set `useLogInterceptor: false` in the options passed to `ContextLoggingModule.forRoot`.
   ```typescript
   ContextLoggingModule.forRoot({
     logClass: AppLogger,
     useLogInterceptor: false,
   })
   ```
2. **Via environment variable:**
   Set the environment variable `AUTO_REQUEST_LOG=false` (as a string) to disable the interceptor globally.

By default, the automatic request log is **enabled**.

#### Defining log level

You can de define log level in two ways:

1. **Via options:**
   Set `logLevel: debug | info | warn | error` in the options passed to `ContextLoggingModule.forRoot`.
   ```typescript
   ContextLoggingModule.forRoot({
     logClass: AppLogger,
     logLevel: LogLevel.warn,
   })
   ```
2. **Via environment variable:**
   Set the environment variable `LOG_LEVEL=warn` to disable the interceptor globally.


## Installation

```bash
npm install nestjs-context-winston
```

## Configuration

### 1. Define the metadata class

First, create an interface/class that defines the accepted metadata in the logs:

```typescript
// src/logging/metadata.interface.ts
export interface AppLoggerMetadata {
  userId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  // Add other fields as needed
}
```

### 2. Create your custom logger

Extend `ContextLogger` with your metadata interface (for standardization):

```typescript
// src/logging/app-logger.service.ts
import { BaseContextLogger } from 'nestjs-context-winston';
import { AppLoggerMetadata } from './metadata.interface';

export class AppLogger extends bASEContextLogger<AppLoggerMetadata> { }
```

### 3. Configure the application module

Set up the logger as a global provider:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ContextLoggingModule } from 'nestjs-context-winston';
import { AppLogger } from './logging/app-logger.service';

export loggingModule = ContextLoggingModule.forRoot({
  logClass: AppLogger,
});
@Module({
  imports: [loggingModule],
})
export class AppModule {}

// In your main.ts:
import { ContextNestLogger } from 'nestjs-context-winston';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    {
      // Replace the global NestJS logger with your contextual logger
      logger: loggingModule
    }
  );
  await app.listen(3000);
}
bootstrap();
```

> ℹ️ **Automatic context**: The module automatically registers a global guard to capture the context of all requests. Metadata accumulated with `addMeta()` and `addMetas()` is **isolated per request** - each request maintains its own independent context.

## Basic Usage

### Logger Injection

Your custom logger will be used as the injection symbol throughout the application:

```typescript
import { Injectable } from '@nestjs/common';
import { AppLogger } from '../logging/app-logger.service';

@Injectable()
export class UserService {
  constructor(private readonly logger: AppLogger) {}

  async findUser(id: string) {
    // Add individual metadata to the context (without logging yet)
    this.logger.addMeta('userId', id);
    this.logger.addMeta('operation', 'find_user');

    try {
      const user = await this.userRepository.findById(id);

      // Increment a counter in the context
      this.logger.incMeta('queries_executed');

      // Add multiple metadata at once
      this.logger.addMetas({
        userName: user.name,
        userType: user.type
      });

      return user;
    } catch (error) {
      // You can also pass metadata directly in the log
      this.logger.addMeta('errorCode', error.code);
      throw error;
    }
  }
}
```

## Contextual Logging

### How Context Works

The library uses [**AsyncLocalStorage**](https://nodejs.org/api/async_context.html#class-asynclocalstorage) to manage metadata context throughout the request.

**What is AsyncLocalStorage?**
It's a native Node.js API that allows you to create a "repository" of contextual information that persists through an entire chain of asynchronous operations (Promises, callbacks, etc.). When instantiated at the start of a request, it serves as isolated storage that **only exists for that specific request**.

**How it works in practice:**
1. The `ContextLoggingModule` **automatically registers a global guard** that starts the AsyncLocalStorage context at the beginning of each request
2. Throughout execution (controllers, services, etc.), you can **accumulate metadata** using `addMeta()`
3. Metadata is **isolated per request** - each request has its own independent context
4. At the end, the log is generated **with all accumulated metadata** for that specific request

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    // AsyncLocalStorage context is started automatically
    // All metadata added during this request will be isolated
    return this.userService.findUser(id);
  }
}
```

## Metadata Management

### Methods for Accumulating Metadata

The library provides methods to add metadata to the context without generating logs immediately:

```typescript
export class PaymentService {
  constructor(private readonly logger: AppLogger) {}

  async processPayment(paymentData: PaymentRequest) {
    // Add individual metadata
    this.logger.addMeta('operation', 'process_payment');
    this.logger.addMeta('paymentMethod', paymentData.method);

    // Add multiple metadata at once
    this.logger.addMetas({
      amount: paymentData.amount,
      currency: paymentData.currency,
      merchantId: paymentData.merchantId
    });

    // Simulate validation
    await this.validatePayment(paymentData);
    this.logger.incMeta('validations_completed'); // Increment counter

    // Simulate processing
    const result = await this.externalPaymentAPI.process(paymentData);
    this.logger.addMeta('transactionId', result.id);

    // No need to call logger.info here: the interceptor will log all accumulated metadata automatically
    return result;
  }

  private async validatePayment(data: PaymentRequest) {
    this.logger.incMeta('validation_steps'); // Increment on each validation

    if (!data.amount || data.amount <= 0) {
      this.logger.addMeta('validationError', 'invalid_amount');
      throw new Error('Invalid value');
    }

    this.logger.incMeta('validation_steps');
    // More validations...
  }
}
```

### Advantages of Metadata Accumulation

1. **Cost savings**: One log per request instead of multiple logs
2. **Complete context**: All request metadata in one place
3. **Performance**: Reduces logging I/O
4. **Standardization**: Consistent log structure

### Example of Final Log

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Payment processed successfully",
  "context": "PaymentController.processPayment",
  "transactionId": "abc123",
  "operation": "process_payment",
  "paymentMethod": "credit_card",
  "amount": 100.50,
  "currency": "BRL",
  "merchantId": "merchant-123",
  "validations_completed": 1,
  "validation_steps": 3,
  "paymentTransactionId": "pay-xyz789"
}
```

## New Relic Integration

### Log Enrichment with Custom Formatters

By default, logs generated when running your application in vscode has a fine formatted log with metadata highlighted. When generating logs in a provisioned environment, they are generated in json format. If you need, though, you can enrich your logs by providing any custom Winston formatter to the logger. This allows you to add trace, context, or any other fields to your logs. For example, you can use enrichers for New Relic, OpenTelemetry, or your own custom logic.

#### Example: Using a Single Enricher (New Relic)

```typescript
import { Module } from '@nestjs/common';
import { ContextLoggingModule } from 'nestjs-context-winston';
import { AppLogger } from './logging/app-logger.service';
import { createEnricher } from '@newrelic/log-enricher';

@Module({
  imports: [
    ContextLoggingModule.forRoot({
      logClass: AppLogger,
      logEnricher: createEnricher(), // Adds New Relic trace fields automatically
    }),
  ],
})
export class AppModule {}
```

#### Example: Combining Multiple Enrichers

You can combine multiple formatters/enrichers using Winston's `format.combine`. For example, to use both New Relic and a custom enricher:

```typescript
import { Module } from '@nestjs/common';
import { ContextLoggingModule } from 'nestjs-context-winston';
import { AppLogger } from './logging/app-logger.service';
import { createEnricher as createNewRelicEnricher } from '@newrelic/log-enricher';
import { format } from 'winston';

// Example custom enricher
const customEnricher = format((info) => {
  info.customField = 'custom-value';
  return info;
});

@Module({
  imports: [
    ContextLoggingModule.forRoot({
      logClass: AppLogger,
      logEnricher: format.combine(
        createNewRelicEnricher(),
        customEnricher()
      ),
    }),
  ],
})
export class AppModule {}
```

> ℹ️ **Tip:** You can combine as many formatters/enrichers as you need using `format.combine`.

---

## Manual Instrumentation for Uncovered Applications

For applications not covered by New Relic's automatic instrumentation (such as HTTP/2 servers, custom protocols, or non-standard HTTP implementations), you can use the [`newrelic-nestjs-instrumentation`](https://www.npmjs.com/package/newrelic-nestjs-instrumentation) library to generate the necessary instrumentation.

### Installation

```bash
npm install @newrelic/log-enricher newrelic-nestjs-instrumentation
```

### Example: Using Both Libraries Together

To get full New Relic trace enrichment and distributed tracing context, use both `@newrelic/log-enricher` and `newrelic-nestjs-instrumentation` together. **The instrumentation module must be imported before the logger module.**

```typescript
import { Module } from '@nestjs/common';
import { NewRelicInstrumentationModule } from 'newrelic-nestjs-instrumentation';
import { ContextLoggingModule } from 'nestjs-context-winston';
import { AppLogger } from './logging/app-logger.service';
import { createEnricher } from '@newrelic/log-enricher';

@Module({
  imports: [
    // CRITICAL: Instrumentation module must come FIRST
    NewRelicInstrumentationModule.forRoot(),
    ContextLoggingModule.forRoot({
      logClass: AppLogger,
      logEnricher: createEnricher(),
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

### Common Scenarios for Manual Instrumentation

- **HTTP/2 servers**: The server itself (not client calls)
- **Custom protocols**: WebSocket, gRPC, etc.
- **Non-standard HTTP implementations**: Fastify, Koa, etc.
- **Applications with custom transport layers**


If your application uses standard HTTP/1.1 servers, New Relic's automatic instrumentation may already be sufficient for distributed tracing, but you can still use `@newrelic/log-enricher` for log enrichment.

## ContextLoggingModule Configuration: Options and Examples

As of the latest version, the `forRoot` method of `ContextLoggingModule` now receives an options object instead of the logger class directly. This allows for more flexible and powerful configuration.

### Simple Example

```typescript
import { Module } from '@nestjs/common';
import { ContextLoggingModule } from 'nestjs-context-winston';
import { AppLogger } from './logging/app-logger.service';

@Module({
  imports: [
    ContextLoggingModule.forRoot({
      logClass: AppLogger,
    }),
  ],
})
export class AppModule {}
```

### Intermediate Example: Correlation ID and Custom Error Level

```typescript
import { Module } from '@nestjs/common';
import { ContextLoggingModule } from 'nestjs-context-winston';
import { AppLogger } from './logging/app-logger.service';
import { HttpStatus } from '@nestjs/common';

@Module({
  imports: [
    ContextLoggingModule.forRoot({
      logClass: AppLogger,
      getCorrelationId: () => {
        // Example: extract correlationId from request context
        // (can use AsyncLocalStorage, headers, etc)
        return 'my-correlation-id';
      },
      // Custom rule to define what log level default log interceptor will use
      errorLevelCallback: (error) => {
        // 4xx errors will generate warning level
        if (error instanceof MyCustomError) return HttpStatus.BAD_REQUEST;
        // 5xx errors will generate error level
        return HttpStatus.INTERNAL_SERVER_ERROR;
      },
    }),
  ],
})
export class AppModule {}
```

### Complete Example: Log Enrichment with New Relic

```typescript
import { Module } from '@nestjs/common';
import { ContextLoggingModule } from 'nestjs-context-winston';
import { AppLogger } from './logging/app-logger.service';
import { createEnricher } from '@newrelic/log-enricher';

@Module({
  imports: [
    ContextLoggingModule.forRoot({
      logClass: AppLogger,
      getCorrelationId: () => {
        // Generate a unique correlation ID for each request
        return crypto.randomUUID();
      },
      errorLevelCallback: (error) => {
        // Custom logic for error level
        return 500;
      },
      logEnricher: createEnricher(), // Adds New Relic trace fields automatically
    }),
  ],
})
export class AppModule {}
```

#### Available properties in `forRoot(options)`
- `logClass` (**required**): Logger class to register (must extend `BaseContextLogger`)
- `getCorrelationId` (optional): Function to extract correlationId from the request context
- `errorLevelCallback` (optional): Function to determine HTTP status/log level based on the error
- `logEnricher` (optional): Winston formatter to enrich logs (e.g., `@newrelic/log-enricher`)

> ℹ️ **Tip:** You can combine all options to get highly contextual, traceable logs integrated with APMs like New Relic.

## API Reference

### ContextLogger<T>

Main contextual logger class with AsyncLocalStorage support.

#### Logging Methods

- `info(message: string, metadata?: T)` - Info log
- `warn(message: string, metadata?: T)` - Warning log
- `error(message: string, metadata?: T)` - Error log
- `debug(message: string, metadata?: T)` - Debug log

#### Metadata Management Methods

- `addMeta(key: keyof T, value: T[keyof T])` - Adds a specific metadata to the current context
- `addMetas(metadata: Partial<T>)` - Adds multiple metadata to the current context
- `incMeta(key: keyof T, increment?: number)` - Increments a numeric value in the context (default: 1)

#### Properties

- `winstonLogger: winston.Logger` - Underlying Winston instance

### ContextLoggingModule

NestJS module for logger configuration.

#### Methods

- `forRoot<T>(options: ContextLoggingOptions<T>)` - Module configuration with custom logger class and options

### ContextLoggerContextGuard

Guard that automatically sets up AsyncLocalStorage context.

- Automatically captures `Controller.method`
- Includes New Relic `transactionId` when available
- **Should be used as a global APP_GUARD**
- Sets up AsyncLocalStorage for the entire request

#### Centralized Logging Strategy

**💡 Recommended approach**: Use the default log interceptor as the **single logging point** of your application. Throughout the request execution, services and controllers accumulate metadata using `addMeta()` and `addMetas()`, but do not log individually. The interceptor automatically consolidates **all accumulated metadata** into a single structured log at the end of the request.

**Advantages of this approach:**
- ✅ **Resource savings**: One log per request instead of dozens
- ✅ **Complete context**: The entire request journey in one place
- ✅ **Better observability**: Holistic view of each operation
- ✅ **Noise reduction**: Cleaner, more organized logs
- ✅ **Optimized performance**: Lower I/O overhead

#### Log Interceptor Features

The base interceptor automatically captures and logs:

- **Request information**: HTTP method, URL, relevant headers
- **Response information**: status code, response time
- **Application context**: client IP, user agent
- **Correlation**: correlation ID for cross-service tracing
- **Performance**: total request processing time

#### Example of Generated Log

```json
{
  "timestamp": "2025-06-22T16:34:23.000Z",
  "level": "info",
  "message": "GET /api/products?distributionCenterCode=1&businessModelCode=1... HTTP/1.1\" 200 8701.035309ms",
  "routine": "ProductsController.getProducts",
  "correlationId": "b2fc6867c551766b5197caa444d9e16d",
  "filteredRequestPath": "businessModelCode=1&comStrCode=1&cycle=202506...",
  "cached": 1,
  "newTime": 285.2268260000019,
  "requestPath": "/api/products?distributionCenterCode=1&businessModelCode=1...",
  "responseStatusCode": 200,
  "responseTime": 8701.035309
}
```

### Service with Structured Logging

This is an example where we locally accumulate some meta to write it once into the context, minimizing, that way, context retrieving, ie, AsyncLocalStorage overhead

```typescript
@Injectable()
export class OrderService {
  constructor(private readonly logger: AppLogger) {}

  async createOrder(orderData: CreateOrderDto) {
    // Start the operation context using both forms
      const meta: Partial<AppLoggerMetadata> = {
      operation: 'create_order'
      itemCount: orderData.items.length,
      customerId: orderData.customerId
      totalAmount: orderData.total
    }

    try {
      // Validation
      await this.validateOrder(orderData);
      this.logger.incMeta('validation_passed');

      // Stock reservation
      await this.reserveStock(orderData.items);
      this.logger.incMeta('stock_operations');

      // Payment processing
      const payment = await this.processPayment(orderData);
      meta.paymentId = payment.id;

      // Order creation
      const order = await this.orderRepository.create(orderData);
      meta.orderId = order.id;
      meta.orderStatus = order.status;

      return order;
    } catch (error) {
      // Metadata can be passed directly in the log
      meta.errorStep = this.getCurrentStep();
      throw error;
    } finally {
      this.logger.addMetas(meta);
    }
  }

  private async validateOrder(data: CreateOrderDto) {
    this.logger.incMeta('validation_steps');
    // Validations...
  }

  private async reserveStock(items: OrderItem[]) {
    for (const item of items) {
      this.logger.incMeta('stock_checks');
      // Reservation logic...
    }
  }
}
```
## Context Filter

The `contextFilter` option allows you to control which requests are logged by the `RequestLoggerInterceptor`. This is useful when you want to exclude certain requests from logging, such as health checks, static asset requests, or any custom logic based on the execution context.

### How It Works

When you provide a `contextFilter` function in the options for `ContextLoggingModule.forRoot`, the interceptor will call this function for every request. If the function returns `false`, the request will not be logged.

### Usage Example with Built-in Helpers

You can use the built-in `contextFilters` helpers to easily exclude requests from specific controllers or routes. For example, to skip logging for all requests handled by `HealthCheckController`:

```typescript
import { ContextLoggingModule, contextFilters } from 'nestjs-context-winston';
import { HealthCheckController } from './health-check.controller';

@Module({
  imports: [
    ContextLoggingModule.forRoot({
      logClass: AppLogger,
      contextFilter: contextFilters.exclude(
        contextFilters.matchController(HealthCheckController)
      ),
    }),
  ],
})
export class AppModule {}
```

### Notes
- The `contextFilter` function receives the NestJS `ExecutionContext` for each request.
- Returning `true` means the request will be logged; returning `false` skips logging for that request.
- You can implement any custom logic or use the provided helpers to decide which requests should be logged.
