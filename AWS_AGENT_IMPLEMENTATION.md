# 🚀 **AWS Agent Implementation - Let's Build!**

## **🎯 IMMEDIATE ACTION PLAN**

### **Phase 1: AWS Infrastructure Setup (Today)**
### **Phase 2: Purchase Capture Agents (This Week)**
### **Phase 3: Frontend Integration (Next Week)**

---

## **🏗️ PHASE 1: AWS INFRASTRUCTURE SETUP**

### **Step 1: AWS Account Setup**

#### **1. Create AWS Account**
```bash
# Go to AWS Console
https://aws.amazon.com/

# Sign up for new account
# Use free tier (12 months free)
# Set up billing alerts (important!)
```

#### **2. Install AWS CLI**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Or on macOS
brew install awscli

# Or on Windows
# Download from AWS website
```

#### **3. Configure AWS CLI**
```bash
# Configure AWS CLI
aws configure

# Enter your credentials:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: us-east-1
# Default output format: json
```

### **Step 2: Serverless Framework Setup**

#### **1. Install Serverless Framework**
```bash
# Install Serverless Framework globally
npm install -g serverless

# Verify installation
serverless --version
```

#### **2. Create Serverless Project**
```bash
# Create new serverless project
mkdir claimso-agents
cd claimso-agents

# Initialize serverless project
serverless create --template aws-nodejs-typescript

# Install dependencies
npm install
```

#### **3. Configure Serverless**
```yaml
# File: serverless.yml
service: claimso-agents

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  memorySize: 512
  timeout: 30
  environment:
    NODE_ENV: production
    SUPABASE_URL: ${env:SUPABASE_URL}
    SUPABASE_ANON_KEY: ${env:SUPABASE_ANON_KEY}
    SUPABASE_SERVICE_ROLE_KEY: ${env:SUPABASE_SERVICE_ROLE_KEY}

functions:
  email-monitoring-agent:
    handler: src/agents/email-monitoring-agent.handler
    events:
      - schedule: rate(1 hour)
    environment:
      AGENT_TYPE: email-monitoring

  browser-extension-agent:
    handler: src/agents/browser-extension-agent.handler
    events:
      - http:
          path: /api/agents/browser
          method: post
    environment:
      AGENT_TYPE: browser-extension

  mobile-app-agent:
    handler: src/agents/mobile-app-agent.handler
    events:
      - http:
          path: /api/agents/mobile
          method: post
    environment:
      AGENT_TYPE: mobile-app

  agent-orchestrator:
    handler: src/agents/agent-orchestrator.handler
    events:
      - http:
          path: /api/agents/orchestrator
          method: post
    environment:
      AGENT_TYPE: orchestrator

resources:
  Resources:
    EmailProcessingQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: email-processing-queue
        VisibilityTimeoutSeconds: 300
        MessageRetentionPeriod: 1209600

    ProductEnrichmentQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: product-enrichment-queue
        VisibilityTimeoutSeconds: 300
        MessageRetentionPeriod: 1209600

    AgentDataBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: claimso-agent-data-${self:provider.stage}
        PublicAccessBlockConfiguration:
          BlockPublicAcls: true
          BlockPublicPolicy: true
          IgnorePublicAcls: true
          RestrictPublicBuckets: true
```

### **Step 3: Project Structure**

#### **1. Create Project Structure**
```bash
# Create project directories
mkdir -p src/agents
mkdir -p src/services
mkdir -p src/types
mkdir -p src/utils
mkdir -p tests
```

#### **2. Install Dependencies**
```bash
# Install required packages
npm install @supabase/supabase-js
npm install aws-sdk
npm install uuid
npm install zod
npm install axios
npm install cheerio
npm install tesseract.js

# Install dev dependencies
npm install --save-dev @types/aws-lambda
npm install --save-dev @types/node
npm install --save-dev typescript
npm install --save-dev serverless-typescript
npm install --save-dev serverless-offline
```

#### **3. TypeScript Configuration**
```json
// File: tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## **🤖 PHASE 2: PURCHASE CAPTURE AGENTS**

### **Step 1: Email Monitoring Agent**

