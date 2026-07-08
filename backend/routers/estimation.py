from fastapi import APIRouter, HTTPException
from models.schemas import WizardState, EstimationResult
from services.estimation_engine import EstimationEngine

router = APIRouter()
engine = EstimationEngine()

@router.post("/calculate", response_model=EstimationResult)
async def calculate_estimation(state: WizardState):
    try:
        if not state.estimations:
            raise HTTPException(status_code=400, detail="Aucune estimation")
        if not state.resources:
            raise HTTPException(status_code=400, detail="Aucune ressource")

        start_date = None
        if state.project_info and state.project_info.start_date:
            start_date = state.project_info.start_date

        segments_modules = (
            state.modules.segments_modules if state.modules else {}
        )

        result = engine.calculate_estimation(
            estimations=state.estimations,
            segments=state.segments.segments if state.segments else [],
            resources=state.resources,
            margin_percentage=state.margin_percentage,
            risk_factor=state.risk_factor,
            complexity_factor=state.complexity_factor,
            ai_boost_factor=state.ai_boost_factor,
            travel_costs=state.travel_costs,
            planning_config=state.planning_config,
            project_start_date=start_date,
            segments_modules=segments_modules,
            manual_planning=state.manual_planning,
            component_coefficients=state.component_coefficients,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
