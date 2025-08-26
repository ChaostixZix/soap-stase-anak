-- 01_schema.sql: PostgreSQL schema for SOAP Manager
-- Tables: Hospital, Bangsal, Patient, SOAP
-- Includes pg_trgm for fuzzy search and performance indexes

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Hospital table
CREATE TABLE hospital (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    app_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bangsal (Ward) table
CREATE TABLE bangsal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospital(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    app_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patient table
CREATE TABLE patient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    address TEXT NOT NULL,
    phone TEXT,
    medical_record_number TEXT NOT NULL,
    bangsal_id UUID NOT NULL REFERENCES bangsal(id) ON DELETE CASCADE,
    app_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SOAP (Subjective, Objective, Assessment, Plan) table
CREATE TABLE soap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    subjective TEXT NOT NULL,
    objective TEXT NOT NULL,
    assessment TEXT NOT NULL,
    plan TEXT NOT NULL,
    app_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
-- Hospital indexes
CREATE INDEX idx_hospital_app_user ON hospital(app_user);
CREATE INDEX idx_hospital_created_at ON hospital(created_at DESC);

-- Bangsal indexes
CREATE INDEX idx_bangsal_hospital_id ON bangsal(hospital_id);
CREATE INDEX idx_bangsal_app_user ON bangsal(app_user);
CREATE INDEX idx_bangsal_created_at ON bangsal(created_at DESC);

-- Patient indexes
CREATE INDEX idx_patient_bangsal_id ON patient(bangsal_id);
CREATE INDEX idx_patient_app_user ON patient(app_user);
CREATE INDEX idx_patient_created_at ON patient(created_at DESC);
-- GIN index for fuzzy search on patient names
CREATE INDEX idx_patient_full_name_gin ON patient USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_patient_medical_record_number ON patient(medical_record_number);

-- SOAP indexes
CREATE INDEX idx_soap_patient_id ON soap(patient_id);
CREATE INDEX idx_soap_app_user ON soap(app_user);
-- Primary index for SOAP queries (patient_id, created_at DESC)
CREATE INDEX idx_soap_patient_created_at ON soap(patient_id, created_at DESC);

-- Triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_hospital_updated_at BEFORE UPDATE ON hospital
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bangsal_updated_at BEFORE UPDATE ON bangsal
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_updated_at BEFORE UPDATE ON patient
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_soap_updated_at BEFORE UPDATE ON soap
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();