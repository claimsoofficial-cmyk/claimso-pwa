# Storage Bucket Setup Guide

## Creating the claim-files Storage Bucket

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `fryifnzncbfeodmuziut`

### Step 2: Navigate to Storage
1. Click on "Storage" in the left sidebar
2. Click "Create a new bucket"

### Step 3: Create the Bucket
- **Name**: `claim-files`
- **Public bucket**: ❌ **No** (Keep private)
- **File size limit**: 50MB (or your preferred limit)
- **Allowed MIME types**: 
  - `image/*` (for photos)
  - `application/pdf` (for documents)
  - `video/*` (for videos)
  - `text/plain` (for text files)

### Step 4: Configure RLS Policies
After creating the bucket, go to "Policies" and add these policies:

#### Policy 1: Users can upload claim files
```sql
CREATE POLICY "Users can upload claim files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'claim-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

#### Policy 2: Users can view their claim files
```sql
CREATE POLICY "Users can view their claim files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'claim-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

#### Policy 3: Users can update their claim files
```sql
CREATE POLICY "Users can update their claim files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'claim-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

#### Policy 4: Users can delete their claim files
```sql
CREATE POLICY "Users can delete their claim files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'claim-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

### Step 5: Test the Setup
The bucket will be used to store:
- Claim documents (receipts, warranty PDFs)
- Photos of damaged products
- Videos of product issues
- Any other files related to warranty claims

## File Structure
Files will be stored with this structure:
```
claim-files/
├── {user_id}/
│   ├── {claim_id}/
│   │   ├── documents/
│   │   ├── photos/
│   │   └── videos/
```

## Usage in Code
```typescript
// Upload a file
const { data, error } = await supabase.storage
  .from('claim-files')
  .upload(`${userId}/${claimId}/documents/${fileName}`, file);

// Download a file
const { data, error } = await supabase.storage
  .from('claim-files')
  .download(`${userId}/${claimId}/documents/${fileName}`);
```
