#!/usr/bin/env tsx
/**
 * Database Seeder for SOAP STASE ANAK
 * 
 * This script seeds the database with sample data including:
 * - Sample hospitals
 * - Bangsal (wards) for each hospital
 * - Sample patients with realistic names
 * - SOAP entries with plan items
 * 
 * Usage:
 *   npx tsx scripts/seed-db.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { format } from 'date-fns';

// Load environment variables
config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sample data
const HOSPITALS = [
  'RSUP Dr. Sardjito Yogyakarta',
  'RS Dr. Moewardi Solo',
  'RSUP Dr. Kariadi Semarang'
];

const BANGSAL_BY_HOSPITAL = [
  ['Anak A', 'Anak B', 'NICU', 'PICU'],
  ['Dahlia Anak', 'Mawar Anak', 'Perinatologi', 'ICU Anak'],
  ['Melati 1', 'Melati 2', 'Intensive Care', 'Perinatologi']
];

const PATIENT_NAMES = [
  'Bintang Putra Ramadhan',
  'Anisa Putri Sari',
  'Muhammad Farid',
  'Siti Nurhaliza',
  'Ahmad Rizki',
  'Dewi Lestari',
  'Bayu Setiawan',
  'Maya Indira',
  'Yoga Pratama',
  'Rina Sari'
];

const ROOM_NUMBERS = ['101', '102', '103', '201', '202', '203', 'A-1', 'A-2', 'B-1', 'B-2'];

const SAMPLE_MEDICATIONS = [
  { drug: 'Paracetamol', dose: '250mg', route: 'PO', freq: 'q6h' },
  { drug: 'Amoxicillin', dose: '500mg', route: 'PO', freq: 'q8h' },
  { drug: 'Cefotaxime', dose: '1g', route: 'IV', freq: 'q8h' },
  { drug: 'Furosemide', dose: '20mg', route: 'IV', freq: 'q12h' },
  { drug: 'Ondansetron', dose: '4mg', route: 'IV', freq: 'q8h PRN' },
  { drug: 'Ranitidine', dose: '150mg', route: 'PO', freq: 'q12h' }
];

async function getOrCreateTestUser() {
  // Try to find existing test user
  const { data: existingUsers, error: fetchError } = await supabase
    .from('app_user')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    throw fetchError;
  }

  if (existingUsers && existingUsers.length > 0) {
    console.log('ℹ️  Using existing user:', existingUsers[0].id);
    return existingUsers[0].id;
  }

  // Create test user if none exists
  console.log('ℹ️  Creating test user...');
  const testUserId = 'test-user-' + Math.random().toString(36).substr(2, 9);
  
  const { data: newUser, error: createError } = await supabase
    .from('app_user')
    .insert({ id: testUserId })
    .select()
    .single();

  if (createError) {
    console.error('Error creating test user:', createError);
    throw createError;
  }

  console.log('✅ Created test user:', newUser.id);
  return newUser.id;
}

async function seedHospitals(userId: string) {
  console.log('🏥 Seeding hospitals...');
  
  const hospitals = [];
  for (const hospitalName of HOSPITALS) {
    const { data: hospital, error } = await supabase
      .from('hospital')
      .insert({
        owner_id: userId,
        name: hospitalName
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.log(`⚠️  Hospital "${hospitalName}" already exists, skipping...`);
        const { data: existing } = await supabase
          .from('hospital')
          .select('*')
          .eq('owner_id', userId)
          .eq('name', hospitalName)
          .single();
        if (existing) hospitals.push(existing);
      } else {
        console.error('Error creating hospital:', error);
        throw error;
      }
    } else {
      console.log(`✅ Created hospital: ${hospital.name}`);
      hospitals.push(hospital);
    }
  }

  return hospitals;
}

async function seedBangsal(hospitals: any[]) {
  console.log('🏨 Seeding bangsal...');
  
  const allBangsal = [];
  for (let i = 0; i < hospitals.length; i++) {
    const hospital = hospitals[i];
    const bangsalNames = BANGSAL_BY_HOSPITAL[i];

    for (const bangsalName of bangsalNames) {
      const { data: bangsal, error } = await supabase
        .from('bangsal')
        .insert({
          hospital_id: hospital.id,
          name: bangsalName
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`⚠️  Bangsal "${bangsalName}" already exists in ${hospital.name}, skipping...`);
          const { data: existing } = await supabase
            .from('bangsal')
            .select('*')
            .eq('hospital_id', hospital.id)
            .eq('name', bangsalName)
            .single();
          if (existing) allBangsal.push({ ...existing, hospital });
        } else {
          console.error('Error creating bangsal:', error);
          throw error;
        }
      } else {
        console.log(`✅ Created bangsal: ${bangsalName} in ${hospital.name}`);
        allBangsal.push({ ...bangsal, hospital });
      }
    }
  }

  return allBangsal;
}

async function seedPatients(userId: string, allBangsal: any[]) {
  console.log('👶 Seeding patients...');
  
  const patients = [];
  for (let i = 0; i < PATIENT_NAMES.length; i++) {
    const patientName = PATIENT_NAMES[i];
    const bangsal = allBangsal[i % allBangsal.length];
    const roomNumber = ROOM_NUMBERS[i % ROOM_NUMBERS.length];
    const mrn = `MRN${String(i + 1).padStart(4, '0')}`;

    const { data: patient, error } = await supabase
      .from('patient')
      .insert({
        owner_id: userId,
        hospital_id: bangsal.hospital_id,
        bangsal_id: bangsal.id,
        room_number: roomNumber,
        full_name: patientName,
        mrn: mrn
      })
      .select(`
        *,
        hospital(name),
        bangsal(name)
      `)
      .single();

    if (error) {
      console.error(`Error creating patient ${patientName}:`, error);
      // Continue with other patients
    } else {
      console.log(`✅ Created patient: ${patient.full_name} in ${patient.hospital?.name} - ${patient.bangsal?.name} Room ${patient.room_number}`);
      patients.push(patient);
    }
  }

  return patients;
}

function generatePlanItems() {
  const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
  const planItems = [];
  
  for (let i = 0; i < numItems; i++) {
    const med = SAMPLE_MEDICATIONS[Math.floor(Math.random() * SAMPLE_MEDICATIONS.length)];
    const days = Math.floor(Math.random() * 5) + 1; // 1-5 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 3)); // 0-2 days ago
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);
    
    const today = new Date();
    const status = endDate >= today ? 'active' : 'done';
    
    planItems.push({
      drug: med.drug,
      dose: med.dose,
      route: med.route,
      freq: med.freq,
      days: days,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      status: status
    });
  }
  
  return planItems;
}

async function seedSOAP(patients: any[]) {
  console.log('📋 Seeding SOAP entries...');
  
  const soapTemplates = [
    {
      s: 'Pasien mengeluh demam sejak 2 hari yang lalu, disertai batuk dan pilek. Nafsu makan menurun.',
      o: 'KU: tampak sakit sedang, kesadaran CM. TD: 100/60, Nadi: 100x/menit, RR: 24x/menit, Suhu: 38.5°C. Pemeriksaan thoraks: ronkhi basah halus kedua paru.',
      a: 'Pneumonia komunitas pada anak'
    },
    {
      s: 'Orang tua pasien mengeluh anak rewel, tidak mau makan, dan BAB cair 5x sejak kemarin.',
      o: 'KU: tampak sakit ringan, kesadaran CM. TD: 90/50, Nadi: 110x/menit, RR: 28x/menit, Suhu: 37.8°C. Abdomen: bising usus meningkat, tidak ada nyeri tekan.',
      a: 'Gastroenteritis akut'
    },
    {
      s: 'Pasien mengeluh sesak nafas yang semakin memberat, terutama saat beraktivitas.',
      o: 'KU: tampak sakit sedang, kesadaran CM. TD: 110/70, Nadi: 120x/menit, RR: 32x/menit, Suhu: 36.8°C. Pemeriksaan jantung: murmur sistolik grade III/VI.',
      a: 'Penyakit jantung kongenital - VSD'
    }
  ];

  for (const patient of patients) {
    const template = soapTemplates[Math.floor(Math.random() * soapTemplates.length)];
    const planItems = generatePlanItems();

    const { data: soap, error } = await supabase
      .from('soap')
      .insert({
        patient_id: patient.id,
        s: template.s,
        o: template.o,
        a: template.a,
        p: planItems
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating SOAP for ${patient.full_name}:`, error);
    } else {
      console.log(`✅ Created SOAP for ${patient.full_name} with ${planItems.length} plan items`);
    }
  }
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Get or create test user
    const userId = await getOrCreateTestUser();
    
    // Seed hospitals
    const hospitals = await seedHospitals(userId);
    
    // Seed bangsal
    const allBangsal = await seedBangsal(hospitals);
    
    // Seed patients
    const patients = await seedPatients(userId, allBangsal);
    
    // Seed SOAP entries
    await seedSOAP(patients);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👤 User ID: ${userId}`);
    console.log(`   🏥 Hospitals: ${hospitals.length}`);
    console.log(`   🏨 Bangsal: ${allBangsal.length}`);
    console.log(`   👶 Patients: ${patients.length}`);
    console.log(`   📋 SOAP entries: ${patients.length}`);
    
    console.log('\n💡 You can now use these endpoints to test the API:');
    console.log('   GET /api/hospitals');
    console.log('   GET /api/patients?search=Bintang');
    console.log('   GET /api/patients?search=Anisa');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeder
main();