from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="researcher")  # admin, operator, researcher

class SpaceWeatherData(Base):
    __tablename__ = "space_weather_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, unique=True, index=True, nullable=False)
    electron_flux = Column(Float, nullable=True)
    proton_flux = Column(Float, nullable=True)
    solar_wind_speed = Column(Float, nullable=True)
    imf_bz = Column(Float, nullable=True)
    plasma_density = Column(Float, nullable=True)
    magnetic_field = Column(Float, nullable=True)
    xray_flux = Column(Float, nullable=True)
    solar_activity_index = Column(Float, nullable=True)
    source = Column(String, default="historical")  # historical, admin_entry, simulator

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, default=datetime.datetime.utcnow)
    prediction_horizon = Column(String, nullable=False)  # 30m, 6h, 12h, 24h, 3d, 7d
    
    storm_probability = Column(Float, nullable=False)
    expected_electron_flux = Column(Float, nullable=False)
    expected_solar_wind_speed = Column(Float, nullable=False)
    expected_imf_bz = Column(Float, nullable=False)
    expected_radiation_category = Column(String, nullable=False)  # None, S1, S2, S3, S4, S5
    expected_peak_time = Column(DateTime, nullable=True)
    expected_duration = Column(Float, nullable=True)  # in hours
    confidence = Column(Float, nullable=False)
    explanation = Column(String, nullable=True)
    recommended_action = Column(String, nullable=True)
    
    # Validation fields
    actual_storm_probability = Column(Float, nullable=True)
    actual_electron_flux = Column(Float, nullable=True)
    actual_solar_wind_speed = Column(Float, nullable=True)
    actual_imf_bz = Column(Float, nullable=True)
    is_validated = Column(Boolean, default=False)

class Threshold(Base):
    __tablename__ = "thresholds"

    id = Column(Integer, primary_key=True, index=True)
    parameter_name = Column(String, unique=True, index=True, nullable=False)
    low = Column(Float, nullable=False)
    medium = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    critical = Column(Float, nullable=False)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, default=datetime.datetime.utcnow)
    severity = Column(String, nullable=False)  # low, medium, high, critical
    message = Column(String, nullable=False)
    parameter = Column(String, nullable=True)
    value = Column(Float, nullable=True)
    acknowledged = Column(Boolean, default=False)

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, default=datetime.datetime.utcnow)
    level = Column(String, nullable=False)  # info, warning, error
    message = Column(String, nullable=False)
    user = Column(String, nullable=True)
