-- 02_rls.sql: Row Level Security policies for SOAP Manager
-- Ensures users can only access their own data based on app_user ownership

-- Enable RLS on all tables
ALTER TABLE hospital ENABLE ROW LEVEL SECURITY;
ALTER TABLE bangsal ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap ENABLE ROW LEVEL SECURITY;

-- Hospital RLS policies
-- Users can only see and modify hospitals they own
CREATE POLICY "hospital_owner_policy" ON hospital
    FOR ALL
    USING (app_user = auth.uid())
    WITH CHECK (app_user = auth.uid());

-- Bangsal RLS policies
-- Users can only see and modify bangsal they own
CREATE POLICY "bangsal_owner_policy" ON bangsal
    FOR ALL
    USING (app_user = auth.uid())
    WITH CHECK (app_user = auth.uid());

-- Patient RLS policies
-- Users can only see and modify patients they own
CREATE POLICY "patient_owner_policy" ON patient
    FOR ALL
    USING (app_user = auth.uid())
    WITH CHECK (app_user = auth.uid());

-- SOAP RLS policies
-- Users can only see and modify SOAP records they own
CREATE POLICY "soap_owner_policy" ON soap
    FOR ALL
    USING (app_user = auth.uid())
    WITH CHECK (app_user = auth.uid());

-- Additional policy for SOAP to ensure patients belong to the same user
-- This prevents cross-user access via patient_id reference
CREATE POLICY "soap_patient_owner_policy" ON soap
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patient 
            WHERE patient.id = soap.patient_id 
            AND patient.app_user = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM patient 
            WHERE patient.id = soap.patient_id 
            AND patient.app_user = auth.uid()
        )
    );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;