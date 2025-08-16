# 🚀 **AWS AGENT DEPLOYMENT GUIDE**

## **📅 Created: December 2024**

---

## **🎯 PURPOSE**

This guide provides step-by-step instructions for deploying the updated AWS agents with the new secure JWT-based authentication system.

---

## **⚠️ PREREQUISITES**

Before deploying, ensure you have:
- ✅ AWS CLI installed and configured
- ✅ Node.js and npm installed
- ✅ Access to the AWS account where agents are deployed
- ✅ The `jose` dependency added to package.json
- ✅ All agent handlers updated with secure authentication

---

## **🚀 STEP-BY-STEP DEPLOYMENT**

### **Step 1: Navigate to AWS Agents Directory**

```bash
cd claimso-aws-agents
```

### **Step 2: Install Dependencies**

```bash
# Install the new jose dependency for JWT
npm install jose@^5.2.0

# Install all other dependencies
npm install
```

### **Step 3: Build the Project**

```bash
# Build TypeScript to JavaScript
npm run build
```

### **Step 4: Verify Environment Variables**

Check that your `.env` file in the `claimso-aws-agents` directory contains:

```env
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
AGENT_JWT_SECRET=your-secure-jwt-secret
NODE_ENV=dev
AGENT_LOG_LEVEL=info
AGENT_BATCH_SIZE=10
AGENT_MAX_RETRIES=3
```

### **Step 5: Test Local Deployment**

```bash
# Test the serverless configuration
serverless print

# Validate the serverless configuration
serverless config validate
```

### **Step 6: Deploy to AWS**

#### **Option A: Deploy All Agents**
```bash
# Deploy all agents to AWS
serverless deploy

# Or deploy to a specific stage
serverless deploy --stage dev
```

#### **Option B: Deploy Individual Agents**
```bash
# Deploy specific agents
serverless deploy function --function email-monitoring-agent
serverless deploy function --function retailer-api-agent
serverless deploy function --function bank-integration-agent
serverless deploy function --function duplicate-detection-agent
serverless deploy function --function product-intelligence-agent
serverless deploy function --function warranty-intelligence-agent
serverless deploy function --function warranty-claim-agent
serverless deploy function --function cash-extraction-agent
serverless deploy function --function browser-extension-agent
serverless deploy function --function mobile-app-agent
```

### **Step 7: Verify Deployment**

```bash
# List deployed functions
serverless info

# Check function logs
serverless logs --function email-monitoring-agent
```

---

## **🔧 CONFIGURATION FILES**

### **serverless.yml Configuration**

The `serverless.yml` file should include:

```yaml
service: claimso-agents

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: dev
  environment:
    SUPABASE_URL: ${env:SUPABASE_URL}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${env:NEXT_PUBLIC_SUPABASE_ANON_KEY}
    AGENT_JWT_SECRET: ${env:AGENT_JWT_SECRET}
    NODE_ENV: ${env:NODE_ENV}
    AGENT_LOG_LEVEL: ${env:AGENT_LOG_LEVEL}
    AGENT_BATCH_SIZE: ${env:AGENT_BATCH_SIZE}
    AGENT_MAX_RETRIES: ${env:AGENT_MAX_RETRIES}

functions:
  email-monitoring-agent:
    handler: src/handlers/email-monitoring-agent.handler
    events:
      - schedule: rate(1 hour)
  
  retailer-api-agent:
    handler: src/handlers/retailer-api-agent.handler
    events:
      - schedule: rate(2 hours)
  
  bank-integration-agent:
    handler: src/handlers/bank-integration-agent.handler
    events:
      - schedule: rate(1 hour)
  
  duplicate-detection-agent:
    handler: src/handlers/duplicate-detection-agent.handler
    events:
      - schedule: rate(6 hours)
  
  product-intelligence-agent:
    handler: src/handlers/product-intelligence-agent.handler
    events:
      - schedule: rate(12 hours)
  
  warranty-intelligence-agent:
    handler: src/handlers/warranty-intelligence-agent.handler
    events:
      - schedule: rate(24 hours)
  
  warranty-claim-agent:
    handler: src/handlers/warranty-claim-agent.handler
    events:
      - schedule: rate(24 hours)
  
  cash-extraction-agent:
    handler: src/handlers/cash-extraction-agent.handler
    events:
      - schedule: rate(12 hours)
  
  browser-extension-agent:
    handler: src/handlers/browser-extension-agent.handler
    events:
      - http:
          path: /browser-extension
          method: post
  
  mobile-app-agent:
    handler: src/handlers/mobile-app-agent.handler
    events:
      - http:
          path: /mobile-app
          method: post
```

