# 🚀 Claimso AWS Agents

AWS Lambda agents for the Claimso platform that automatically capture purchase events and maximize post-purchase value.

## 🏗️ Architecture

### **Agent Types:**
1. **Purchase Capture Agents**
   - Email Monitoring Agent (runs every hour)
   - Browser Extension Agent (API endpoint)
   - Mobile App Agent (API endpoint)

2. **Data Enrichment Agents**
   - Product Intelligence Agent (SQS triggered)
   - Warranty Intelligence Agent (SQS triggered)

3. **Value Maximization Agents**
   - Warranty Claim Agent (runs daily)
   - Cash Extraction Agent (runs daily)

## 🚀 Quick Start

### **Prerequisites:**
- AWS CLI configured
- Node.js 18+
- Serverless Framework

### **Setup:**
1. **Clone and install:**
   ```bash
   cd claimso-aws-agents
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Deploy to AWS:**
   ```bash
   npm run deploy
   ```

## 📁 Project Structure

```
claimso-aws-agents/
├── src/
│   ├── handlers/           # Lambda function handlers
│   │   ├── email-monitoring-agent.ts
│   │   ├── browser-extension-agent.ts
│   │   ├── mobile-app-agent.ts
│   │   ├── product-intelligence-agent.ts
│   │   ├── warranty-intelligence-agent.ts
│   │   ├── warranty-claim-agent.ts
│   │   └── cash-extraction-agent.ts
│   ├── shared/             # Shared utilities
│   │   ├── database.ts     # Supabase client
│   │   ├── types.ts        # TypeScript interfaces
│   │   └── utils.ts        # Helper functions
│   └── agents/             # Agent logic (future)
├── serverless.yml          # Serverless configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## 🔧 Configuration

### **Environment Variables:**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `AWS_REGION`: AWS region (default: us-east-1)
- `AWS_STAGE`: Deployment stage (default: dev)

### **AWS Services Used:**
- **Lambda**: Serverless functions
- **SQS**: Message queues for job processing
- **S3**: File storage
- **API Gateway**: HTTP endpoints
- **CloudWatch**: Monitoring and logging

## 🚀 Deployment

### **Development:**
```bash
npm run deploy
```

### **Production:**
```bash
npm run deploy:prod
```

### **Local Testing:**
```bash
serverless offline
```

## 📊 Monitoring

### **View Logs:**
```bash
npm run logs
```

### **CloudWatch Metrics:**
- Function execution times
- Error rates
- Success rates
- Cost tracking

## 💰 Cost Analysis

### **Free Tier (12 months):**
- **Lambda**: 1M requests/month
- **SQS**: 1M requests/month
- **S3**: 5GB storage
- **API Gateway**: 1M requests/month

### **Estimated Usage (1000 users):**
- **Lambda**: 50K requests/month (5% of free tier)
- **SQS**: 10K requests/month (1% of free tier)
- **Total Cost**: $0/month (within free tier)

## 🔄 Agent Workflow

### **1. Purchase Capture:**
1. Email Monitoring Agent checks emails every hour
2. Browser Extension Agent receives purchase events
3. Mobile App Agent processes receipt uploads
4. Products created in database automatically

### **2. Data Enrichment:**
1. New products trigger enrichment jobs
2. Product Intelligence Agent researches specifications
3. Warranty Intelligence Agent finds warranty options
4. Data enriched and stored

### **3. Value Maximization:**
1. Daily agents scan all products
2. Warranty Claim Agent finds claim opportunities
3. Cash Extraction Agent finds selling opportunities
4. Users notified of value opportunities

## 🛠️ Development

### **Adding New Agents:**
1. Create handler in `src/handlers/`
2. Add function to `serverless.yml`
3. Implement agent logic
4. Deploy and test

### **Testing:**
```bash
# Test specific function
serverless invoke -f emailMonitoringAgent

# Test locally
serverless invoke local -f emailMonitoringAgent
```

## 📈 Scaling

### **Automatic Scaling:**
- Lambda auto-scales based on demand
- SQS queues handle job backlogs
- CloudWatch monitors performance

### **Manual Scaling:**
- Increase Lambda memory for complex agents
- Add more SQS workers for high volume
- Use provisioned concurrency for consistent performance

## 🔒 Security

### **IAM Roles:**
- Minimal permissions principle
- Function-specific roles
- Secure environment variables

### **Data Protection:**
- All data encrypted in transit
- S3 bucket access restricted
- Supabase connection secured

## 📞 Support

For issues or questions:
1. Check CloudWatch logs
2. Review function metrics
3. Test locally with `serverless offline`
4. Check AWS service quotas

---

**🚀 Ready to maximize your post-purchase value!**
