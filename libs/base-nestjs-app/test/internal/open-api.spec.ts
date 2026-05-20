const createDocument = jest.fn(() => ({ doc: true }));
const setup = jest.fn();
const swaggerMock = {
	DocumentBuilder: jest.fn().mockImplementation(() => ({
		setTitle: jest.fn().mockReturnThis(),
		setDescription: jest.fn().mockReturnThis(),
		setVersion: jest.fn().mockReturnThis(),
		addBasicAuth: jest.fn().mockReturnThis(),
		addBearerAuth: jest.fn().mockReturnThis(),
		addOAuth2: jest.fn().mockReturnThis(),
		build: jest.fn(() => ({ title: 'Api', description: '', version: 'xxx' })),
	})),
	SwaggerModule: {
		createDocument,
		setup,
	},
	default: undefined as unknown,
};
swaggerMock.default = swaggerMock;
jest.mock('@nestjs/swagger', () => swaggerMock);
import { packageInfo } from 'src/package-info';
import { enableOpenApi } from '../../src/internal/open-api';

describe('enableOpenApi', () => {
	it('should be a function', () => {
		expect(typeof enableOpenApi).toBe('function');
	});

	it('should call DocumentBuilder and SwaggerModule methods', () => {
		const app = {} as any;
		enableOpenApi(app);
		expect(swaggerMock.DocumentBuilder).toHaveBeenCalled();
		const builder = swaggerMock.DocumentBuilder.mock.results[0]!.value;

		expect(builder.setTitle).toHaveBeenCalled();
		expect(builder.setDescription).toHaveBeenCalled();
		expect(builder.setVersion).toHaveBeenCalled();
		expect(builder.addBasicAuth).toHaveBeenCalled();
		expect(builder.addBearerAuth).toHaveBeenCalled();
		expect(builder.addOAuth2).toHaveBeenCalled();
		expect(builder.build).toHaveBeenCalled();
		expect(createDocument).toHaveBeenCalledWith(app, expect.any(Object));
		expect(setup).toHaveBeenCalledWith(
			'docs',
			app,
			{ doc: true },
			{
				jsonDocumentUrl: 'docs/json',
			},
		);
	});

	it('should use fallback values when packageInfo properties are undefined', () => {
		delete packageInfo.name;
		delete packageInfo.description;
		delete packageInfo.version;

		const app = {} as any;

		enableOpenApi(app);

		const builder = swaggerMock.DocumentBuilder.mock.results[0]!.value;
		expect(builder.setTitle).toHaveBeenCalledWith('Api');
		expect(builder.setDescription).toHaveBeenCalledWith('');
		expect(builder.setVersion).toHaveBeenCalledWith('xxx');
		expect(builder.addBasicAuth).toHaveBeenCalled();
		expect(builder.addBearerAuth).toHaveBeenCalled();
		expect(builder.addOAuth2).toHaveBeenCalled();
		expect(builder.build).toHaveBeenCalled();
		expect(createDocument).toHaveBeenCalledWith(app, expect.any(Object));
		expect(setup).toHaveBeenCalledWith(
			'docs',
			app,
			{ doc: true },
			{
				jsonDocumentUrl: 'docs/json',
			},
		);
	});
});
