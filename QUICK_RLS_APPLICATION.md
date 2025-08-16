# 🚀 **QUICK RLS POLICY APPLICATION**

## **📅 Created: December 2024**

---

## **🎯 5-Minute RLS Policy Application**

### **Step 1: Open Supabase Dashboard**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in and select your Claimso project
3. Click **SQL Editor** in the left sidebar

### **Step 2: Copy and Paste the SQL**
Copy the entire SQL below and paste it into the SQL Editor:

```sql
-- ==============================================================================
-- AGENT AUTHENTICATION RLS POLICIES
-- ==============================================================================

-- Function to extract agent information from JWT token
CREATE OR REPLACE FUNCTION get_agent_identity()
RETURNS JSON AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json,
    '{}'::json
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is an authenticated agent
CREATE OR REPLACE FUNCTION is_authenticated_agent()
RETURNS BOOLEAN AS $$
DECLARE
  agent_claims JSON;
BEGIN
  agent_claims := get_agent_identity();
  RETURN (
    agent_claims ? 'agentId' AND 
    agent_claims ? 'agentType' AND 
    agent_claims ? 'permissions'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if agent has specific permission
CREATE OR REPLACE FUNCTION agent_has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  agent_claims JSON;
  permissions JSON;
  permission TEXT;
BEGIN
  agent_claims := get_agent_identity();
  permissions := agent_claims->'permissions';
  
  FOR permission IN SELECT json_array_elements_text(permissions)
  LOOP
    IF permission = required_permission THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get agent's user context (if any)
CREATE OR REPLACE FUNCTION get_agent_user_id()
RETURNS UUID AS $$
DECLARE
  agent_claims JSON;
BEGIN
  agent_claims := get_agent_identity();
  RETURN (agent_claims->>'userId')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- PRODUCTS TABLE POLICIES
-- ==============================================================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Agents with read:products permission can read products
DROP POLICY IF EXISTS "Agents can read products" ON products;
CREATE POLICY "Agents can read products" ON products
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('read:products')
  );

-- Policy: Agents with write:products permission can insert products
DROP POLICY IF EXISTS "Agents can insert products" ON products;
CREATE POLICY "Agents can insert products" ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_authenticated_agent() AND 
    agent_has_permission('write:products')
  );

-- Policy: Agents with write:products permission can update products
DROP POLICY IF EXISTS "Agents can update products" ON products;
CREATE POLICY "Agents can update products" ON products
  FOR UPDATE
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('write:products')
  )
  WITH CHECK (
    is_authenticated_agent() AND 
    agent_has_permission('write:products')
  );

-- ==============================================================================
-- WARRANTIES TABLE POLICIES
-- ==============================================================================

-- Enable RLS on warranties table
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;

-- Policy: Agents with read:warranties permission can read warranties
DROP POLICY IF EXISTS "Agents can read warranties" ON warranties;
CREATE POLICY "Agents can read warranties" ON warranties
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('read:warranties')
  );

-- Policy: Agents with write:warranties permission can insert warranties
DROP POLICY IF EXISTS "Agents can insert warranties" ON warranties;
CREATE POLICY "Agents can insert warranties" ON warranties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_authenticated_agent() AND 
    agent_has_permission('write:warranties')
  );

-- Policy: Agents with write:warranties permission can update warranties
DROP POLICY IF EXISTS "Agents can update warranties" ON warranties;
CREATE POLICY "Agents can update warranties" ON warranties
  FOR UPDATE
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('write:warranties')
  )
  WITH CHECK (
    is_authenticated_agent() AND 
    agent_has_permission('write:warranties')
  );

-- ==============================================================================
-- USER_CONNECTIONS TABLE POLICIES
-- ==============================================================================

-- Enable RLS on user_connections table
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Agents with read:user_connections permission can read user connections
DROP POLICY IF EXISTS "Agents can read user connections" ON user_connections;
CREATE POLICY "Agents can read user connections" ON user_connections
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('read:user_connections')
  );

-- Policy: Agents with write:user_connections permission can insert user connections
DROP POLICY IF EXISTS "Agents can insert user connections" ON user_connections;
CREATE POLICY "Agents can insert user connections" ON user_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_authenticated_agent() AND 
    agent_has_permission('write:user_connections')
  );

-- Policy: Agents with write:user_connections permission can update user connections
DROP POLICY IF EXISTS "Agents can update user connections" ON user_connections;
CREATE POLICY "Agents can update user connections" ON user_connections
  FOR UPDATE
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('write:user_connections')
  )
  WITH CHECK (
    is_authenticated_agent() AND 
    agent_has_permission('write:user_connections')
  );

-- ==============================================================================
-- DOCUMENTS TABLE POLICIES
-- ==============================================================================

-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Agents with read:documents permission can read documents
DROP POLICY IF EXISTS "Agents can read documents" ON documents;
CREATE POLICY "Agents can read documents" ON documents
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('read:documents')
  );

-- Policy: Agents with write:documents permission can insert documents
DROP POLICY IF EXISTS "Agents can insert documents" ON documents;
CREATE POLICY "Agents can insert documents" ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_authenticated_agent() AND 
    agent_has_permission('write:documents')
  );

-- Policy: Agents with write:documents permission can update documents
DROP POLICY IF EXISTS "Agents can update documents" ON documents;
CREATE POLICY "Agents can update documents" ON documents
  FOR UPDATE
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('write:documents')
  )
  WITH CHECK (
    is_authenticated_agent() AND 
    agent_has_permission('write:documents')
  );

-- ==============================================================================
-- MAINTENANCE_RECORDS TABLE POLICIES
-- ==============================================================================

-- Enable RLS on maintenance_records table
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Policy: Agents with read:maintenance permission can read maintenance records
DROP POLICY IF EXISTS "Agents can read maintenance records" ON maintenance_records;
CREATE POLICY "Agents can read maintenance records" ON maintenance_records
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('read:maintenance')
  );

-- Policy: Agents with write:maintenance permission can insert maintenance records
DROP POLICY IF EXISTS "Agents can insert maintenance records" ON maintenance_records;
CREATE POLICY "Agents can insert maintenance records" ON maintenance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_authenticated_agent() AND 
    agent_has_permission('write:maintenance')
  );

-- Policy: Agents with write:maintenance permission can update maintenance records
DROP POLICY IF EXISTS "Agents can update maintenance records" ON maintenance_records;
CREATE POLICY "Agents can update maintenance records" ON maintenance_records
  FOR UPDATE
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('write:maintenance')
  )
  WITH CHECK (
    is_authenticated_agent() AND 
    agent_has_permission('write:maintenance')
  );

-- ==============================================================================
-- ADDITIONAL TABLES POLICIES
-- ==============================================================================

-- Claims table policies
DROP POLICY IF EXISTS "Agents can read claims" ON claims;
CREATE POLICY "Agents can read claims" ON claims
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('read:products')
  );

-- Quote requests table policies
DROP POLICY IF EXISTS "Agents can read quote requests" ON quote_requests;
CREATE POLICY "Agents can read quote requests" ON quote_requests
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('read:products')
  );

-- Cart items table policies
DROP POLICY IF EXISTS "Agents can read cart items" ON cart_items;
CREATE POLICY "Agents can read cart items" ON cart_items
  FOR SELECT
  TO authenticated
  USING (
    is_authenticated_agent() AND 
    agent_has_permission('read:products')
  );
```

### **Step 3: Execute the SQL**
1. Click the **Run** button in the SQL Editor
2. Wait for the execution to complete
3. Check for any error messages

### **Step 4: Verify Success**
Run this verification query in the SQL Editor:

```sql
-- Check if policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('products', 'warranties', 'user_connections', 'documents', 'maintenance_records', 'claims', 'quote_requests', 'cart_items')
ORDER BY tablename, policyname;
```

### **Step 5: Test the Security Fix**
Run this command in your terminal:

```bash
node scripts/test-security-fix.js
```

---

## **✅ Success Indicators**

After successful application, you should see:
- ✅ No error messages in SQL Editor
- ✅ Verification query returns policy names
- ✅ Security test script shows "RLS policies: Applied"
- ✅ Database access properly restricted

---

## **🚨 If You Get Errors**

**Common Issues:**
1. **"Table does not exist"** - Some tables may not exist yet (this is normal)
2. **"Policy already exists"** - The DROP POLICY statements will handle this
3. **"Permission denied"** - Ensure you have admin access to the project

**Solution:** The SQL includes `DROP POLICY IF EXISTS` statements, so it's safe to run multiple times.

---

**🎯 This will complete the security fix and enable JWT-based agent authentication with proper database access controls.**
