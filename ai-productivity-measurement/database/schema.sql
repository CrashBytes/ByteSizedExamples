-- AI Productivity Measurement Framework
-- Database Schema v1.0
-- PostgreSQL 13+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- Core Tables
-- ============================================================================

-- AI Interactions: Raw log of every AI tool interaction
CREATE TABLE ai_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id VARCHAR(64) NOT NULL, -- Hashed/anonymized for privacy
    tool_name VARCHAR(100) NOT NULL,
    tool_version VARCHAR(50),
    task_type VARCHAR(100), -- 'code_completion', 'document_generation', etc.
    session_id UUID, -- Groups related interactions
    input_tokens INTEGER CHECK (input_tokens >= 0),
    output_tokens INTEGER CHECK (output_tokens >= 0),
    duration_ms INTEGER CHECK (duration_ms >= 0),
    model_name VARCHAR(100),
    completion_status VARCHAR(50) CHECK (completion_status IN ('success', 'error', 'timeout', 'abandoned')),
    quality_score DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 1), -- Optional automated quality assessment
    user_satisfaction VARCHAR(50) CHECK (user_satisfaction IN ('positive', 'neutral', 'negative', 'unknown')),
    cost_usd DECIMAL(10,4) CHECK (cost_usd >= 0), -- API cost if available
    metadata JSONB, -- Extensible field for tool-specific data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Baseline Tasks: Historical task completion data from before AI deployment
CREATE TABLE baseline_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(64) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    completion_time_ms INTEGER NOT NULL CHECK (completion_time_ms > 0),
    quality_score DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 1),
    timestamp TIMESTAMPTZ NOT NULL,
    ai_assisted BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productivity Snapshots: Pre-calculated weekly metrics for performance
