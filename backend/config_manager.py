import json
from pathlib import Path
from .logging_config import logger

CONFIG_FILE_PATH = Path("backend/config.json")

def load_config():
    if not CONFIG_FILE_PATH.exists():
        logger.warning(f"Config file not found at {CONFIG_FILE_PATH}. Creating with default values.")
        # TODO: Define a proper default config structure
        default_config = {
            "exchange": {
                "name": "binance",
                "testnet": True,
            },
            "execution_pool": {
                "max_open_groups": 10,
            },
            "grid_strategy": {
                "dca_config": [
                    {"price_gap": 0, "capital_weight": 0.2, "tp_target": 0.01},
                    {"price_gap": -0.005, "capital_weight": 0.2, "tp_target": 0.005},
                    {"price_gap": -0.01, "capital_weight": 0.2, "tp_target": 0.02},
                    {"price_gap": -0.015, "capital_weight": 0.2, "tp_target": 0.015},
                    {"price_gap": -0.02, "capital_weight": 0.2, "tp_target": 0.01},
                ]
            }
        }
        save_config(default_config)
        return default_config
    with open(CONFIG_FILE_PATH, 'r') as f:
        return json.load(f)

def save_config(config: dict):
    with open(CONFIG_FILE_PATH, 'w') as f:
        json.dump(config, f, indent=4)
    logger.info(f"Config saved to {CONFIG_FILE_PATH}")
