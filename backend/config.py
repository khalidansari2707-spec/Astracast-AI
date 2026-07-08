import os

class Settings:
    PROJECT_NAME: str = "AstraCast AI"
    API_V1_STR: str = "/api/v1"
    
    # Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-astracast-token-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    CORS_ORIGINS: list = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin.strip()]
    
    # Threshold Defaults
    DEFAULT_THRESHOLDS = {
        "electron_flux": {"low": 10.0, "medium": 100.0, "high": 1000.0, "critical": 5000.0},
        "proton_flux": {"low": 5.0, "medium": 50.0, "high": 500.0, "critical": 2500.0},
        "solar_wind_speed": {"low": 400.0, "medium": 550.0, "high": 700.0, "critical": 850.0},
        "imf_bz": {"low": -2.0, "medium": -5.0, "high": -10.0, "critical": -15.0},
        "plasma_density": {"low": 10.0, "medium": 20.0, "high": 35.0, "critical": 50.0},
        "magnetic_field": {"low": 10.0, "medium": 15.0, "high": 25.0, "critical": 40.0},
        "xray_flux": {"low": 0.1, "medium": 0.5, "high": 1.0, "critical": 2.0},
        "solar_activity_index": {"low": 1.5, "medium": 2.5, "high": 4.0, "critical": 6.0}
    }

settings = Settings()
