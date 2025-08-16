# 🛒 AMAZON API INTEGRATION SETUP GUIDE

## **📋 PREREQUISITES**
- ✅ Amazon Developer Account (you have this)
- ✅ Claimso PWA deployed on Vercel
- ✅ Supabase database configured

## **🔧 STEP 1: AMAZON DEVELOPER CONSOLE SETUP**

### **1.1 Get Your API Credentials**
1. Go to [Amazon Developer Console](https://developer.amazon.com/)
2. Navigate to **Apps & Services** → **Your Apps**
3. Create a new app or select existing app
4. Go to **Security Profile** → **Web Settings**
5. Note down:
   - **Client ID**
   - **Client Secret**

### **1.2 Configure OAuth Redirect URLs**
In your Amazon app settings, add these redirect URLs:
```
https://your-domain.vercel.app/api/auth/amazon/auth
https://your-domain.vercel.app/dashboard
```

### **1.3 Enable Required APIs**
Enable these APIs in your Amazon app:
- **Amazon MWS API** (for order history)
- **Amazon SP-API** (newer version, preferred)
- **Amazon OAuth 2.0**

## **🔧 STEP 2: ENVIRONMENT VARIABLES**

Add these to your `.env.local` file:

```bash
# Amazon API Configuration
AMAZON_CLIENT_ID=your_amazon_client_id_here
AMAZON_CLIENT_SECRET=your_amazon_client_secret_here
AMAZON_REDIRECT_URI=https://your-domain.vercel.app/api/auth/amazon/auth

# Optional: Scraper Service (if using external service)
SCRAPER_SERVICE_URL=https://your-scraper-service.com/api
SCRAPER_API_KEY=your_scraper_api_key_here
```

## **🔧 STEP 3: UPDATE VERCEL ENVIRONMENT**

1. Go to your Vercel dashboard
2. Select your Claimso project
3. Go to **Settings** → **Environment Variables**
4. Add the same variables as above

## **🔧 STEP 4: TEST THE INTEGRATION**

### **4.1 Test OAuth Flow**
1. Deploy your changes to Vercel
2. Go to your app → Dashboard
3. Click "Connect Amazon Account"
4. Complete OAuth flow
5. Verify tokens are stored in database

### **4.2 Test Order Import**
1. After OAuth, trigger order import
2. Check database for imported products
3. Verify product data quality

## **🔧 STEP 5: INTEGRATE WITH RETAILER API AGENT**

The existing `RetailerAPIAgent` needs to be updated to use real Amazon API:

### **5.1 Update Agent Configuration**
```typescript
// In claimso-aws-agents/src/handlers/retailer-api-agent.ts
const AMAZON_CONFIG = {
  name: 'Amazon',
  apiVersion: 'v2', // SP-API
  regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'IN', 'CA', 'AU'],
  oauthUrl: 'https://www.amazon.com/ap/oa',
  apiBaseUrl: 'https://sellingpartner-api.amazon.com',
  scopes: ['read_orders', 'read_items'],
  refreshInterval: 3600, // 1 hour
};
```

### **5.2 Implement Real API Calls**
```typescript
// Replace simulated data with real Amazon API calls
async function fetchAmazonOrders(userId: string, connection: RetailerConnection): Promise<RetailerOrder[]> {
  const orders = await amazonAPI.getOrders({
    accessToken: connection.accessToken,
    marketplaceIds: ['ATVPDKIKX0DER'], // US marketplace
    createdAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
  });
  
  return orders.map(order => ({
    orderId: order.AmazonOrderId,
    orderDate: order.PurchaseDate,
    totalAmount: parseFloat(order.OrderTotal.Amount),
    currency: order.OrderTotal.CurrencyCode,
    status: order.OrderStatus,
    items: order.OrderItems || []
  }));
}
```

## **🔧 STEP 6: DEPLOY UPDATED AGENTS**

```bash
# Deploy updated agents with real Amazon integration
cd claimso-aws-agents
npm run build
serverless deploy
```

## **🔧 STEP 7: MONITORING & TESTING**

### **7.1 Check Agent Logs**
```bash
# View RetailerAPIAgent logs
aws logs tail /aws/lambda/claimso-agents-dev-retailerAPIAgent --follow
```

### **7.2 Test End-to-End Flow**
1. User connects Amazon account
2. RetailerAPIAgent fetches real orders
3. Products appear in dashboard
4. Warranty and cash opportunities identified

## **🚨 TROUBLESHOOTING**

### **Common Issues:**

#### **OAuth Error: "Invalid redirect URI"**
- Check redirect URI in Amazon Developer Console
- Ensure it matches exactly with your Vercel domain

#### **API Error: "Insufficient permissions"**
- Check scopes in Amazon app settings
- Ensure required APIs are enabled

#### **Token Error: "Access token expired"**
- Implement token refresh logic
- Check token expiration handling

#### **Rate Limiting: "Too many requests"**
- Implement exponential backoff
- Add request throttling

## **📊 EXPECTED RESULTS**

After successful integration:
- ✅ Real Amazon orders imported automatically
- ✅ Product data enriched with real information
- ✅ Warranty opportunities identified from real data
- ✅ Cash extraction opportunities based on real market data
- ✅ Calendar events created for warranty expiry

## **🎯 NEXT STEPS**

1. **Test with real Amazon account**
2. **Monitor agent performance**
3. **Scale to other retailers** (Best Buy, Target, etc.)
4. **Implement advanced features** (real-time sync, etc.)

---

**Need help?** Check the logs and ensure all environment variables are set correctly.
