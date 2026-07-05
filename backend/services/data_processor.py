import pandas as pd
import numpy as np
import datetime
from sqlalchemy.orm import Session
from backend.models import SpaceWeatherData, SystemLog
from backend.database import engine, SessionLocal
import os

class DataProcessor:
    def __init__(self, db: Session):
        self.db = db

    def load_and_merge_datasets(self, electron_path: str, imf_path: str, wind_path: str):
        """
        Loads the 3 CSV files, aggregates, merges them on time, and interpolates missing data.
        """
        try:
            # 1. Load Electron Flux
            if not os.path.exists(electron_path):
                raise FileNotFoundError(f"File not found: {electron_path}")
            df_electron = pd.read_csv(electron_path)
            df_electron['timestamp'] = pd.to_datetime(df_electron['time_tag'], utc=True).dt.tz_localize(None)
            
            # Pivot electron flux by energy band
            # Columns: time_tag, satellite, flux, energy
            # We want to pivot 'energy' to columns and average 'flux'
            df_electron_pivot = df_electron.pivot_table(
                index='timestamp', 
                columns='energy', 
                values='flux', 
                aggfunc='mean'
            ).reset_index()
            
            # Rename energy columns for database compatibility
            rename_dict = {}
            for col in df_electron_pivot.columns:
                if col != 'timestamp':
                    clean_name = f"flux_{col.replace(' ', '_').lower()}"
                    rename_dict[col] = clean_name
            df_electron_pivot = df_electron_pivot.rename(columns=rename_dict)

            # 2. Load IMF Bz
            if not os.path.exists(imf_path):
                raise FileNotFoundError(f"File not found: {imf_path}")
            df_imf = pd.read_csv(imf_path)
            df_imf['timestamp'] = pd.to_datetime(df_imf['time_tag'], utc=True).dt.tz_localize(None)
            # Resample to 5-minute mean
            df_imf_resampled = df_imf.set_index('timestamp').resample('5min').mean(numeric_only=True).reset_index()

            # 3. Load Solar Wind
            if not os.path.exists(wind_path):
                raise FileNotFoundError(f"File not found: {wind_path}")
            df_wind = pd.read_csv(wind_path)
            df_wind['timestamp'] = pd.to_datetime(df_wind['time_tag'], utc=True).dt.tz_localize(None)
            # Resample to 5-minute mean
            df_wind_resampled = df_wind.set_index('timestamp').resample('5min').mean(numeric_only=True).reset_index()

            # 4. Merge all
            # We'll outer join to keep the maximum span, then interpolate
            merged = pd.merge(df_imf_resampled, df_wind_resampled, on='timestamp', how='outer')
            merged = pd.merge(merged, df_electron_pivot, on='timestamp', how='outer')
            
            # Sort by timestamp
            merged = merged.sort_values('timestamp').reset_index(drop=True)

            # Impute / Clean
            # Let's select core columns needed for our database and forecasting
            # Columns from IMF: bx_gsm, by_gsm, bz_gsm, bt
            # Columns from Wind: density, speed, temperature
            # Columns from Electron: flux_79_kev, flux_134_kev, flux_186_kev, flux_271_kev, flux_378_kev, flux_548_kev, flux_865_kev, flux_1509_kev, flux_2205_kev, flux_2894_kev
            
            # We will use flux_865_kev or flux_1509_kev as main 'electron_flux'
            # We will map standard names:
            # electron_flux -> flux_865_kev
            # proton_flux -> average of lower bands or synthetic (as no direct proton flux file was provided, we can use flux_79_kev as proton proxy or synthetically simulate it)
            # solar_wind_speed -> speed
            # imf_bz -> bz_gsm
            # plasma_density -> density
            # magnetic_field -> bt
            # xray_flux -> flux_134_kev * 0.01 (proxy)
            # solar_activity_index -> speed * 0.1 + abs(bz_gsm) * 2.0 (feature engineering proxy)
            
            merged['electron_flux'] = merged.get('flux_865_kev', merged.get('flux_79_kev', np.nan))
            merged['proton_flux'] = merged.get('flux_79_kev', np.nan) * 0.5
            merged['solar_wind_speed'] = merged.get('speed', np.nan)
            merged['imf_bz'] = merged.get('bz_gsm', np.nan)
            merged['plasma_density'] = merged.get('density', np.nan)
            merged['magnetic_field'] = merged.get('bt', np.nan)
            merged['xray_flux'] = merged.get('flux_134_kev', np.nan) * 0.05
            
            # Compute solar activity index
            # Solar activity index: speed is around 300-800 km/s, bz around -15 to +15.
            merged['solar_activity_index'] = (
                (merged['solar_wind_speed'].fillna(400) / 400.0) +
                (merged['magnetic_field'].fillna(5) / 5.0) +
                (merged['electron_flux'].fillna(100) / 100.0)
            ) / 3.0

            # Interpolate missing values
            columns_to_interpolate = [
                'electron_flux', 'proton_flux', 'solar_wind_speed', 
                'imf_bz', 'plasma_density', 'magnetic_field', 
                'xray_flux', 'solar_activity_index'
            ]
            for col in columns_to_interpolate:
                if col in merged.columns:
                    # Limit linear interpolation to avoid propagating values too far
                    merged[col] = merged[col].interpolate(method='linear', limit_direction='both')
                    # Fill remaining NaNs with typical defaults
                    defaults = {
                        'electron_flux': 300.0,
                        'proton_flux': 150.0,
                        'solar_wind_speed': 450.0,
                        'imf_bz': -0.5,
                        'plasma_density': 5.0,
                        'magnetic_field': 3.5,
                        'xray_flux': 0.1,
                        'solar_activity_index': 1.0
                    }
                    merged[col] = merged[col].fillna(defaults[col])

            # Filter out and keep only the standard columns
            final_df = merged[['timestamp', 'electron_flux', 'proton_flux', 'solar_wind_speed', 'imf_bz', 'plasma_density', 'magnetic_field', 'xray_flux', 'solar_activity_index']]
            
            return final_df

        except Exception as e:
            self.log_event("error", f"Data loading/merging failed: {str(e)}")
            raise e

    def import_to_db(self, df: pd.DataFrame):
        """
        Imports the cleaned DataFrame into the sqlite database.
        """
        try:
            records = []
            for _, row in df.iterrows():
                # Convert timestamp pandas to datetime
                ts = row['timestamp']
                if isinstance(ts, pd.Timestamp):
                    ts = ts.to_pydatetime()
                
                record = SpaceWeatherData(
                    timestamp=ts,
                    electron_flux=float(row['electron_flux']),
                    proton_flux=float(row['proton_flux']),
                    solar_wind_speed=float(row['solar_wind_speed']),
                    imf_bz=float(row['imf_bz']),
                    plasma_density=float(row['plasma_density']),
                    magnetic_field=float(row['magnetic_field']),
                    xray_flux=float(row['xray_flux']),
                    solar_activity_index=float(row['solar_activity_index']),
                    source="historical"
                )
                records.append(record)

            # Batch write to DB
            # We first clear existing historical entries
            self.db.query(SpaceWeatherData).filter(SpaceWeatherData.source == "historical").delete()
            self.db.add_all(records)
            self.db.commit()
            
            self.log_event("info", f"Successfully imported {len(records)} cleaned historical records.")
            return len(records)
        except Exception as e:
            self.db.rollback()
            self.log_event("error", f"Import to DB failed: {str(e)}")
            raise e

    def log_event(self, level: str, message: str):
        log = SystemLog(level=level, message=message, user="System")
        self.db.add(log)
        self.db.commit()
