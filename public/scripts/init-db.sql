-- Database initialization script for WebGenie
-- This script sets up the initial database structure

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables for datasets
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    source VARCHAR(512),
    species VARCHAR(255),
    tissue VARCHAR(255),
    genes INTEGER,
    samples INTEGER,
    schema JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for datasets
CREATE INDEX IF NOT EXISTS idx_datasets_name ON datasets(name);
CREATE INDEX IF NOT EXISTS idx_datasets_species ON datasets(species);
CREATE INDEX IF NOT EXISTS idx_datasets_tissue ON datasets(tissue);

-- Create tables for jobs
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    algorithm VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    parameters JSONB,
    progress FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    celery_task_id VARCHAR(255),
    logs TEXT
);

-- Create indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_dataset_id ON jobs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_jobs_algorithm ON jobs(algorithm);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_celery_task_id ON jobs(celery_task_id);

-- Create tables for results
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    network_file VARCHAR(1024),
    metrics JSONB,
    format VARCHAR(50) DEFAULT 'graphml',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for results
CREATE INDEX IF NOT EXISTS idx_results_job_id ON results(job_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at);

-- Create algorithms cache table
CREATE TABLE IF NOT EXISTS algorithms_cache (
    name VARCHAR(255) PRIMARY KEY,
    description TEXT,
    docker_image VARCHAR(512),
    parameters JSONB,
    registry VARCHAR(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions to webgenie user
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_user WHERE usename = 'webgenie') THEN
        GRANT CONNECT ON DATABASE webgenie_db TO webgenie;
        GRANT USAGE ON SCHEMA public TO webgenie;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO webgenie;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO webgenie;
    END IF;
END
$$;
