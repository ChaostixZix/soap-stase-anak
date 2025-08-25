-- Test queries for RLS and fuzzy search validation
-- Run these after applying migrations to verify everything works

-- 1. Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Check if pg_trgm extension is installed
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';

-- 3. Verify indexes are created
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- 4. Test fuzzy search functionality (after seed data is loaded)
-- This should return patients ordered by similarity to 'bintang'
SELECT 
    full_name,
    similarity(full_name, 'bintang') as score
FROM patient 
WHERE full_name % 'bintang'
ORDER BY score DESC;

-- 5. Test RLS policies
-- Check current user
SELECT auth.uid() as current_user;

-- Count records (should only show user's own data)
SELECT 
    'hospital' as table_name, count(*) as record_count FROM hospital
UNION ALL
SELECT 
    'bangsal' as table_name, count(*) as record_count FROM bangsal  
UNION ALL
SELECT 
    'patient' as table_name, count(*) as record_count FROM patient
UNION ALL
SELECT 
    'soap' as table_name, count(*) as record_count FROM soap;

-- 6. Test cross-reference queries work with RLS
-- This should only return data for the current user
SELECT 
    h.name as hospital_name,
    b.name as bangsal_name,
    count(p.id) as patient_count
FROM hospital h
LEFT JOIN bangsal b ON h.id = b.hospital_id
LEFT JOIN patient p ON b.id = p.bangsal_id
GROUP BY h.id, h.name, b.id, b.name
ORDER BY h.name, b.name;

-- 7. Test SOAP with patient join (RLS should prevent cross-user access)
SELECT 
    p.full_name,
    p.medical_record_number,
    s.assessment,
    s.created_at
FROM patient p
JOIN soap s ON p.id = s.patient_id
ORDER BY s.created_at DESC
LIMIT 5;