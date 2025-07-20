/**
 * Interface for instrumentation providers (New Relic, OpenTelemetry, etc.)
 *
 * This interface defines providers that capture existing trace IDs from active traces.
 * It does not create new transactions - only captures existing ones.
 */
export interface InstrumentationProvider {
	/**
	 * Initialize the instrumentation provider.
	 * Should handle optional dependencies gracefully.
	 *
	 * @returns true if the provider was successfully initialized and is available for use
	 */
	initialize(): boolean;

	/**
	 * Capture existing trace ID from active instrumentation context.
	 * This method only captures existing traces and does not create new transactions.
	 *
	 * @returns The trace ID from the active trace context, or undefined if no active trace exists
	 */
	capture(): string | undefined;
}
