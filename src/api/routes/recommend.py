import json
from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from api.schemas.request import RecommendRequest
from crew.krishi_crew import KrishiCrew
import structlog

logger = structlog.get_logger()
recommend_bp = Blueprint("recommend", __name__)

@recommend_bp.post("/api/recommend")
def recommend():
    """
    Get AI-driven agricultural advisory
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          $ref: '#/definitions/RecommendRequest'
    responses:
      200:
        description: Advisory generated successfully
      400:
        description: Validation error
      500:
        description: Internal server error
    """
    payload = request.get_json(silent=True) or {}
    
    try:
        # Strict Pydantic Validation
        inputs_obj = RecommendRequest(**payload)
        inputs = inputs_obj.model_dump()
        
        logger.info("recommendation_request", district=inputs["district"], land=inputs["land_acres"])
        
        crew = KrishiCrew()
        result = crew.run(inputs)
        
        return jsonify({
            "ok": True,
            "inputs": inputs,
            "result": result,
        })
        
    except ValidationError as e:
        logger.warning("validation_error", errors=e.errors())
        return jsonify({"ok": False, "errors": e.errors()}), 400
    except Exception as exc:
        logger.error("internal_error", error=str(exc))
        return jsonify({
            "ok": False,
            "error": f"Internal Error: {str(exc)}"
        }), 500
