# 🚀 **AWS Agent Infrastructure Setup Guide**

## **🎯 PHASE 1: AWS ACCOUNT & CLI SETUP**

### **Step 1: Create AWS Account**
1. **Go to:** https://aws.amazon.com/
2. **Click:** "Create an AWS Account"
3. **Fill in:** Your details (email, password, account name)
4. **Add payment method:** Credit card required (won't be charged in free tier)
5. **Verify identity:** Phone verification
6. **Choose plan:** Free tier (default)

### **Step 2: Install AWS CLI**
```bash
# For macOS (using Homebrew)
brew install awscli

# For Windows (using Chocolatey)
choco install awscli

# For Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### **Step 3: Configure AWS CLI**
```bash
# Run this command
aws configure

# You'll be prompted for:
AWS Access Key ID: [Enter your access key]
AWS Secret Access Key: [Enter your secret key]
Default region name: us-east-1
Default output format: json
```

#### **How to get Access Keys:**
1. **Go to AWS Console**
2. **Click your username** (top right)
3. **Click "Security credentials"**
4. **Click "Access keys"**
5. **Click "Create access key"**
6. **Copy the Access Key ID and Secret Access Key**

---

## **🎯 PHASE 2: SERVERLESS FRAMEWORK SETUP**

### **Step 1: Install Serverless Framework**
```bash
# Install globally
npm install -g serverless

# Verify installation
serverless --version
```

### **Step 2: Create Serverless Project**
```bash
# Create new directory for AWS agents
mkdir claimso-aws-agents
cd claimso-aws-agents

# Initialize serverless project
serverless create --template aws-nodejs-typescript --name claimso-agents

# Install dependencies
npm install
```

### **Step 3: Configure Serverless**
```bash
# Install additional dependencies
npm install @types/aws-lambda uuid @supabase/supabase-js axios
npm install --save-dev serverless-offline serverless-dotenv-plugin
```

---

## **🎯 PHASE 3: PROJECT STRUCTURE**

### **Create the following directory structure:**
```
claimso-aws-agents/
├── src/
│   ├── agents/
│   │   ├── email-monitoring-agent.ts
│   │   ├── browser-extension-agent.ts
│   │   ├── mobile-app-agent.ts
│   │   ├── product-intelligence-agent.ts
│   │   ├── warranty-intelligence-agent.ts
│   │   ├── warranty-claim-agent.ts
│   │   └── cash-extraction-agent.ts
│   ├── shared/
│   │   ├── database.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── handlers/
│       └── index.ts
├── serverless.yml
├── package.json
└── .env
```

---

## **🎯 PHASE 4: CONFIGURATION FILES**

### **Step 1: Create serverless.yml**
```yaml
service: claimso-agents

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  environment:
    SUPABASE_URL: ${env:SUPABASE_URL}
    SUPABASE_SERVICE_ROLE_KEY: ${env:SUPABASE_SERVICE_ROLE_KEY}
    NODE_ENV: ${self:provider.stage}
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - sqs:SendMessage
            - sqs:ReceiveMessage
            - sqs:DeleteMessage
          Resource: "*"
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
          Resource: "*"

functions:
  emailMonitoringAgent:
    handler: src/handlers/email-monitoring-agent.handler
    events:
      - schedule: rate(1 hour)
    timeout: 300
    memorySize: 512

  browserExtensionAgent:
    handler: src/handlers/browser-extension-agent.handler
    events:
      - http:
          path: /browser-extension
          method: post
          cors: true
    timeout: 60
    memorySize: 256

  mobileAppAgent:
    handler: src/handlers/mobile-app-agent.handler
    events:
      - http:
          path: /mobile-app
          method: post
          cors: true
    timeout: 60
    memorySize: 256

  productIntelligenceAgent:
    handler: src/handlers/product-intelligence-agent.handler
    events:
      - sqs:
          arn: !GetAtt ProductEnrichmentQueue.Arn
    timeout: 300
    memorySize: 512

  warrantyIntelligenceAgent:
    handler: src/handlers/warranty-intelligence-agent.handler
    events:
      - sqs:
          arn: !GetAtt WarrantyEnrichmentQueue.Arn
    timeout: 300
    memorySize: 512

  warrantyClaimAgent:
    handler: src/handlers/warranty-claim-agent.handler
    events:
      - schedule: rate(1 day)
    timeout: 300
    memorySize: 512

  cashExtractionAgent:
    handler: src/handlers/cash-extraction-agent.handler
    events:
      - schedule: rate(1 day)
    timeout: 300
    memorySize: 512

resources:
  Resources:
    ProductEnrichmentQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:service}-product-enrichment-${self:provider.stage}
        VisibilityTimeoutSeconds: 300
        MessageRetentionPeriod: 1209600

    WarrantyEnrichmentQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:service}-warranty-enrichment-${self:provider.stage}
        VisibilityTimeoutSeconds: 300
        MessageRetentionPeriod: 1209600

    AgentDataBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:service}-agent-data-${self:provider.stage}
        PublicAccessBlockConfiguration:
          BlockPublicAcls: true
          BlockPublicPolicy: true
          IgnorePublicAcls: true
          RestrictPublicBuckets: true

plugins:
  - serverless-offline
  - serverless-dotenv-plugin
```

### **Step 2: Create .env file**
```bash
# Create .env file
touch .env
```

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AWS Configuration
AWS_REGION=us-east-1
AWS_STAGE=dev

# Agent Configuration
AGENT_LOG_LEVEL=info
AGENT_BATCH_SIZE=10
AGENT_MAX_RETRIES=3
```

