#!/bin/zsh

API_URL="https://hmcp-proxy-re-bff-pt.internacional.grupoboticario.digital/mcp/v1"
USER="1001638"
PASS="OBoticario@123"
APP="mcp-re-bff"

# 1. Login
TOKEN=$(curl -s -X POST "$API_URL/login/auth" \
  -H "Content-Type: application/json" \
  -d "{\"application\":\"$APP\",\"tokenPass\":\"$PASS\",\"tokenUser\":\"$USER\"}" | jq -r '.data.access_token')

# 2. Obter carrinho aberto
ORDER=$(curl -s -X GET "$API_URL/cart?application=$APP&fullCart=true&orderNumber=0" \
  -H "token-user: $TOKEN" -H "token-user-id: $USER" | jq -r '.data.id')

# 3. Adicionar produtos
curl -s -X POST "$API_URL/cart" \
  -H "Content-Type: application/json" \
  -H "token-user: $TOKEN" -H "token-user-id: $USER" \
  -d "{\"application\":\"$APP\",\"fullCart\":true,\"orderNumber\":\"$ORDER\",\"productOccurrences\":1,\"productsKitChoice\":\"\",\"quantity\":2,\"sku\":\"62341\"}"

curl -s -X POST "$API_URL/cart" \
  -H "Content-Type: application/json" \
  -H "token-user: $TOKEN" -H "token-user-id: $USER" \
  -d "{\"application\":\"$APP\",\"fullCart\":true,\"orderNumber\":\"$ORDER\",\"productOccurrences\":1,\"productsKitChoice\":\"\",\"quantity\":3,\"sku\":\"61828\"}"

# 4. Checar promoções
curl -s -X POST "$API_URL/cart/checkPromotions" \
  -H "Content-Type: application/json" \
  -H "token-user: $TOKEN" -H "token-user-id: $USER" \
  -d "{\"application\":\"$APP\",\"orderNumber\":\"$ORDER\"}"

# 5. Obter métodos de entrega
curl -s -X GET "$API_URL/cart/deliveryMethods?application=$APP&orderNumber=$ORDER" \
  -H "token-user: $TOKEN" -H "token-user-id: $USER"

# 6. Definir endereço
curl -s -X POST "$API_URL/cart/deliveryMethod" \
  -H "Content-Type: application/json" \
  -H "token-user: $TOKEN" -H "token-user-id: $USER" \
  -d "{\"application\":\"$APP\",\"orderNumber\":\"$ORDER\",\"id\":\"3\",\"addressCellphone\":\"51961549632\"}"

# 7. Obter planos de pagamento
curl -s -X GET "$API_URL/cart/paymentPlans?application=$APP&orderNumber=$ORDER" \
  -H "token-user: $TOKEN" -H "token-user-id: $USER"

# 8. Aplicar CCR (ajuste valor conforme necessário)
curl -s -X POST "$API_URL/cart/discountCCR" \
  -H "Content-Type: application/json" \
  -H "token-user: $TOKEN" -H "token-user-id: $USER" \
  -d "{\"application\":\"$APP\",\"ccrValue\":16.99,\"orderNumber\":$ORDER}"

# 9. Definir pagamento múltiplo (Crédito Boticário + Multibanco)
curl -s -X POST "$API_URL/cart/paymentPlan" \
  -H "Content-Type: application/json" \
  -H "token-user: $TOKEN" -H "token-user-id: $USER" \
  -d '{
    "amount": 8.5,
    "application": "'$APP'",
    "closeOrder": true,
    "installments": 1,
    "orderNumber": "'$ORDER'",
    "paymentCode": "18",
    "paymentMode": "16",
    "paymentPlanSecondMethod": "{\"paymentCode\":\"34\",\"paymentMode\":\"9\",\"amount\":8.49,\"titleId\":null,\"phoneNumber\":null}"
  }'

# 10. Consultar pedido
curl -s -X GET "$API_URL/seller/orderDetails?application=$APP&orderNumber=$ORDER&fullCart=true&multiplePayments=true" \
  -H "token-user: $TOKEN" -H "token-user-id: $USER"
