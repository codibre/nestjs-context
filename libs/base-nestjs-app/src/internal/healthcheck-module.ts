import { Controller, Get } from '@nestjs/common';
import { packageInfo } from 'src/package-info';

function getController(route: string) {
	@Controller(route)
	class HealthCheckController {
		@Get()
		health(): unknown {
			return {
				status: 'pass',
				version: packageInfo.version?.split('.')[0] ?? '0',
				releaseID: packageInfo.version ?? '0.0.0',
				serviceID: packageInfo.name ?? 'api',
			};
		}
	}

	return HealthCheckController;
}

export class HealthCheckModule {
	static forRoot(route = 'health-check') {
		const controller = getController(route);
		return {
			module: HealthCheckModule,
			controllers: [controller],
			controller,
		};
	}
}
