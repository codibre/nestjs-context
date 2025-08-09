import { DynamicModule } from '@nestjs/common';
import { BaseNestjsOptions } from 'src/types/base-nestjs-app-options';

export function createModule(options: BaseNestjsOptions): DynamicModule {
	class AppModule {}
	const imports = options.imports ?? [];
	return {
		module: AppModule,
		imports: [...imports, options.loggerModule],
		providers: options.providers,
	};
}