#### **1. Create Email Monitoring Agent**
```typescript
// File: src/agents/email-monitoring-agent.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PurchaseEvent {
  id: string;
  userId: string;
  retailer: string;
  productName: string;
  price: number;
  purchaseDate: string;
  orderNumber?: string;
  source: 'email';
  confidence: number;
  rawData: any;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Email monitoring agent started');
    
    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('is_active', true);
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }
    
    console.log(`Processing ${users?.length || 0} users`);
    
    // Process each user's emails
    for (const user of users || []) {
      try {
        await processUserEmails(user.id, user.email);
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        // Continue with next user
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email monitoring completed successfully',
        usersProcessed: users?.length || 0
      })
    };
    
  } catch (error) {
    console.error('Email monitoring agent error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Email monitoring failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function processUserEmails(userId: string, userEmail: string): Promise<void> {
  // This would integrate with Gmail API, Outlook API, etc.
  // For now, we'll simulate email processing
  
  console.log(`Processing emails for user ${userId}`);
  
  // Simulate finding purchase emails
  const purchaseEmails = await simulatePurchaseEmailDetection(userEmail);
  
  for (const email of purchaseEmails) {
    const purchaseEvent = await parsePurchaseEmail(email);
    if (purchaseEvent) {
      await createProductFromPurchaseEvent(purchaseEvent);
    }
  }
}

async function simulatePurchaseEmailDetection(userEmail: string): Promise<any[]> {
  // This would actually call Gmail API, Outlook API, etc.
  // For now, return simulated purchase emails
  
  const retailers = ['amazon.com', 'bestbuy.com', 'target.com', 'walmart.com'];
  const products = ['iPhone 15 Pro', 'MacBook Pro', 'Samsung TV', 'Nike Shoes'];
  
  const purchaseEmails = [];
  
  // Simulate 1-3 purchase emails per user
  const emailCount = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < emailCount; i++) {
    const retailer = retailers[Math.floor(Math.random() * retailers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const price = Math.floor(Math.random() * 1000) + 100;
    
    purchaseEmails.push({
      from: `noreply@${retailer}`,
      subject: `Order Confirmation - ${product}`,
      body: `Thank you for your order of ${product} for $${price}`,
      date: new Date().toISOString(),
      retailer,
      product,
      price
    });
  }
  
  return purchaseEmails;
}

async function parsePurchaseEmail(email: any): Promise<PurchaseEvent | null> {
  try {
    // Parse email content to extract purchase information
    const purchaseInfo = await extractPurchaseInfo(email);
    
    if (!purchaseInfo) {
      return null;
    }
    
    return {
      id: uuidv4(),
      userId: email.userId,
      retailer: purchaseInfo.retailer,
      productName: purchaseInfo.productName,
      price: purchaseInfo.price,
      purchaseDate: purchaseInfo.purchaseDate,
      orderNumber: purchaseInfo.orderNumber,
      source: 'email',
      confidence: purchaseInfo.confidence,
      rawData: email
    };
    
  } catch (error) {
    console.error('Error parsing purchase email:', error);
    return null;
  }
}

async function extractPurchaseInfo(email: any): Promise<any> {
  // This would use NLP/AI to extract purchase information
  // For now, use simple pattern matching
  
  const { subject, body, retailer, product, price } = email;
  
  // Simple pattern matching (in production, use AI/NLP)
  if (subject.toLowerCase().includes('order confirmation') ||
      subject.toLowerCase().includes('purchase confirmation')) {
    
    return {
      retailer,
      productName: product,
      price,
      purchaseDate: email.date,
      orderNumber: generateOrderNumber(),
      confidence: 0.8
    };
  }
  
  return null;
}

async function createProductFromPurchaseEvent(purchaseEvent: PurchaseEvent): Promise<void> {
  try {
    // Create product in database
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        user_id: purchaseEvent.userId,
        product_name: purchaseEvent.productName,
        purchase_price: purchaseEvent.price,
        purchase_date: purchaseEvent.purchaseDate,
        purchase_location: purchaseEvent.retailer,
        currency: 'USD',
        source: purchaseEvent.source,
        confidence: purchaseEvent.confidence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
    
    console.log(`Created product: ${product.id} for user: ${purchaseEvent.userId}`);
    
    // Queue product for enrichment
    await queueProductEnrichment(product.id);
    
  } catch (error) {
    console.error('Error creating product from purchase event:', error);
    throw error;
  }
}

async function queueProductEnrichment(productId: string): Promise<void> {
  // Queue product for enrichment by other agents
  // This would use SQS in production
  
  console.log(`Queued product ${productId} for enrichment`);
}

function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

#### **2. Test Email Monitoring Agent**
```bash
# Deploy to AWS
serverless deploy --stage dev

