# 🧠 **Agent Decision Tree Architecture**

## **📅 Last Updated: December 2024**

---

## **🎯 AGENT HIERARCHY & RELATIONSHIPS**

```
                    ┌─────────────────────────────────────┐
                    │         MASTER ORCHESTRATOR         │
                    │     (Not Yet Implemented)           │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
        ┌───────────▼──────────┐ ┌────▼────┐ ┌──────────▼──────────┐
        │   PURCHASE CAPTURE   │ │  DATA   │ │   VALUE MAXIMIZATION │
        │      AGENTS          │ │ENRICHMENT│ │       AGENTS         │
        │                      │ │ AGENTS  │ │                      │
        └──────────────────────┘ └─────────┘ └──────────────────────┘
```

---

## **🔄 AGENT DECISION TREE STRUCTURE**

### **LEVEL 1: PURCHASE CAPTURE AGENTS**
```
User makes purchase → Multiple agents detect simultaneously
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼───┐   ┌───▼───┐   ┌────▼────┐
    │EMAIL  │   │RETAILER│   │  BANK   │
    │MONITOR│   │  API   │   │INTEGRATION│
    └───────┘   └───────┘   └─────────┘
        │            │            │
        └────────────┼────────────┘
                     │
              Purchase Event Detected
```

### **LEVEL 2: DATA ENRICHMENT AGENTS**
```
Purchase Event → Trigger enrichment pipeline
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼───┐ ┌─────▼─────┐ ┌───▼───┐
│PRODUCT│ │WARRANTY   │ │DUPLICATE│
│INTELLI│ │INTELLIGENCE│ │DETECTION│
│GENCE  │ │           │ │        │
└───────┘ └───────────┘ └────────┘
    │           │           │
    └───────────┼───────────┘
                │
        Enriched Product Profile
```

### **LEVEL 3: VALUE MAXIMIZATION AGENTS**
```
Enriched Product → Continuous value monitoring
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐ ┌───────▼───────┐ ┌───▼───┐
│CASH   │ │WARRANTY CLAIM │ │MAINTENANCE│
│EXTRAC │ │               │ │OPTIMIZATION│
│TION   │ │               │ │           │
└───────┘ └───────────────┘ └───────────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
        Value Opportunities Generated
```

---

## **🤖 INDIVIDUAL AGENT ANALYSIS**

### **1. EMAIL MONITORING AGENT**
**Purpose**: Automatically detect purchases from email confirmations
**Trigger**: Every hour (scheduled) + HTTP endpoint
**Process**:
```
1. Get all active users with email monitoring enabled
2. For each user:
   - Connect to their email (Gmail/Outlook/IMAP)
   - Search for purchase confirmation emails
   - Parse email content for product details
   - Extract: product name, price, date, retailer
   - Create purchase event
   - Trigger product creation
3. Log results and errors
```

**Current Status**: ✅ WORKING (3.2s response time)
**Issues**: Using simulated data, needs real email API integration

### **2. RETAILER API AGENT**
**Purpose**: Direct integration with retailer APIs for purchase history
**Trigger**: Every hour (scheduled) + HTTP endpoint
**Process**:
```
1. Get all active users with retailer connections
2. For each user:
   - Get their retailer connections (Amazon, Apple, Best Buy, etc.)
   - For each retailer:
     - Refresh OAuth tokens if needed
     - Call retailer API for recent orders
     - Parse order data for products
     - Create purchase events
     - Trigger product creation
3. Log results and errors
```

**Current Status**: ❌ UNTESTED (needs real API keys)
**Issues**: Requires real retailer API integrations

### **3. BANK INTEGRATION AGENT**
**Purpose**: Detect purchases from bank/credit card transactions
**Trigger**: Every 2 hours (scheduled) + HTTP endpoint
**Process**:
```
1. Get all active users with bank connections
2. For each user:
   - Get their bank connections (Plaid, Tink, etc.)
   - For each bank:
     - Fetch recent transactions
     - Analyze transaction descriptions
     - Use ML to classify purchases
     - Extract product information
     - Create purchase events
     - Trigger product creation
3. Log results and errors
```

**Current Status**: ❌ UNTESTED (needs real bank API integrations)
**Issues**: Requires real bank API integrations

### **4. DUPLICATE DETECTION AGENT**
**Purpose**: Prevent duplicate products across all sources
**Trigger**: Every 6 hours (scheduled) + HTTP endpoint
**Process**:
```
1. Get all products for all users
2. For each product:
   - Generate product fingerprint
   - Compare with existing products
   - Use similarity algorithms
   - Identify potential duplicates
   - Merge or flag duplicates
3. Log results and actions taken
```

**Current Status**: ❌ UNTESTED
**Issues**: Needs testing with real product data

### **5. PRODUCT INTELLIGENCE AGENT**
**Purpose**: Enrich product data with specifications and market info
**Trigger**: SQS queue (when new product created) + HTTP endpoint
**Process**:
```
1. Get product to enrich
2. Research product specifications:
   - Manufacturer websites
   - Review sites
   - Tech databases
   - Market data
3. Add: specs, reviews, common issues, market trends
4. Update product in database
5. Trigger warranty intelligence agent
```

**Current Status**: ❌ UNTESTED
**Issues**: Needs real data sources

