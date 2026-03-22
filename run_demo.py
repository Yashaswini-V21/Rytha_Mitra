import json
from pathlib import Path
from typing import Any, Dict

from crew.krishi_crew import KrishiCrew


def _load_dotenv_if_available() -> None:
    env_file = Path(".env")
    if not env_file.exists():
        return

    try:
        from dotenv import load_dotenv
    except ImportError:
        return

    load_dotenv(dotenv_path=env_file, override=False)


def _sample_inputs() -> Dict[str, Any]:
    return {
        "N": 82,
        "P": 42,
        "K": 38,
        "temperature": 31.5,
        "humidity": 62.0,
        "ph": 6.7,
        "rainfall": 92.0,
        "district": "Raichur",
        "input_costs": 18000,
        "land_acres": 2.0,
    }


def main() -> None:
    _load_dotenv_if_available()

    crew = KrishiCrew()
    result = crew.run(_sample_inputs())
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