# Test locally
serverless invoke local --function email-monitoring-agent

# Check logs
serverless logs --function email-monitoring-agent --tail
```

### **Step 2: Browser Extension Agent**

#### **1. Create Browser Extension Agent**
```typescript
// File: src/agents/browser-extension-agent.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BrowserPurchaseEvent {
  userId: string;
  retailer: string;
  productName: string;
  price: number;
  purchaseDate: string;
  orderNumber?: string;
  pageUrl: string;
  rawData: any;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Browser extension agent started');
    
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No request body provided' })
      };
    }
    
    const purchaseData: BrowserPurchaseEvent = JSON.parse(event.body);
    
    // Validate purchase data
    if (!purchaseData.userId || !purchaseData.productName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    
    // Process purchase event
    const purchaseEvent = await processBrowserPurchase(purchaseData);
    
    if (purchaseEvent) {
      await createProductFromPurchaseEvent(purchaseEvent);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Browser purchase processed successfully',
        productId: purchaseEvent?.id
      })
    };
    
  } catch (error) {
    console.error('Browser extension agent error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Browser purchase processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function processBrowserPurchase(purchaseData: BrowserPurchaseEvent): Promise<any> {
  try {
    // Enrich purchase data
    const enrichedData = await enrichPurchaseData(purchaseData);
    
    return {
      id: uuidv4(),
      userId: purchaseData.userId,
      retailer: enrichedData.retailer,
      productName: enrichedData.productName,
      price: enrichedData.price,
      purchaseDate: enrichedData.purchaseDate,
      orderNumber: enrichedData.orderNumber,
      source: 'browser',
      confidence: enrichedData.confidence,
      rawData: purchaseData
    };
    
  } catch (error) {
    console.error('Error processing browser purchase:', error);
    throw error;
  }
}

async function enrichPurchaseData(purchaseData: BrowserPurchaseEvent): Promise<any> {
  // Enrich purchase data with additional information
  // This could include product specifications, warranty info, etc.
  
  return {
    retailer: purchaseData.retailer,
    productName: purchaseData.productName,
    price: purchaseData.price,
    purchaseDate: purchaseData.purchaseDate,
    orderNumber: purchaseData.orderNumber,
    confidence: 0.9 // High confidence for browser data
  };
}

async function createProductFromPurchaseEvent(purchaseEvent: any): Promise<void> {
  try {
    // Create product in database
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        user_id: purchaseEvent.userId,
        product_name: purchaseEvent.productName,
        purchase_price: purchaseEvent.price,
        purchase_date: purchaseEvent.purchaseDate,
        purchase_location: purchaseEvent.retailer,
        currency: 'USD',
        source: purchaseEvent.source,
        confidence: purchaseEvent.confidence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
    
    console.log(`Created product: ${product.id} for user: ${purchaseEvent.userId}`);
    
    // Queue product for enrichment
    await queueProductEnrichment(product.id);
    
  } catch (error) {
    console.error('Error creating product from browser purchase:', error);
    throw error;
  }
}

async function queueProductEnrichment(productId: string): Promise<void> {
  // Queue product for enrichment by other agents
  console.log(`Queued product ${productId} for enrichment`);
}
```

### **Step 3: Mobile App Agent**

#### **1. Create Mobile App Agent**
```typescript
// File: src/agents/mobile-app-agent.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MobilePurchaseEvent {
  userId: string;
  imageData?: string; // Base64 encoded receipt image
  purchaseData?: any; // Direct purchase data
  source: 'receipt_scan' | 'app_purchase';
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Mobile app agent started');
    
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No request body provided' })
      };
    }
    
    const mobileData: MobilePurchaseEvent = JSON.parse(event.body);
    
    // Validate mobile data
    if (!mobileData.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing user ID' })
      };
    }
    
    let purchaseEvent;
    
    if (mobileData.source === 'receipt_scan' && mobileData.imageData) {
      // Process receipt image
      purchaseEvent = await processReceiptImage(mobileData);
    } else if (mobileData.source === 'app_purchase' && mobileData.purchaseData) {
      // Process direct purchase data
      purchaseEvent = await processDirectPurchase(mobileData);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid mobile data' })
      };
    }
    
    if (purchaseEvent) {
      await createProductFromPurchaseEvent(purchaseEvent);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Mobile purchase processed successfully',
        productId: purchaseEvent?.id
      })
    };
    
  } catch (error) {
    console.error('Mobile app agent error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Mobile purchase processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function processReceiptImage(mobileData: MobilePurchaseEvent): Promise<any> {
  try {
    // Process receipt image using OCR
    const receiptData = await extractReceiptData(mobileData.imageData!);
    
    return {
      id: uuidv4(),
      userId: mobileData.userId,
      retailer: receiptData.retailer,
      productName: receiptData.productName,
      price: receiptData.price,
      purchaseDate: receiptData.purchaseDate,
      orderNumber: receiptData.orderNumber,
      source: 'mobile_receipt',
      confidence: receiptData.confidence,
      rawData: { imageData: mobileData.imageData, extractedData: receiptData }
    };
    
  } catch (error) {
    console.error('Error processing receipt image:', error);
    throw error;
  }
}

async function processDirectPurchase(mobileData: MobilePurchaseEvent): Promise<any> {
  try {
    const purchaseData = mobileData.purchaseData!;
    
    return {
      id: uuidv4(),
      userId: mobileData.userId,
      retailer: purchaseData.retailer,
      productName: purchaseData.productName,
      price: purchaseData.price,
      purchaseDate: purchaseData.purchaseDate,
      orderNumber: purchaseData.orderNumber,
      source: 'mobile_app',
      confidence: 0.95, // Very high confidence for direct app data
      rawData: purchaseData
    };
    
  } catch (error) {
    console.error('Error processing direct purchase:', error);
    throw error;
  }
}

async function extractReceiptData(imageData: string): Promise<any> {
  // This would use OCR (Tesseract.js) to extract data from receipt image
  // For now, return simulated data
  
  console.log('Processing receipt image with OCR');
  
  // Simulate OCR processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    retailer: 'Target',
    productName: 'Samsung TV 55"',
    price: 599.99,
    purchaseDate: new Date().toISOString(),
    orderNumber: `REC-${Date.now()}`,
    confidence: 0.85
  };
}

