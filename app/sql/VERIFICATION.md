# Database Migration Verification Guide

This document provides step-by-step verification for the SOAP Manager database migrations.

## Prerequisites

1. Supabase project configured
2. Supabase CLI installed: `npm install -g @supabase/cli`
3. Database connection working

## Step 1: Apply Migrations

```bash
# Method 1: Using Makefile (recommended)
make db-reset

# Method 2: Using Supabase CLI directly
supabase db reset
```

Expected output should show:
- Extension `pg_trgm` enabled
- 4 tables created (hospital, bangsal, patient, soap)
- Multiple indexes created
- RLS policies applied
- Seed data inserted

## Step 2: Verify Schema

Run the test queries in `app/sql/test_migrations.sql`:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected result:** All tables should have `rowsecurity = true`

```sql
-- Check pg_trgm extension
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
```

**Expected result:** One row showing pg_trgm extension is installed

## Step 3: Verify Indexes

```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected indexes:**
- `idx_hospital_app_user`, `idx_hospital_created_at`
- `idx_bangsal_hospital_id`, `idx_bangsal_app_user`, `idx_bangsal_created_at`
- `idx_patient_bangsal_id`, `idx_patient_app_user`, `idx_patient_created_at`, `idx_patient_full_name_gin`, `idx_patient_medical_record_number`
- `idx_soap_patient_id`, `idx_soap_app_user`, `idx_soap_patient_created_at`

## Step 4: Test Seed Data

```sql
-- Count records per table
SELECT 'hospital' as table_name, count(*) FROM hospital
UNION ALL SELECT 'bangsal', count(*) FROM bangsal
UNION ALL SELECT 'patient', count(*) FROM patient  
UNION ALL SELECT 'soap', count(*) FROM soap;
```

**Expected counts (for test user):**
- hospital: 2
- bangsal: 3
- patient: 5
- soap: 3

## Step 5: Test Fuzzy Search

```sql
-- Test fuzzy search on patient names
SELECT 
    full_name,
    similarity(full_name, 'bintang') as score
FROM patient 
WHERE full_name % 'bintang'
ORDER BY score DESC;
```

**Expected ranking (highest score first):**
1. "Bintang" (exact match, score ~1.0)
2. "Bintang Putra" (high similarity)
3. "Ahmad Bintang" (contains word)

## Step 6: Test Row Level Security

### A. Verify Current User
```sql
SELECT auth.uid();
```
Should return your user UUID.

### B. Test Owner Access
As the owner user, this should return data:
```sql
SELECT full_name FROM patient LIMIT 3;
```

### C. Test Cross-User Protection

**Method 1: Using SQL (if you have admin access)**
```sql
-- Switch to a different user context
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000000"}';

-- This should return 0 rows
SELECT count(*) FROM patient;

-- Reset to original user
RESET request.jwt.claims;
```

**Method 2: Using different Supabase client**
- Create a second user account
- Connect with that user's session
- Query should return no data

## Step 7: Test Referential Integrity

```sql
-- Test joins work correctly with RLS
SELECT 
    h.name as hospital,
    b.name as bangsal,
    p.full_name as patient
FROM hospital h
JOIN bangsal b ON h.id = b.hospital_id
JOIN patient p ON b.id = p.bangsal_id
LIMIT 5;
```

Should return joined data only for your user's records.

## Step 8: Performance Testing

```sql
-- Test index usage on fuzzy search
EXPLAIN (ANALYZE, BUFFERS) 
SELECT full_name 
FROM patient 
WHERE full_name % 'bintang';
```

Should show GIN index usage.

```sql  
-- Test compound index usage
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM soap 
WHERE patient_id = (SELECT id FROM patient LIMIT 1)
ORDER BY created_at DESC;
```

Should use the compound index on `(patient_id, created_at)`.

## Troubleshooting

### Issue: RLS Returns No Data
- **Check user context:** `SELECT auth.uid()`
- **Verify user exists:** Check `auth.users` table
- **Check seed data:** Ensure `app_user` column matches your user ID

### Issue: Fuzzy Search Not Working
- **Check extension:** `SELECT * FROM pg_extension WHERE extname = 'pg_trgm'`
- **Check index:** Look for `idx_patient_full_name_gin` in `pg_indexes`
- **Test similarity:** `SELECT similarity('bintang', 'bintang putra')`

### Issue: Poor Query Performance
- **Check indexes:** Use `EXPLAIN ANALYZE` on slow queries
- **Verify index usage:** Look for "Index Scan" vs "Seq Scan"
- **Check statistics:** Run `ANALYZE` if needed

### Issue: Migration Errors
- **Foreign key violations:** Check data order in seed file
- **Permission errors:** Ensure proper grants in RLS file
- **Syntax errors:** Validate SQL in each migration file

## Success Criteria

✅ **Schema Applied Successfully:**
- All tables created with correct columns
- All indexes present and functional
- Triggers working (updated_at auto-updates)

✅ **RLS Working Correctly:**
- Users can only see their own data
- Cross-user queries return no results
- Policies enforce both read and write restrictions

✅ **Fuzzy Search Functional:**
- pg_trgm extension loaded
- GIN index on patient names
- Similarity scoring works correctly
- Query performance is acceptable

✅ **Seed Data Present:**
- Test hospitals, bangsal, and patients created
- SOAP records linked correctly
- All records associated with test user

## Next Steps

After verification passes:
1. Document any performance tuning needed
2. Consider additional indexes for your query patterns
3. Plan for production data migration
4. Set up monitoring for query performance