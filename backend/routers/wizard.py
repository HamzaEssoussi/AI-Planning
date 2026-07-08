import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.schemas import (
    WizardState, ProjectInfo, SegmentSelection, ModuleSelection, 
    ModuleEstimation, Resource, TravelCosts, PlanningConfig, ManualPlanningTask
)
from models.domain import WizardSession
from core.database import get_db
from typing import Dict

logger = logging.getLogger(__name__)
router = APIRouter()


def get_wizard_state(db: Session, session_id: str) -> WizardState:
    """Récupère l'état du wizard depuis la base de données"""
    db_session = db.query(WizardSession).filter(WizardSession.session_id == session_id).first()
    if db_session and db_session.state_data:
        return WizardState(**db_session.state_data)
    return WizardState()


def save_wizard_state(db: Session, session_id: str, state: WizardState):
    """Sauvegarde l'état du wizard dans la base de données"""
    db_session = db.query(WizardSession).filter(WizardSession.session_id == session_id).first()
    if db_session:
        db_session.state_data = state.model_dump(mode='json')
    else:
        db_session = WizardSession(session_id=session_id, state_data=state.model_dump(mode='json'))
        db.add(db_session)
    db.commit()


@router.post("/step/{step}")
async def save_step(step: int, data: Dict, session_id: str = "default", db: Session = Depends(get_db)):
    """
    Sauvegarde une étape du wizard.
    Accepte les données partielles (seuls les champs fournis sont mis à jour).
    """
    print(f"[wizard] save_step called step={step} session_id={session_id} data_keys={list(data.keys())}")
    print(f"[wizard] data content: {data}")
    
    try:
        state = get_wizard_state(db, session_id)
        state.current_step = step
        
        # ---- STEP 1: Project Information ----
        if step == 1:
            if state.project_info is None:
                state.project_info = ProjectInfo()
            for key, value in data.items():
                if hasattr(state.project_info, key):
                    setattr(state.project_info, key, value)
                    print(f"[wizard] set project_info.{key} = {value}")
            # Si des champs obligatoires sont manquants, garder les valeurs existantes
            if not state.project_info.client_name:
                state.project_info.client_name = ""
            if not state.project_info.project_title:
                state.project_info.project_title = ""
                    
        # ---- STEP 2: Segments ----
        elif step == 2:
            if state.segments is None:
                state.segments = SegmentSelection()
            if 'segments' in data:
                state.segments.segments = data['segments']
                print(f"[wizard] set segments = {data['segments']}")
                    
        # ---- STEP 3: Modules ----
        elif step == 3:
            if state.modules is None:
                state.modules = ModuleSelection()
            if 'segments_modules' in data:
                state.modules.segments_modules = data['segments_modules']
                print(f"[wizard] set modules = {data['segments_modules']}")
                    
        # ---- STEP 4: Estimations ----
        elif step == 4:
            if 'estimations' in data:
                state.estimations = [ModuleEstimation(**item) for item in data['estimations']]
                print(f"[wizard] set {len(state.estimations)} estimations")
            if 'component_coefficients' in data:
                state.component_coefficients = data['component_coefficients']
                print(f"[wizard] set component_coefficients")
                    
        # ---- STEP 5: Resources ----
        elif step == 5:
            if 'resources' in data:
                state.resources = [Resource(**item) for item in data['resources']]
                print(f"[wizard] set {len(state.resources)} resources")
                    
        # ---- STEP 6: Factors ----
        elif step == 6:
            if 'margin_percentage' in data:
                state.margin_percentage = data['margin_percentage']
            if 'risk_factor' in data:
                state.risk_factor = data['risk_factor']
            if 'complexity_factor' in data:
                state.complexity_factor = data['complexity_factor']
            if 'ai_boost_factor' in data:
                state.ai_boost_factor = data['ai_boost_factor']
            print(f"[wizard] factors updated")
                    
        # ---- STEP 7: Planning Config ----
        elif step == 7:
            if state.planning_config is None:
                state.planning_config = PlanningConfig()
            for key, value in data.items():
                if hasattr(state.planning_config, key):
                    setattr(state.planning_config, key, value)
                    print(f"[wizard] set planning_config.{key} = {value}")
            if 'manual_planning' in data:
                state.manual_planning = [ManualPlanningTask(**item) for item in data['manual_planning']]
                print(f"[wizard] set {len(state.manual_planning)} manual planning tasks")
                    
        # ---- STEP 8: Travel Costs ----
        elif step == 8:
            if state.travel_costs is None:
                state.travel_costs = TravelCosts()
            for key, value in data.items():
                if hasattr(state.travel_costs, key):
                    setattr(state.travel_costs, key, value)
                    print(f"[wizard] set travel_costs.{key} = {value}")
        else:
            print(f"[wizard] save_step unknown step={step}")

        save_wizard_state(db, session_id, state)
        print(f"[wizard] wizard state saved step={step} session_id={session_id}")
        return {"status": "saved", "step": step}
        
    except Exception as exc:
        print(f"[wizard] Failed to save wizard step={step} session_id={session_id} error={exc}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur de sauvegarde étape {step}: {str(exc)}")


@router.get("/state")
async def get_state(session_id: str = "default", db: Session = Depends(get_db)):
    """Récupère l'état complet du wizard"""
    state = get_wizard_state(db, session_id)
    return state


@router.get("/debug/{session_id}")
async def debug_state(session_id: str = "default", db: Session = Depends(get_db)):
    """Debug : affiche l'état complet du wizard (utile pour le développement)"""
    state = get_wizard_state(db, session_id)
    return {
        "session_id": session_id,
        "current_step": state.current_step,
        "project_info": state.project_info.model_dump() if state.project_info else None,
        "segments": state.segments.model_dump() if state.segments else None,
        "modules": state.modules.model_dump() if state.modules else None,
        "estimations": [e.model_dump() for e in state.estimations] if state.estimations else [],
        "component_coefficients": state.component_coefficients,
        "resources": [r.model_dump() for r in state.resources] if state.resources else [],
        "travel_costs": state.travel_costs.model_dump() if state.travel_costs else None,
        "planning_config": state.planning_config.model_dump() if state.planning_config else None,
        "margin_percentage": state.margin_percentage,
        "risk_factor": state.risk_factor,
        "complexity_factor": state.complexity_factor,
        "ai_boost_factor": state.ai_boost_factor,
    }


@router.post("/reset")
async def reset_state(session_id: str = "default", db: Session = Depends(get_db)):
    """Réinitialise le wizard (supprime toutes les données)"""
    db_session = db.query(WizardSession).filter(WizardSession.session_id == session_id).first()
    if db_session:
        db.delete(db_session)
        db.commit()
        print(f"[wizard] session {session_id} reset")
    return {"status": "reset"}


@router.post("/clear")
async def clear_state(session_id: str = "default", db: Session = Depends(get_db)):
    """Alias pour reset_state"""
    return await reset_state(session_id, db)
