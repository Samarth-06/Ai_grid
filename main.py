{
  "industrial_spike": {
    "scenario": "industrial_spike",
    "description": "Industrial load +42% demand spike",
    "base_value": 1487.97,
    "prediction": 1788.59,
    "top_features": [
      {
        "name": "roll_mean_3h",
        "shap_value": 355.3352,
        "direction": "up"
      },
      {
        "name": "lag_2h",
        "shap_value": -69.6805,
        "direction": "down"
      },
      {
        "name": "roll_max_3h",
        "shap_value": 35.7586,
        "direction": "up"
      },
      {
        "name": "lag_1h",
        "shap_value": -34.6167,
        "direction": "down"
      },
      {
        "name": "roll_mean_6h",
        "shap_value": 9.6086,
        "direction": "up"
      },
      {
        "name": "hour_cos",
        "shap_value": 4.7821,
        "direction": "up"
      }
    ]
  },
  "storm": {
    "scenario": "storm",
    "description": "Storm: solar/wind -78%, residential +15%",
    "base_value": 1487.97,
    "prediction": 1742.92,
    "top_features": [
      {
        "name": "roll_mean_3h",
        "shap_value": 308.7,
        "direction": "up"
      },
      {
        "name": "lag_1h",
        "shap_value": -64.2244,
        "direction": "down"
      },
      {
        "name": "lag_2h",
        "shap_value": -38.6996,
        "direction": "down"
      },
      {
        "name": "roll_max_3h",
        "shap_value": 22.6351,
        "direction": "up"
      },
      {
        "name": "hour_cos",
        "shap_value": -11.906,
        "direction": "down"
      },
      {
        "name": "temp_c",
        "shap_value": 9.3256,
        "direction": "up"
      }
    ]
  },
  "battery_depletion": {
    "scenario": "battery_depletion",
    "description": "Battery SOC at critical 12%, evening peak demand",
    "base_value": 1487.97,
    "prediction": 1745.06,
    "top_features": [
      {
        "name": "roll_mean_3h",
        "shap_value": 337.0786,
        "direction": "up"
      },
      {
        "name": "lag_1h",
        "shap_value": -65.4687,
        "direction": "down"
      },
      {
        "name": "lag_2h",
        "shap_value": -58.1499,
        "direction": "down"
      },
      {
        "name": "roll_max_3h",
        "shap_value": 23.199,
        "direction": "up"
      },
      {
        "name": "roll_mean_6h",
        "shap_value": 10.4602,
        "direction": "up"
      },
      {
        "name": "hour_cos",
        "shap_value": 6.6066,
        "direction": "up"
      }
    ]
  },
  "dual_failure": {
    "scenario": "dual_failure",
    "description": "Wind offline + industrial spike simultaneously",
    "base_value": 1487.97,
    "prediction": 1790.4,
    "top_features": [
      {
        "name": "roll_mean_3h",
        "shap_value": 355.5989,
        "direction": "up"
      },
      {
        "name": "lag_2h",
        "shap_value": -69.2357,
        "direction": "down"
      },
      {
        "name": "roll_max_3h",
        "shap_value": 35.8957,
        "direction": "up"
      },
      {
        "name": "lag_1h",
        "shap_value": -34.4503,
        "direction": "down"
      },
      {
        "name": "roll_mean_6h",
        "shap_value": 9.6408,
        "direction": "up"
      },
      {
        "name": "hour_cos",
        "shap_value": 4.7783,
        "direction": "up"
      }
    ]
  }
}