### **Package.json Dependencies**

Ensure your `package.json` includes:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0",
    "jose": "^5.2.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.133",
    "@types/node": "^20.10.0",
    "serverless": "^3.38.0",
    "serverless-dotenv-plugin": "^6.0.0",
    "serverless-offline": "^13.3.0",
    "typescript": "^5.3.0"
  }
}
```

---

## **🧪 TESTING DEPLOYMENT**

### **Step 1: Test Individual Agents**

```bash
# Test email monitoring agent
serverless invoke --function email-monitoring-agent

# Test retailer API agent
serverless invoke --function retailer-api-agent

# Test bank integration agent
serverless invoke --function bank-integration-agent
```

### **Step 2: Test HTTP Endpoints**

```bash
# Test browser extension agent
curl -X POST https://your-api-gateway-url/dev/browser-extension \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "productData": {"name": "Test Product"}}'

# Test mobile app agent
curl -X POST https://your-api-gateway-url/dev/mobile-app \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "imageData": "base64-encoded-receipt"}'
```

### **Step 3: Check Logs**

```bash
# Check logs for all functions
serverless logs

# Check logs for specific function
serverless logs --function email-monitoring-agent --tail
```

---

## **🔍 VERIFICATION CHECKLIST**

After deployment, verify:

### **✅ Infrastructure**
- [ ] All 10 Lambda functions deployed
- [ ] API Gateway endpoints created
- [ ] CloudWatch log groups created
- [ ] IAM roles and policies configured

### **✅ Authentication**
- [ ] JWT token generation working
- [ ] Agent authentication successful
- [ ] Database access with agent tokens working
- [ ] Permission-based access control active

### **✅ Functionality**
- [ ] Scheduled agents running on schedule
- [ ] HTTP endpoints responding correctly
- [ ] Error handling working properly
- [ ] Logging and monitoring active

### **✅ Security**
- [ ] No service role key usage in agents
- [ ] JWT tokens properly generated and used
- [ ] Database access properly restricted
- [ ] Agent permissions working correctly

---

## **🚨 TROUBLESHOOTING**

### **Common Issues:**

**Issue: "Module not found: jose"**
- **Solution:** Ensure `jose` is installed: `npm install jose@^5.2.0`

**Issue: "Invalid JWT token"**
- **Solution:** Check `AGENT_JWT_SECRET` environment variable is set correctly

**Issue: "Database access denied"**
- **Solution:** Verify RLS policies are applied in Supabase Dashboard

**Issue: "Function timeout"**
- **Solution:** Increase timeout in serverless.yml:
  ```yaml
  functions:
    email-monitoring-agent:
      timeout: 300
  ```

**Issue: "Memory limit exceeded"**
- **Solution:** Increase memory allocation:
  ```yaml
  functions:
    email-monitoring-agent:
      memorySize: 512
  ```

### **Debug Commands:**

```bash
# Check function configuration
serverless info

# View function logs
serverless logs --function function-name --tail

# Test function locally
serverless invoke local --function function-name

# Check environment variables
serverless print
```

---

## **📊 DEPLOYMENT METRICS**

### **Expected Results:**
- **Functions Deployed:** 10/10
- **API Endpoints:** 2 (browser-extension, mobile-app)
- **Scheduled Jobs:** 8 (hourly/daily agents)
- **Memory Usage:** ~128MB per function
- **Timeout:** 30 seconds per function
- **Cost:** ~$5-10/month for all agents

### **Performance Monitoring:**
- Monitor CloudWatch metrics for each function
- Check error rates and response times
- Monitor database connection usage
- Track agent execution frequency

---

## **🔄 ROLLBACK PROCEDURE**

If deployment fails or issues arise:

### **Step 1: Rollback to Previous Version**
```bash
# List previous deployments
serverless deploy list

# Rollback to specific version
serverless rollback --timestamp 2024-12-16T10:00:00.000Z
```

### **Step 2: Remove Functions**
```bash
# Remove all functions
serverless remove
```

### **Step 3: Redeploy Previous Version**
```bash
# Checkout previous code version
git checkout previous-commit-hash

# Redeploy
serverless deploy
```

---

## **📞 SUPPORT**

If you encounter issues:
1. Check CloudWatch logs for detailed error messages
2. Verify environment variables are set correctly
3. Test functions locally before deployment
4. Check Supabase logs for database access issues
5. Review serverless.yml configuration

---

**🎯 Once the AWS agents are deployed with the new secure authentication system, the security fix will be complete and the system will be fully operational with proper security controls.**
