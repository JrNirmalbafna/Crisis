from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    app_name: str = "Helios Intelligence"
    debug: bool = False
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4
    log_level: str = "INFO"
    secret_key: str = "change-this-secret-key"

    # Database
    database_url: str = "sqlite:///./helios.db"
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # Object Storage
    object_storage_type: str = "local"
    object_storage_path: str = "./data/storage"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    aws_s3_bucket: str = ""
    s3_endpoint_url: str = ""

    # Time-series Database (Optional)
    tsdb_type: str = "none"
    tsdb_url: str = ""
    tsdb_token: str = ""
    tsdb_org: str = ""

    # Redis (Optional)
    redis_url: str = "redis://localhost:6379/0"
    redis_password: str = ""

    # Fusion Parameters
    fusion_alpha: float = 0.5
    fusion_beta: float = 0.3
    fusion_gamma: float = 0.2
    z_max: float = 3.0
    time_constant: int = 300
    noise_threshold: float = 0.5
    consistency_window: int = 3600
    delta_r: float = 0.1

    # Physics Validation
    physics_validation_enabled: bool = True
    physics_confidence_multiplier_min: float = 0.5
    physics_auto_hard_fail_block: bool = True

    # Satellite Ingestion
    ingestion_enabled: bool = True
    ingestion_interval_seconds: int = 60
    data_retention_days: int = 730

    aditya_l1_enabled: bool = True
    aditya_l1_api_url: str = ""
    aditya_l1_update_interval: int = 300

    soho_enabled: bool = True
    soho_api_url: str = ""
    soho_update_interval: int = 300

    dscovr_enabled: bool = True
    dscovr_api_url: str = ""
    dscovr_update_interval: int = 60

    goes_enabled: bool = True
    goes_api_url: str = ""
    goes_update_interval: int = 60

    ace_enabled: bool = True
    ace_api_url: str = ""
    ace_update_interval: int = 300

    wind_enabled: bool = True
    wind_api_url: str = ""
    wind_update_interval: int = 300

    # AI/ML Models
    model_path: str = "./ai/models"
    device: str = "cpu"
    batch_size: int = 32
    inference_threads: int = 4

    detection_model_version: str = "v1.0"
    prediction_model_version: str = "v1.0"
    uq_model_version: str = "v1.0"

    # Pipeline
    pipeline_trigger_type: str = "scheduled"
    pipeline_schedule: str = "*/5 * * * *"
    pipeline_timeout_seconds: int = 3600

    # Decision Support
    dss_enabled: bool = True
    dss_automation_enabled: bool = True
    dss_stakeholders: str = "satellite_ops,power_grid,astronauts,ground_station,scientist_review"

    # Security
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    api_key_header: str = "X-API-Key"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    cors_allow_credentials: bool = True
    cors_allow_methods: str = "*"
    cors_allow_headers: str = "*"

    # Monitoring
    metrics_enabled: bool = False
    metrics_port: int = 9090
    prometheus_multiproc_dir: str = "/tmp"

    # Logging
    log_format: str = "json"
    log_rotation: str = "500 MB"
    log_retention: str = "30 days"
    log_file: str = "./logs/helios.log"

    # Testing
    test_database_url: str = ""
    test_data_path: str = "./tests/data"

    # Feature Flags
    feature_explainability_enabled: bool = True
    feature_uq_enabled: bool = True
    feature_consensus_enabled: bool = True
    feature_physics_validation_enabled: bool = True
    feature_dss_enabled: bool = True
    feature_dashboard_enabled: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
