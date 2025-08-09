import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { packageInfo } from 'src/package-info';

export function enableOpenApi(app: INestApplication) {
	const options = new DocumentBuilder()
		.setTitle(packageInfo.name ?? 'Api')
		.setDescription(packageInfo.description ?? '')
		.setVersion(packageInfo.version ?? 'xxx')
		.addBasicAuth()
		.addBearerAuth()
		.addOAuth2()
		.build();
	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup('docs', app, document);
}
