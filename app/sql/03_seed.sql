-- 03_seed.sql: Seed data for SOAP Manager
-- Creates test owner user, hospitals, bangsal, and patients for testing

-- Note: This assumes we have a test user with a known UUID
-- In production, replace with actual user UUIDs from auth.users
DO $$
DECLARE
    owner_user_id UUID := '550e8400-e29b-41d4-a716-446655440000'; -- Example test UUID
    hospital1_id UUID;
    hospital2_id UUID;
    bangsal1_id UUID;
    bangsal2_id UUID;
    bangsal3_id UUID;
    patient1_id UUID;
    patient2_id UUID;
    patient3_id UUID;
BEGIN
    -- Insert test user into auth.users if it doesn't exist
    -- This is a mock user for testing purposes
    INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, confirmed_at)
    VALUES (
        owner_user_id,
        'test-owner@example.com',
        NOW(),
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert hospitals
    INSERT INTO hospital (id, name, address, phone, email, app_user) VALUES
        (gen_random_uuid(), 'RS Umum Jakarta', 'Jl. Sudirman No. 123, Jakarta', '021-12345678', 'info@rsjkt.com', owner_user_id),
        (gen_random_uuid(), 'RS Bintang Medika', 'Jl. Gatot Subroto No. 456, Jakarta', '021-87654321', 'info@bintangmedika.com', owner_user_id)
    RETURNING id INTO hospital1_id, hospital2_id;

    -- Get the hospital IDs for bangsal insertion
    SELECT id INTO hospital1_id FROM hospital WHERE name = 'RS Umum Jakarta' AND app_user = owner_user_id;
    SELECT id INTO hospital2_id FROM hospital WHERE name = 'RS Bintang Medika' AND app_user = owner_user_id;

    -- Insert bangsal (wards)
    INSERT INTO bangsal (id, hospital_id, name, capacity, app_user) VALUES
        (gen_random_uuid(), hospital1_id, 'Bangsal Dahlia', 20, owner_user_id),
        (gen_random_uuid(), hospital1_id, 'Bangsal Melati', 15, owner_user_id),
        (gen_random_uuid(), hospital2_id, 'Bangsal Anggrek', 25, owner_user_id)
    RETURNING id INTO bangsal1_id, bangsal2_id, bangsal3_id;

    -- Get bangsal IDs for patient insertion
    SELECT id INTO bangsal1_id FROM bangsal WHERE name = 'Bangsal Dahlia' AND app_user = owner_user_id LIMIT 1;
    SELECT id INTO bangsal2_id FROM bangsal WHERE name = 'Bangsal Melati' AND app_user = owner_user_id LIMIT 1;
    SELECT id INTO bangsal3_id FROM bangsal WHERE name = 'Bangsal Anggrek' AND app_user = owner_user_id LIMIT 1;

    -- Insert patients with names for fuzzy search testing
    INSERT INTO patient (id, full_name, date_of_birth, gender, address, phone, medical_record_number, bangsal_id, app_user) VALUES
        (gen_random_uuid(), 'Bintang', '1990-05-15', 'male', 'Jl. Merdeka No. 100, Jakarta', '0812-3456-7890', 'MR001', bangsal1_id, owner_user_id),
        (gen_random_uuid(), 'Bintang Putra', '1985-03-22', 'male', 'Jl. Ahmad Yani No. 200, Jakarta', '0813-4567-8901', 'MR002', bangsal2_id, owner_user_id),
        (gen_random_uuid(), 'Nisa', '1992-07-08', 'female', 'Jl. Thamrin No. 300, Jakarta', '0814-5678-9012', 'MR003', bangsal3_id, owner_user_id),
        (gen_random_uuid(), 'Ahmad Bintang', '1988-12-01', 'male', 'Jl. Sudirman No. 400, Jakarta', '0815-6789-0123', 'MR004', bangsal1_id, owner_user_id),
        (gen_random_uuid(), 'Sari Melati', '1995-09-18', 'female', 'Jl. Gatot Subroto No. 500, Jakarta', '0816-7890-1234', 'MR005', bangsal2_id, owner_user_id)
    RETURNING id INTO patient1_id, patient2_id, patient3_id;

    -- Get patient IDs for SOAP insertion
    SELECT id INTO patient1_id FROM patient WHERE full_name = 'Bintang' AND app_user = owner_user_id LIMIT 1;
    SELECT id INTO patient2_id FROM patient WHERE full_name = 'Bintang Putra' AND app_user = owner_user_id LIMIT 1;
    SELECT id INTO patient3_id FROM patient WHERE full_name = 'Nisa' AND app_user = owner_user_id LIMIT 1;

    -- Insert sample SOAP records
    INSERT INTO soap (patient_id, subjective, objective, assessment, plan, app_user) VALUES
        (patient1_id, 
         'Pasien mengeluhkan nyeri kepala sejak 2 hari yang lalu, disertai mual dan muntah.',
         'TD: 140/90 mmHg, Nadi: 88 x/menit, Suhu: 37.2°C, RR: 20 x/menit. Kepala: nyeri tekan pada temporal.',
         'Tension headache dengan kemungkinan hipertensi grade 1.',
         'Berikan analgesik, pantau tekanan darah, edukasi gaya hidup sehat.',
         owner_user_id),
        
        (patient2_id,
         'Pasien datang dengan keluhan batuk kering sejak 1 minggu, tidak ada demam.',
         'TD: 120/80 mmHg, Nadi: 76 x/menit, Suhu: 36.8°C, RR: 18 x/menit. Paru: ronki (-), whezing (-).',
         'Upper respiratory tract infection (URTI).',
         'Berikan antitusif, perbanyak minum air putih, istirahat yang cukup.',
         owner_user_id),
        
        (patient3_id,
         'Pasien mengeluhkan nyeri perut bagian bawah, disertai diare 3x sehari.',
         'TD: 110/70 mmHg, Nadi: 82 x/menit, Suhu: 37.0°C, RR: 20 x/menit. Abdomen: nyeri tekan suprapubik.',
         'Gastroenteritis akut.',
         'Berikan oralit, probiotik, diet BRAT, observasi dehidrasi.',
         owner_user_id);

    -- Log successful seed completion
    RAISE NOTICE 'Seed data inserted successfully for user: %', owner_user_id;
END $$;