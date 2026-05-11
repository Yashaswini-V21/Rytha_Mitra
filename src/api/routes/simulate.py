import json
from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from api.schemas.request import SimulateRequest
import structlog

logger = structlog.get_logger()
simulate_bp = Blueprint("simulate", __name__)

@simulate_bp.post("/api/simulate")
def simulate():
    """
    Fast simulation for real-time dashboard updates
    ---
    responses:
      200:
        description: Simulation result returned
    """
    payload = request.get_json(silent=True) or {}
    
    try:
        inputs_obj = SimulateRequest(**payload)
        inputs = inputs_obj.model_dump()
        
        from crew.krishi_crew import CropAdvisorTool
        tool = CropAdvisorTool()
        
        tool_output = tool._run(
            N=inputs["N"],
            P=inputs["P"],
            K=inputs["K"],
            temperature=inputs["temperature"],
            humidity=inputs["humidity"],
            ph=inputs["ph"],
            rainfall=inputs["rainfall"]
        )
        
        result_data = json.loads(tool_output)
        top_crop = result_data["top_crops"][0]
        
        # Heuristic for demo profit
        base_profit = 45000 * inputs["land_acres"]
        if "rice" in top_crop.lower(): base_profit *= 1.2
        
        return jsonify({
            "ok": True,
            "inputs": inputs,
            "top_crop": top_crop,
            "probability": result_data["probabilities"][top_crop],
            "profit_estimate": base_profit,
            "contributions": result_data.get("contributions", {}).get(top_crop, {}),
            "risk_score": "LOW" if result_data["probabilities"][top_crop] > 0.7 else "MEDIUM"
        })
        
    except ValidationError as e:
        return jsonify({"ok": False, "errors": e.errors()}), 400
    except Exception as exc:
        logger.error("simulation_error", error=str(exc))
        return jsonify({"ok": False, "error": str(exc)}), 500
