# 🔒 **RLS POLICY APPLICATION GUIDE**

## **📅 Created: December 2024**

---

## **🎯 PURPOSE**

This guide provides step-by-step instructions for manually applying Row-Level Security (RLS) policies in the Supabase Dashboard to complete the security fix implementation.

---

## **⚠️ PREREQUISITES**

Before applying RLS policies, ensure you have:
- ✅ Access to Supabase Dashboard
- ✅ Admin privileges for the database
- ✅ The `database_agent_rls_policies.sql` file ready

---

## **🚀 STEP-BY-STEP INSTRUCTIONS**

### **Step 1: Access Supabase Dashboard**

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in with your account
3. Select your Claimso project
4. Navigate to **SQL Editor** in the left sidebar

### **Step 2: Prepare the SQL File**

1. Open the `database_agent_rls_policies.sql` file in your project
2. Copy the entire contents of the file
3. The file contains 36 SQL statements that need to be executed

### **Step 3: Execute SQL Statements**

#### **Option A: Execute All at Once (Recommended)**
1. In the SQL Editor, paste the entire contents of `database_agent_rls_policies.sql`
2. Click **Run** to execute all statements
3. Check the results for any errors

#### **Option B: Execute in Batches (If Option A Fails)**
If executing all at once fails, try executing in these batches:

**Batch 1: Database Functions**
```sql
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
```

**Batch 2: Products Table Policies**
```sql
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Agents can read products
CREATE POLICY "Agents can read products" ON products
FOR SELECT
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('read:products')
);

-- Agents can insert products
CREATE POLICY "Agents can insert products" ON products
FOR INSERT
TO authenticated
WITH CHECK (
  is_authenticated_agent() AND 
  agent_has_permission('create:products')
);

-- Agents can update products
CREATE POLICY "Agents can update products" ON products
FOR UPDATE
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('update:products')
);
```

**Batch 3: Warranties Table Policies**
```sql
-- Enable RLS on warranties table
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;

-- Agents can read warranties
CREATE POLICY "Agents can read warranties" ON warranties
FOR SELECT
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('read:warranties')
);

-- Agents can insert warranties
CREATE POLICY "Agents can insert warranties" ON warranties
FOR INSERT
TO authenticated
WITH CHECK (
  is_authenticated_agent() AND 
  agent_has_permission('create:warranties')
);

-- Agents can update warranties
CREATE POLICY "Agents can update warranties" ON warranties
FOR UPDATE
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('update:warranties')
);
```

**Batch 4: User Connections Table Policies**
```sql
-- Enable RLS on user_connections table
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Agents can read user connections
CREATE POLICY "Agents can read user connections" ON user_connections
FOR SELECT
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('read:user_connections')
);

-- Agents can insert user connections
CREATE POLICY "Agents can insert user connections" ON user_connections
FOR INSERT
TO authenticated
WITH CHECK (
  is_authenticated_agent() AND 
  agent_has_permission('create:user_connections')
);

-- Agents can update user connections
CREATE POLICY "Agents can update user connections" ON user_connections
FOR UPDATE
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('update:user_connections')
);
```

**Batch 5: Documents Table Policies**
```sql
-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Agents can read documents
CREATE POLICY "Agents can read documents" ON documents
FOR SELECT
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('read:documents')
);

-- Agents can insert documents
CREATE POLICY "Agents can insert documents" ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  is_authenticated_agent() AND 
  agent_has_permission('create:documents')
);

-- Agents can update documents
CREATE POLICY "Agents can update documents" ON documents
FOR UPDATE
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('update:documents')
);
```

**Batch 6: Maintenance Records Table Policies**
```sql
-- Enable RLS on maintenance_records table
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Agents can read maintenance records
CREATE POLICY "Agents can read maintenance records" ON maintenance_records
FOR SELECT
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('read:maintenance')
);

-- Agents can insert maintenance records
CREATE POLICY "Agents can insert maintenance records" ON maintenance_records
FOR INSERT
TO authenticated
WITH CHECK (
  is_authenticated_agent() AND 
  agent_has_permission('create:maintenance')
);

-- Agents can update maintenance records
CREATE POLICY "Agents can update maintenance records" ON maintenance_records
FOR UPDATE
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('update:maintenance')
);
```

**Batch 7: Claims and Other Tables**
```sql
-- Enable RLS on claims table
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Agents can read claims
CREATE POLICY "Agents can read claims" ON claims
FOR SELECT
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('read:claims')
);

-- Enable RLS on quote_requests table
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Agents can read quote requests
CREATE POLICY "Agents can read quote requests" ON quote_requests
FOR SELECT
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('read:quote_requests')
);

-- Enable RLS on cart_items table
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Agents can read cart items
CREATE POLICY "Agents can read cart items" ON cart_items
FOR SELECT
TO authenticated
USING (
  is_authenticated_agent() AND 
  agent_has_permission('read:cart_items')
);
```

### **Step 4: Verify Policy Application**

After executing the SQL statements, verify the policies were created:

1. Go to **Authentication** → **Policies** in the Supabase Dashboard
2. Check that RLS is enabled on all tables
3. Verify that the policies are listed for each table

### **Step 5: Test the Policies**

Run the security test script to verify everything is working:

```bash
node scripts/test-security-fix.js
```

---

## **🔍 TROUBLESHOOTING**

### **Common Issues:**

**Issue: "Function already exists"**
- **Solution:** This is normal. The `CREATE OR REPLACE FUNCTION` statements will update existing functions.

**Issue: "Policy already exists"**
- **Solution:** Drop the existing policy first:
  ```sql
  DROP POLICY IF EXISTS "Policy Name" ON table_name;
  ```

**Issue: "Permission denied"**
- **Solution:** Ensure you have admin privileges in the Supabase project.

**Issue: "Table does not exist"**
- **Solution:** Check that all required tables exist. Run the database schema check:
  ```bash
  node scripts/test-database.js
  ```

### **Verification Commands:**

Check if functions were created:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_agent_identity', 'is_authenticated_agent', 'agent_has_permission', 'get_agent_user_id');
```

Check if policies were created:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## **✅ SUCCESS INDICATORS**

After successful application, you should see:

1. **Functions Created:**
   - `get_agent_identity()`
   - `is_authenticated_agent()`
   - `agent_has_permission()`
   - `get_agent_user_id()`

2. **Policies Applied:**
   - All major tables have RLS enabled
   - Agent-specific policies are created
   - Permission-based access control is active

3. **Security Test Passes:**
   - JWT token generation works
   - Database access is properly restricted
   - Agent authentication functions correctly

---

## **🚨 IMPORTANT NOTES**

- **Backup First:** Consider backing up your database before applying these changes
- **Test Environment:** If possible, test these changes in a development environment first
- **Monitor Logs:** Watch the Supabase logs for any errors after applying policies
- **Rollback Plan:** Keep the original SQL file for rollback if needed

---

## **📞 SUPPORT**

If you encounter issues:
1. Check the Supabase documentation on RLS policies
2. Review the error messages in the SQL Editor
3. Test with the security test script
4. Check the Supabase logs for detailed error information

---

**🎯 Once these RLS policies are applied, the security fix will be complete and the system will be properly secured with JWT-based authentication and permission-based access control.**
