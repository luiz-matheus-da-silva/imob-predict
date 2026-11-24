
-- =====================================================
-- 1. VERSÕES DOS MODELOS DE MACHINE LEARNING
-- =====================================================

CREATE TABLE IF NOT EXISTS model_versions (
    id BIGSERIAL PRIMARY KEY,

    version VARCHAR(50) NOT NULL UNIQUE,

    mae NUMERIC(15, 6),
    mse NUMERIC(20, 6),
    loss NUMERIC(20, 6),

    training_samples INTEGER NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_training_samples
        CHECK (training_samples > 0)
);


-- =====================================================
-- 2. IMÓVEIS
-- =====================================================

CREATE TABLE IF NOT EXISTS properties (
    id BIGSERIAL PRIMARY KEY,

    area NUMERIC(10, 2) NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    age INTEGER NOT NULL,
    parking_spaces INTEGER NOT NULL,

    neighborhood VARCHAR(100) NOT NULL,
    condition VARCHAR(50) NOT NULL,

    has_pool BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_area
        CHECK (area > 0),

    CONSTRAINT ck_bedrooms
        CHECK (bedrooms >= 0),

    CONSTRAINT ck_bathrooms
        CHECK (bathrooms >= 0),

    CONSTRAINT ck_age
        CHECK (age >= 0),

    CONSTRAINT ck_parking_spaces
        CHECK (parking_spaces >= 0)
);


-- =====================================================
-- 3. AVALIAÇÕES DOS IMÓVEIS
-- =====================================================

CREATE TABLE IF NOT EXISTS evaluations (
    id BIGSERIAL PRIMARY KEY,

    property_id BIGINT NOT NULL,

    model_version_id BIGINT NOT NULL,

    predicted_price NUMERIC(15, 2) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_evaluation_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id),

    CONSTRAINT fk_evaluation_model
        FOREIGN KEY (model_version_id)
        REFERENCES model_versions(id),

    CONSTRAINT ck_predicted_price
        CHECK (predicted_price > 0)
);


-- =====================================================
-- 4. ÍNDICES PARA CONSULTAS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_evaluations_property
    ON evaluations(property_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_created_at
    ON evaluations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evaluations_model
    ON evaluations(model_version_id);


-- =====================================================
-- 5. HISTÓRICO DE TREINAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS training_runs (
    id BIGSERIAL PRIMARY KEY,

    model_version_id BIGINT,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    epochs INTEGER NOT NULL DEFAULT 0,
    training_samples INTEGER NOT NULL DEFAULT 0,
    validation_samples INTEGER NOT NULL DEFAULT 0,
    test_samples INTEGER NOT NULL DEFAULT 0,

    mae NUMERIC,
    mse NUMERIC,
    loss NUMERIC,

    error_message TEXT,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_training_run_model
        FOREIGN KEY (model_version_id)
        REFERENCES model_versions(id),

    CONSTRAINT training_runs_status_check
        CHECK (status IN ('pending', 'running', 'completed', 'failed')),

    CONSTRAINT training_runs_epochs_check
        CHECK (epochs >= 0),

    CONSTRAINT training_runs_samples_check
        CHECK (
            training_samples >= 0
            AND validation_samples >= 0
            AND test_samples >= 0
        ),

    CONSTRAINT training_runs_metrics_check
        CHECK (
            (mae IS NULL OR mae >= 0)
            AND (mse IS NULL OR mse >= 0)
            AND (loss IS NULL OR loss >= 0)
        )
);

CREATE INDEX IF NOT EXISTS idx_training_runs_created_at
    ON training_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_runs_status
    ON training_runs(status);
