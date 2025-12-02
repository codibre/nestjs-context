const axios = require('axios');

const API_URL =
	'https://hmcp-proxy-re-bff-pt.internacional.grupoboticario.digital/mcp';
const USER = '1001638';
const PASS = 'OBoticario@123';
const APP = 'mcp-re-bff';

async function jsonRpcCall(method, params, token) {
	const headers = {
		'Content-Type': 'application/json',
	};
	if (token) {
		headers['token-user'] = token;
		headers['token-user-id'] = USER;
	}
	const res = await axios.post(
		API_URL,
		{
			jsonrpc: '2.0',
			method,
			params,
			id: Date.now(),
		},
		{ headers },
	);
	if (res.data.error) throw new Error(JSON.stringify(res.data.error));
	return res.data.result || res.data.data;
}

async function main() {
	try {
		// 1. Login
		const login = await jsonRpcCall('LoginController_auth', {
			application: APP,
			tokenPass: PASS,
			tokenUser: USER,
		});
		const TOKEN = login.access_token;

		// 2. Obter carrinho aberto
		const cart = await jsonRpcCall(
			'CartController_get',
			{
				application: APP,
				fullCart: true,
				orderNumber: 0,
			},
			TOKEN,
		);
		const ORDER = cart.id;

		// 3. Adicionar produtos
		await jsonRpcCall(
			'CartController_post',
			{
				application: APP,
				fullCart: true,
				orderNumber: ORDER,
				productOccurrences: 1,
				productsKitChoice: '',
				quantity: 2,
				sku: '62341',
			},
			TOKEN,
		);

		await jsonRpcCall(
			'CartController_post',
			{
				application: APP,
				fullCart: true,
				orderNumber: ORDER,
				productOccurrences: 1,
				productsKitChoice: '',
				quantity: 3,
				sku: '61828',
			},
			TOKEN,
		);

		// 4. Checar promoções
		await jsonRpcCall(
			'CartController_checkPromotions',
			{
				application: APP,
				orderNumber: ORDER,
			},
			TOKEN,
		);

		// 5. Obter métodos de entrega
		await jsonRpcCall(
			'CartController_getDeliveryMethods',
			{
				application: APP,
				orderNumber: ORDER,
			},
			TOKEN,
		);

		// 6. Definir endereço
		await jsonRpcCall(
			'CartController_setDeliveryMethod',
			{
				application: APP,
				orderNumber: ORDER,
				id: '3',
				addressCellphone: '51961549632',
			},
			TOKEN,
		);

		// 7. Obter planos de pagamento
		await jsonRpcCall(
			'CartController_getPaymentPlans',
			{
				application: APP,
				orderNumber: ORDER,
			},
			TOKEN,
		);

		// 8. Aplicar CCR
		await jsonRpcCall(
			'CartController_setDiscountCCR',
			{
				application: APP,
				ccrValue: 16.99,
				orderNumber: ORDER,
			},
			TOKEN,
		);

		// 9. Definir pagamento múltiplo
		await jsonRpcCall(
			'CartController_setPaymentPlan',
			{
				amount: 8.5,
				application: APP,
				closeOrder: true,
				installments: 1,
				orderNumber: ORDER,
				paymentCode: '18',
				paymentMode: '16',
				paymentPlanSecondMethod: JSON.stringify({
					paymentCode: '34',
					paymentMode: '9',
					amount: 8.49,
					titleId: null,
					phoneNumber: null,
				}),
			},
			TOKEN,
		);

		// 10. Consultar pedido
		const orderDetails = await jsonRpcCall(
			'SellerController_getOrderDetails',
			{
				application: APP,
				orderNumber: ORDER,
				fullCart: true,
				multiplePayments: true,
			},
			TOKEN,
		);
		console.log('Resumo do pedido:', orderDetails);
	} catch (err) {
		console.error('Erro:', err.message);
	}
}

main();