CREATE TABLE productivity_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(64) NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_ai_time_ms BIGINT CHECK (total_ai_time_ms >= 0),
    task_completion_count INTEGER CHECK (task_completion_count >= 0),
    avg_quality_score DECIMAL(3,2) CHECK (avg_quality_score BETWEEN 0 AND 1),
    tasks_by_type JSONB, -- Breakdown of task distribution
    estimated_time_saved_ms BIGINT,
    productivity_ratio DECIMAL(5,2) CHECK (productivity_ratio >= 0),
    error_rate DECIMAL(3,2) CHECK (error_rate BETWEEN 0 AND 1),
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- ROI Calculations: Historical ROI calculation results
CREATE TABLE roi_calculations (
    calculation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_date DATE NOT NULL,
    user_count INTEGER NOT NULL CHECK (user_count > 0),
    period_months INTEGER NOT NULL CHECK (period_months > 0),
    total_cost_usd DECIMAL(12,2) NOT NULL,
    total_benefit_usd DECIMAL(12,2) NOT NULL,
    net_benefit_usd DECIMAL(12,2) NOT NULL,
    roi_percentage DECIMAL(6,2) NOT NULL,
    payback_period_months DECIMAL(5,1),
    npv_usd DECIMAL(12,2),
    risk_adjusted_roi_percentage DECIMAL(6,2),
    confidence_level VARCHAR(20) CHECK (confidence_level IN ('Low', 'Medium', 'High')),
    configuration JSONB, -- ROI calculator config used
    metrics_snapshot JSONB, -- Input metrics used
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback Items: Actionable insights generated from metrics
CREATE TABLE feedback_items (
    feedback_id VARCHAR(100) PRIMARY KEY,
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('individual_guidance', 'team_insight', 'strategic_recommendation')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    data_supporting JSONB,
    recommended_actions JSONB, -- Array of action strings
    target_users JSONB, -- Array of user IDs
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Users: Basic user information (minimal for privacy)
CREATE TABLE users (
    user_id VARCHAR(64) PRIMARY KEY, -- Hashed ID
    display_name VARCHAR(100),
    team_id VARCHAR(64),
    role VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    ai_access_granted_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teams: Organizational structure
CREATE TABLE teams (
    team_id VARCHAR(64) PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    parent_team_id VARCHAR(64),
    department VARCHAR(100),
    manager_user_id VARCHAR(64),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (parent_team_id) REFERENCES teams(team_id) ON DELETE SET NULL,
    FOREIGN KEY (manager_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- AI Interactions indexes
CREATE INDEX idx_ai_interactions_timestamp ON ai_interactions(timestamp DESC);
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_user_timestamp ON ai_interactions(user_id, timestamp DESC);
CREATE INDEX idx_ai_interactions_tool_name ON ai_interactions(tool_name);
CREATE INDEX idx_ai_interactions_task_type ON ai_interactions(task_type);
CREATE INDEX idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX idx_ai_interactions_completion_status ON ai_interactions(completion_status);
CREATE INDEX idx_ai_interactions_metadata ON ai_interactions USING gin(metadata);

-- Baseline tasks indexes
CREATE INDEX idx_baseline_tasks_user_id ON baseline_tasks(user_id);
CREATE INDEX idx_baseline_tasks_timestamp ON baseline_tasks(timestamp DESC);
CREATE INDEX idx_baseline_tasks_task_type ON baseline_tasks(task_type);
CREATE INDEX idx_baseline_tasks_ai_assisted ON baseline_tasks(ai_assisted);

-- Productivity snapshots indexes
CREATE INDEX idx_productivity_snapshots_user_id ON productivity_snapshots(user_id);
CREATE INDEX idx_productivity_snapshots_week_start ON productivity_snapshots(week_start DESC);
CREATE INDEX idx_productivity_snapshots_user_week ON productivity_snapshots(user_id, week_start DESC);

-- ROI calculations indexes
CREATE INDEX idx_roi_calculations_date ON roi_calculations(calculation_date DESC);
CREATE INDEX idx_roi_calculations_user_count ON roi_calculations(user_count);

-- Feedback items indexes
CREATE INDEX idx_feedback_items_type ON feedback_items(feedback_type);
CREATE INDEX idx_feedback_items_priority ON feedback_items(priority);
CREATE INDEX idx_feedback_items_status ON feedback_items(status);
CREATE INDEX idx_feedback_items_created ON feedback_items(created_at DESC);

-- Users indexes
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_department ON users(department);

-- Teams indexes
CREATE INDEX idx_teams_parent_team_id ON teams(parent_team_id);
CREATE INDEX idx_teams_department ON teams(department);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Recent interactions with user info
CREATE VIEW recent_interactions_with_users AS
SELECT 
    i.*,
    u.display_name,
    u.team_id,
    u.department
FROM ai_interactions i
LEFT JOIN users u ON i.user_id = u.user_id
WHERE i.timestamp > NOW() - INTERVAL '30 days'
ORDER BY i.timestamp DESC;

-- Weekly productivity summary
CREATE VIEW weekly_productivity_summary AS
SELECT 
    ps.week_start,
    COUNT(DISTINCT ps.user_id) as active_users,
    AVG(ps.productivity_ratio) as avg_productivity_ratio,
    AVG(ps.avg_quality_score) as avg_quality_score,
    SUM(ps.estimated_time_saved_ms) / 3600000.0 as total_hours_saved,
    AVG(ps.error_rate) as avg_error_rate
FROM productivity_snapshots ps
GROUP BY ps.week_start
ORDER BY ps.week_start DESC;

-- Team performance view
CREATE VIEW team_performance AS
SELECT 
    t.team_id,
    t.team_name,
    t.department,
    COUNT(DISTINCT u.user_id) as team_size,
    COUNT(DISTINCT CASE WHEN ps.task_completion_count > 0 THEN u.user_id END) as active_ai_users,
    AVG(ps.productivity_ratio) as avg_productivity_ratio,
    AVG(ps.avg_quality_score) as avg_quality_score,
    SUM(ps.estimated_time_saved_ms) / 3600000.0 as total_hours_saved
FROM teams t
LEFT JOIN users u ON t.team_id = u.team_id AND u.is_active = TRUE
LEFT JOIN productivity_snapshots ps ON u.user_id = ps.user_id 
    AND ps.week_start > NOW() - INTERVAL '30 days'
GROUP BY t.team_id, t.team_name, t.department;

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_ai_interactions_updated_at BEFORE UPDATE ON ai_interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_items_updated_at BEFORE UPDATE ON feedback_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate productivity snapshot
CREATE OR REPLACE FUNCTION calculate_productivity_snapshot(
    p_user_id VARCHAR(64),
    p_week_start DATE,
    p_week_end DATE
) RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
    v_total_ai_time_ms BIGINT;
    v_task_count INTEGER;
    v_avg_quality DECIMAL(3,2);
    v_tasks_by_type JSONB;
    v_time_saved_ms BIGINT;
    v_productivity_ratio DECIMAL(5,2);
    v_error_rate DECIMAL(3,2);
BEGIN
    -- Calculate aggregate metrics
    SELECT 
        SUM(duration_ms),
        COUNT(*),
        AVG(quality_score),
        jsonb_object_agg(task_type, task_count)
    INTO 
        v_total_ai_time_ms,
        v_task_count,
        v_avg_quality,
        v_tasks_by_type
    FROM (
        SELECT 
            task_type,
            COUNT(*) as task_count,
            duration_ms,
            quality_score
        FROM ai_interactions
        WHERE user_id = p_user_id
            AND timestamp >= p_week_start
            AND timestamp < p_week_end
            AND completion_status = 'success'
        GROUP BY task_type, duration_ms, quality_score
    ) subq;
    
    -- Calculate time saved (simplified - compare to baseline)
    SELECT 
        COALESCE(v_total_ai_time_ms * 0.3, 0), -- Assume 30% time savings
        COALESCE(1.0 + (v_total_ai_time_ms * 0.3 / NULLIF(v_total_ai_time_ms, 0)), 1.0),
        COALESCE(1.0 - v_avg_quality, 0.0)
    INTO 
        v_time_saved_ms,
        v_productivity_ratio,
        v_error_rate;
    
    -- Insert or update snapshot
    INSERT INTO productivity_snapshots (
        user_id,
        week_start,
        week_end,
        total_ai_time_ms,
        task_completion_count,
        avg_quality_score,
        tasks_by_type,
        estimated_time_saved_ms,
        productivity_ratio,
        error_rate
    ) VALUES (
        p_user_id,
        p_week_start,
        p_week_end,
        v_total_ai_time_ms,
        v_task_count,
        v_avg_quality,
        v_tasks_by_type,
        v_time_saved_ms,
        v_productivity_ratio,
        v_error_rate
    )
    ON CONFLICT (user_id, week_start) 
    DO UPDATE SET
        total_ai_time_ms = EXCLUDED.total_ai_time_ms,
        task_completion_count = EXCLUDED.task_completion_count,
        avg_quality_score = EXCLUDED.avg_quality_score,
        tasks_by_type = EXCLUDED.tasks_by_type,
        estimated_time_saved_ms = EXCLUDED.estimated_time_saved_ms,
        productivity_ratio = EXCLUDED.productivity_ratio,
        error_rate = EXCLUDED.error_rate,
        computed_at = NOW()
    RETURNING snapshot_id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================

-- Insert sample teams
INSERT INTO teams (team_id, team_name, department) VALUES
    ('team_eng', 'Engineering', 'Technology'),
    ('team_product', 'Product', 'Product'),
    ('team_marketing', 'Marketing', 'Marketing'),
    ('team_support', 'Customer Support', 'Operations');

-- Insert sample users
INSERT INTO users (user_id, display_name, team_id, department, ai_access_granted_date) VALUES
    ('user_001', 'Alice Engineer', 'team_eng', 'Technology', '2024-01-15'),
    ('user_002', 'Bob Developer', 'team_eng', 'Technology', '2024-01-15'),
    ('user_003', 'Carol Product', 'team_product', 'Product', '2024-02-01'),
    ('user_004', 'Dave Support', 'team_support', 'Operations', '2024-03-01');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ai_productivity_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ai_productivity_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ai_productivity_user;

-- Comments for documentation
COMMENT ON TABLE ai_interactions IS 'Raw log of every AI tool interaction with privacy-preserving user IDs';
COMMENT ON TABLE baseline_tasks IS 'Historical task completion data from before AI deployment for baseline comparison';
COMMENT ON TABLE productivity_snapshots IS 'Pre-calculated weekly productivity metrics for performance optimization';
COMMENT ON TABLE roi_calculations IS 'Historical ROI calculation results with full configuration and metrics snapshots';
COMMENT ON TABLE feedback_items IS 'Actionable insights generated from productivity metrics analysis';
COMMENT ON TABLE users IS 'Minimal user information with hashed IDs for privacy';
COMMENT ON TABLE teams IS 'Organizational structure for team-level aggregation';

-- Schema version tracking
CREATE TABLE schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES 
    ('1.0.0', 'Initial schema with core tables, indexes, views, and functions');