---

## **🎯 PHASE 5: SHARED UTILITIES**

### **Step 1: Create src/shared/database.ts**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  settings: {
    email_monitoring_enabled: boolean;
    browser_extension_enabled: boolean;
    mobile_app_enabled: boolean;
  };
}

export interface DatabaseProduct {
  id: string;
  user_id: string;
  name: string;
  description: string;
  purchase_date: string;
  purchase_price: number;
  retailer: string;
  order_number: string;
  warranty_info: any;
  market_value: number;
  created_at: string;
  updated_at: string;
}

export async function getActiveUsers(): Promise<DatabaseUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching active users:', error);
    return [];
  }

  return data || [];
}

export async function createProduct(product: Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select('id')
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return null;
  }

  return data.id;
}

export async function updateProduct(id: string, updates: Partial<DatabaseProduct>): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating product:', error);
    return false;
  }

  return true;
}
```

### **Step 2: Create src/shared/types.ts**
```typescript
export interface PurchaseEvent {
  id: string;
  userId: string;
  productName: string;
  productDescription?: string;
  purchasePrice: number;
  purchaseDate: string;
  retailer: string;
  orderNumber?: string;
  receiptImageUrl?: string;
  source: 'email' | 'browser' | 'mobile' | 'bank';
  rawData: any;
}

export interface EnrichmentJob {
  id: string;
  productId: string;
  userId: string;
  type: 'product_intelligence' | 'warranty_intelligence';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ValueOpportunity {
  id: string;
  productId: string;
  userId: string;
  type: 'warranty_claim' | 'cash_extraction' | 'maintenance' | 'upgrade';
  title: string;
  description: string;
  potentialValue: number;
  confidence: number;
  actionRequired: string;
  createdAt: string;
}

export interface AgentAlert {
  id: string;
  userId: string;
  type: 'opportunity' | 'warning' | 'info';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  createdAt: string;
  read: boolean;
}
```

### **Step 3: Create src/shared/utils.ts**
```typescript
import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function parseEmailContent(emailContent: string): any {
  // Basic email parsing logic
  // This will be enhanced with more sophisticated NLP later
  
  const purchaseKeywords = [
    'order confirmation',
    'purchase confirmation',
    'thank you for your order',
    'your order has been placed',
    'order details'
  ];

  const hasPurchaseKeywords = purchaseKeywords.some(keyword => 
    emailContent.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!hasPurchaseKeywords) {
    return null;
  }

  // Extract basic information using regex
  const priceMatch = emailContent.match(/\$[\d,]+\.?\d*/);
  const dateMatch = emailContent.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
  
  return {
    isPurchase: true,
    price: priceMatch ? parseFloat(priceMatch[0].replace('$', '').replace(',', '')) : null,
    date: dateMatch ? dateMatch[0] : null,
    rawContent: emailContent
  };
}

export function calculateMarketValue(originalPrice: number, purchaseDate: string, category: string): number {
  // Basic depreciation calculation
  // This will be enhanced with real market data later
  
  const purchaseTime = new Date(purchaseDate).getTime();
  const currentTime = Date.now();
  const monthsSincePurchase = (currentTime - purchaseTime) / (1000 * 60 * 60 * 24 * 30);
  
  // Simple depreciation model
  const depreciationRate = 0.02; // 2% per month
  const depreciatedValue = originalPrice * Math.pow(1 - depreciationRate, monthsSincePurchase);
  
  return Math.max(depreciatedValue, originalPrice * 0.1); // Minimum 10% of original value
}

export function logAgentActivity(agentName: string, action: string, details: any): void {
  console.log(`[${new Date().toISOString()}] [${agentName}] ${action}:`, details);
}
```

---

## **🎯 PHASE 6: DEPLOYMENT**

### **Step 1: Deploy to AWS**
```bash
# Deploy all functions and infrastructure
serverless deploy

# Deploy to specific stage
serverless deploy --stage prod
```

### **Step 2: Verify Deployment**
```bash
# List deployed functions
serverless info

# Check logs
serverless logs -f emailMonitoringAgent

# Test function locally
serverless invoke local -f emailMonitoringAgent
```

---

## **🎯 PHASE 7: TESTING**

### **Step 1: Test Email Monitoring Agent**
```bash
# Test the function
serverless invoke -f emailMonitoringAgent

# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/claimso-agents-dev-emailMonitoringAgent"
```

### **Step 2: Test API Endpoints**
```bash
# Get the API Gateway URL
serverless info

# Test browser extension endpoint
curl -X POST https://your-api-gateway-url/dev/browser-extension \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","productName":"Test Product","purchasePrice":100}'
```

---

## **🎯 NEXT STEPS**

### **After Setup:**
1. **Verify all functions are deployed**
2. **Test email monitoring agent**
3. **Test API endpoints**
4. **Monitor CloudWatch logs**
5. **Set up monitoring and alerts**

### **Ready to Build Agents:**
1. **Email Monitoring Agent** ✅
2. **Browser Extension Agent** ✅
3. **Mobile App Agent** ✅
4. **Product Intelligence Agent** ✅
5. **Warranty Intelligence Agent** ✅
6. **Warranty Claim Agent** ✅
7. **Cash Extraction Agent** ✅

---

**🚀 Ready to start the setup process? Let me know which step you'd like to begin with!**