### **6. WARRANTY INTELLIGENCE AGENT**
**Purpose**: Research warranty coverage and options
**Trigger**: SQS queue (after product enrichment) + HTTP endpoint
**Process**:
```
1. Get product to research
2. Research warranty information:
   - Manufacturer warranty terms
   - Extended warranty options
   - Common warranty issues
   - Claim processes
3. Add: warranty terms, coverage, exclusions, claim info
4. Update product in database
5. Trigger value maximization agents
```

**Current Status**: ❌ BROKEN (502 Internal Server Error)
**Issues**: Agent code has internal error

### **7. CASH EXTRACTION AGENT**
**Purpose**: Find selling opportunities and cash offers
**Trigger**: Daily (scheduled) + HTTP endpoint
**Process**:
```
1. Get all products for all users
2. For each product:
   - Calculate current market value
   - Check upgrade timing
   - Analyze seasonal opportunities
   - Check warranty expiration
   - Research market trends
   - Generate selling recommendations
3. Create selling opportunities in database
4. Log results and opportunities found
```

**Current Status**: ❌ BROKEN (30+ second timeout)
**Issues**: Processing too many products, too slowly

### **8. WARRANTY CLAIM AGENT**
**Purpose**: Automate warranty claim filing
**Trigger**: Daily (scheduled) + HTTP endpoint
**Process**:
```
1. Get all products with active warranties
2. For each product:
   - Check warranty status
   - Identify claimable issues
   - Generate claim documentation
   - Track claim status
   - Optimize claim outcomes
3. Log results and claims filed
```

**Current Status**: ❌ UNTESTED
**Issues**: Needs testing with real warranty data

### **9. BROWSER EXTENSION AGENT**
**Purpose**: Real-time purchase capture from browser
**Trigger**: HTTP endpoint (when browser extension detects purchase)
**Process**:
```
1. Receive purchase data from browser extension
2. Validate purchase information
3. Create purchase event
4. Trigger product creation
5. Return confirmation to extension
```

**Current Status**: ❌ UNTESTED
**Issues**: Browser extension not built

### **10. MOBILE APP AGENT**
**Purpose**: Process receipts and mobile purchases
**Trigger**: HTTP endpoint (when mobile app uploads receipt)
**Process**:
```
1. Receive receipt image/data from mobile app
2. Process receipt with OCR
3. Extract product information
4. Create purchase event
5. Trigger product creation
6. Return confirmation to mobile app
```

**Current Status**: ❌ UNTESTED
**Issues**: Mobile app not built

---

## **🔗 AGENT INTERDEPENDENCIES**

### **Data Flow Dependencies**:
```
Email Monitor → Product Creation → Product Intelligence → Warranty Intelligence → Value Agents
     ↓              ↓                    ↓                      ↓                ↓
Retailer API → Duplicate Detection → Data Enrichment → Warranty Research → Cash/Claims
     ↓              ↓                    ↓                      ↓                ↓
Bank Integration → Product Validation → Market Data → Coverage Analysis → Opportunities
```

### **Trigger Dependencies**:
```
New Product Created → Product Intelligence Agent (SQS)
Product Enriched → Warranty Intelligence Agent (SQS)
Warranty Researched → Cash Extraction Agent (Daily)
Warranty Expiring → Warranty Claim Agent (Daily)
Purchase Detected → Duplicate Detection Agent (6 hours)
```

---

## **🚨 CURRENT ISSUES & SOLUTIONS**

### **Critical Issues**:
1. **Cash Extraction Agent**: Timeout due to processing ALL products
2. **Warranty Intelligence Agent**: Internal server error
3. **Generic Processing**: All agents process ALL users/products

### **Root Cause**:
- **Architecture Problem**: Agents designed for batch processing instead of real-time user actions
- **Performance Problem**: Too much work per agent execution
- **Integration Problem**: Using simulated data instead of real APIs

### **Better Architecture Ideas**:

#### **Option 1: Event-Driven Architecture**
```
User Action → Event → Specific Agent → Response
Example: User clicks "Get Cash" → Cash Quote Event → Quick Cash Agent → Quotes
```

#### **Option 2: User-Specific Processing**
```
Instead of: Process ALL users/products
Do: Process only user's products when they take action
```

#### **Option 3: Micro-Agents**
```
Instead of: One big Cash Extraction Agent
Do: Quick Cash Agent, Market Analysis Agent, Partner Quote Agent
```

#### **Option 4: Real-Time vs Batch**
```
Real-Time: User actions (get cash, check warranty)
Batch: Background monitoring (email, bank, retailer sync)
```

---

## **🎯 RECOMMENDED OPTIMIZATION**

### **Phase 1: Fix Broken Agents**
1. **Fix Cash Extraction Agent**: Process only user's products on demand
2. **Fix Warranty Intelligence Agent**: Debug and fix internal error
3. **Test all agents**: Verify each agent works individually

### **Phase 2: Optimize Architecture**
1. **Separate real-time from batch**: User actions vs background monitoring
2. **Build purpose-specific agents**: Quick Cash, Warranty Lookup, etc.
3. **Use real APIs**: Replace simulated data with real integrations

### **Phase 3: Add Missing Components**
1. **Master Orchestrator**: Coordinate agent activities
2. **Event System**: Trigger agents based on user actions
3. **Caching Layer**: Store results to avoid recalculation

**This decision tree shows we have a solid foundation but need to optimize the architecture for real user needs!**
