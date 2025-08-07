import { CanActivate, ExecutionContext } from '@nestjs/common';
import { BaseLogMetadata } from './base-log-metadata';
import { BaseContextLogger } from './base-context-logger';
import { ContextLoggingOptions } from './context-logging-options';
import { startLogContextIfAbsent } from './start-log-context-if-absent';

/**
 * NestJS guard that sets up logging context for requests.
 *
 * This guard automatically captures existing trace IDs from New Relic
 * or OpenTelemetry and sets up the logging context with trace ID and route information.
 * It only captures existing traces and does not create new transactions.
 *
 * The guard captures:
 * - Trace ID from New Relic trace metadata (when available and active)
 * - Trace ID from OpenTelemetry active span (when available)
 * - Transaction name from NestJS controller and handler names
 *
 * Note: This guard only captures existing traces. Transaction creation and management
 * should be handled by dedicated instrumentation libraries.
 *
 * @implements {CanActivate}
 *
 * @example
 * ```typescript
 * // Apply globally
 * app.useGlobalGuards(new ContextLoggerContextGuard());
 *
 * // Apply to a single route
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @UseGuards(ContextLoggerContextGuard)
 *   async getUsers() {
 *     // Logging context is automatically set up with existing trace ID
 *     return this.userService.findAll();
 *   }
 * }
 *
 * // Apply to entire controller
 * @Controller('users')
 * @UseGuards(ContextLoggerContextGuard)
 * export class UserController {
 *   // All routes will have logging context with existing trace ID
 * }
 * ```
 *
 * @since 0.4.0
 */
export class ContextLoggerContextGuard implements CanActivate {
	constructor(
		private readonly logger: BaseContextLogger<BaseLogMetadata>,
		private readonly options: ContextLoggingOptions<BaseContextLogger<object>>,
	) {}
	/**
	 * Sets up logging context and allows the request to proceed.
	 *
	 * This method captures existing trace IDs from New Relic trace metadata
	 * or OpenTelemetry span context and constructs a transaction name from the NestJS execution context.
	 * It does not create new transactions - only captures existing ones.
	 *
	 * Priority order for trace ID capture:
	 * 1. New Relic trace metadata (if New Relic is available and has active trace)
	 * 2. OpenTelemetry active span (if OpenTelemetry is available and has active span)
	 *
	 * Note: This method only captures existing traces. For transaction creation,
	 * use dedicated instrumentation libraries like @newrelic/native-metrics or OpenTelemetry auto-instrumentation.
	 *
	 * @param context - The NestJS execution context containing route and handler information
	 * @returns Always returns true to allow the request to proceed
	 *
	 * @example
	 * ```typescript
	 * // The guard automatically sets context like:
	 * // Transaction Name: "UserController.getUsers"
	 * // Trace ID: "abc123def456" (from existing New Relic or OpenTelemetry trace when available)
	 * ```
	 */
	canActivate(context: ExecutionContext) {
		startLogContextIfAbsent(context, this.options, this.logger);
		return true;
	}
}
