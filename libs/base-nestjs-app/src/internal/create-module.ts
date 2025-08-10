import { DynamicModule } from '@nestjs/common';
import { BaseNestjsOptions } from 'src/types/base-nestjs-app-options';
import { HealthCheckModule } from './healthcheck-module';
import { contextFilters } from 'nestjs-context-winston';

export function createModule(options: BaseNestjsOptions): DynamicModule {
	class AppModule {}
	const imports = options.imports ?? [];
	if (options.healthCheck?.enabled ?? true) {
    const healthCheckModule = HealthCheckModule.forRoot(options.healthCheck?.healthCheckRoute);
		imports.push(healthCheckModule);
    options.loggingModule.excludeFilter(
      contextFilters.matchController(healthCheckModule.controller)
    );
	}
	imports.push(options.loggingModule);
	return {
		module: AppModule,
		imports,
		providers: options.providers,
	};
}