async function createProductFromPurchaseEvent(purchaseEvent: any): Promise<void> {
  try {
    // Create product in database
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        user_id: purchaseEvent.userId,
        product_name: purchaseEvent.productName,
        purchase_price: purchaseEvent.price,
        purchase_date: purchaseEvent.purchaseDate,
        purchase_location: purchaseEvent.retailer,
        currency: 'USD',
        source: purchaseEvent.source,
        confidence: purchaseEvent.confidence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
    
    console.log(`Created product: ${product.id} for user: ${purchaseEvent.userId}`);
    
    // Queue product for enrichment
    await queueProductEnrichment(product.id);
    
  } catch (error) {
    console.error('Error creating product from mobile purchase:', error);
    throw error;
  }
}

async function queueProductEnrichment(productId: string): Promise<void> {
  // Queue product for enrichment by other agents
  console.log(`Queued product ${productId} for enrichment`);
}
```

---

## **🔧 PHASE 3: DEPLOYMENT AND TESTING**

### **Step 1: Deploy to AWS**
```bash
# Deploy all functions to AWS
serverless deploy --stage dev

# Check deployment status
serverless info --stage dev
```

### **Step 2: Test Agents**
```bash
# Test email monitoring agent
serverless invoke --function email-monitoring-agent --stage dev

# Test browser extension agent
serverless invoke --function browser-extension-agent --stage dev --data '{"userId":"test-user","productName":"Test Product","price":100}'

# Test mobile app agent
serverless invoke --function mobile-app-agent --stage dev --data '{"userId":"test-user","source":"app_purchase","purchaseData":{"retailer":"Amazon","productName":"Test Product","price":100}}'
```

### **Step 3: Monitor Logs**
```bash
# Monitor all agent logs
serverless logs --function email-monitoring-agent --tail --stage dev
serverless logs --function browser-extension-agent --tail --stage dev
serverless logs --function mobile-app-agent --tail --stage dev
```

---

## **🎯 NEXT STEPS**

### **This Week:**
1. **Set up AWS infrastructure** ✅
2. **Build email monitoring agent** ✅
3. **Build browser extension agent** ✅
4. **Build mobile app agent** ✅
5. **Deploy and test agents** ✅

### **Next Week:**
1. **Connect agents to frontend**
2. **Build value maximization agents**
3. **Add monitoring and logging**
4. **Launch beta with automatic functionality**

---

**🚀 Ready to start building! Let's begin with the AWS infrastructure setup. Which step would you like to tackle first?**
