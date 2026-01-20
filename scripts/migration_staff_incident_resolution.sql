-- Staff Dashboard Enhancement - Database Migration
-- Date: 2024-01-20
-- Description: Add incident resolution tracking and audit fields

-- Step 1: Add new columns to incidents table
ALTER TABLE incidents 
ADD COLUMN resolved_by_staff_id UUID,
ADD COLUMN resolution_notes TEXT,
ADD COLUMN resolution_type VARCHAR(50),
ADD COLUMN resolved_at TIMESTAMP;

-- Step 2: Add foreign key constraint for resolved_by_staff_id
ALTER TABLE incidents 
ADD CONSTRAINT fk_incidents_resolved_by_staff_id 
FOREIGN KEY (resolved_by_staff_id) 
REFERENCES staff(id) ON DELETE SET NULL;

-- Step 3: Create indexes for performance
CREATE INDEX idx_incidents_resolved_at ON incidents(resolved_at DESC);
CREATE INDEX idx_incidents_resolved_by ON incidents(resolved_by_staff_id);
CREATE INDEX idx_incidents_status_resolved ON incidents(status, resolved_at DESC);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN incidents.resolution_notes IS 'Notes explaining how the incident was resolved';
COMMENT ON COLUMN incidents.resolution_type IS 'Type of resolution: FIXED, ESCALATED, DEFERRED';
COMMENT ON COLUMN incidents.resolved_at IS 'Timestamp when incident was marked as resolved';
COMMENT ON COLUMN incidents.resolved_by_staff_id IS 'ID of staff member who resolved the incident';

-- Step 5: Verify migration
-- Run this query to verify the new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'incidents' 
AND column_name IN ('resolved_by_staff_id', 'resolution_notes', 'resolution_type', 'resolved_at');
