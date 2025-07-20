export interface BaseLogMetadata {
	responseTime: number; // Duration of the request in milliseconds
	['trace.id']: string | undefined; // Unique identifier for tracing requests
}
