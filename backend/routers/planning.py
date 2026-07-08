"""Router pour le calcul du planning WBS."""
from fastapi import APIRouter, HTTPException
from models.schemas import WizardState, PlanningResult, PlanningConfig
from services.estimation_engine import EstimationEngine

router = APIRouter()
engine = EstimationEngine()


@router.post("/calculate", response_model=PlanningResult)
async def calculate_planning(state: WizardState):
    """Calcule le planning WBS complet à partir de l'état du wizard."""
    try:
        if not state.estimations:
            raise HTTPException(status_code=400, detail="Aucune estimation fournie (étape 4 requise)")
        if not state.resources:
            raise HTTPException(status_code=400, detail="Aucune ressource fournie (étape 5 requise)")

        config = state.planning_config or PlanningConfig()
        start_date = None
        if state.project_info and state.project_info.start_date:
            start_date = state.project_info.start_date

        segments = state.segments.segments if state.segments else []
        segments_modules = (
            state.modules.segments_modules if state.modules else {}
        )

        result = engine.calculate_estimation(
            estimations=state.estimations,
            segments=segments,
            resources=state.resources,
            margin_percentage=state.margin_percentage,
            risk_factor=state.risk_factor,
            complexity_factor=state.complexity_factor,
            ai_boost_factor=state.ai_boost_factor,
            travel_costs=state.travel_costs,
            planning_config=config,
            project_start_date=start_date,
            segments_modules=segments_modules,
            manual_planning=state.manual_planning,
            component_coefficients=state.component_coefficients,
        )

        if not result.planning:
            raise HTTPException(status_code=500, detail="Impossible de générer le planning")

        return result.planning

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
