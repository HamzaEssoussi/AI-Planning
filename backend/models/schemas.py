from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============================================================
# STEP 1: PROJECT INFORMATION
# ============================================================
class ProjectInfo(BaseModel):
    client_name: Optional[str] = ""
    region: Optional[str] = ""
    currency: Optional[str] = ""
    project_title: Optional[str] = ""
    project_subtitle: Optional[str] = ""
    document_date: Optional[str] = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    start_date: Optional[str] = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    prepared_by: Optional[str] = ""
    confidentiality: Optional[str] = "Confidential"
    notes: Optional[str] = ""

# ============================================================
# STEP 2: SEGMENTS
# ============================================================
class SegmentSelection(BaseModel):
    segments: Optional[List[str]] = []

# ============================================================
# STEP 3: MODULES
# ============================================================
class ModuleSelection(BaseModel):
    segments_modules: Optional[Dict[str, List[str]]] = {}

# ============================================================
# STEP 4: ASSUMPTIONS
# ============================================================
class ComponentAssumption(BaseModel):
    component: str
    quantity: int = Field(ge=0)
    complexity: str  # low, medium, high

class Component(BaseModel):
    component: str
    quantity: int = Field(ge=0)
    complexity: str  # low, medium, high


class ModuleEstimation(BaseModel):
    module: str
    segment: Optional[str] = ""  # segment this module belongs to
    components: Optional[List[Component]] = []

# ============================================================
# STEP 5: RESOURCES
# ============================================================
class Resource(BaseModel):
    role: str
    count: int = Field(ge=0)
    daily_rate: float = Field(ge=0)
    allocation: float = Field(ge=0, le=1)
    profile: str  # senior, medior, junior

# ============================================================
# STEP 6-8: TRAVEL
# ============================================================
class TravelExpense(BaseModel):
    phase: str
    onsite_resources: int
    start_date: str
    end_date: str

class TravelCosts(BaseModel):
    per_diem: float = 50.0
    hotel_rate: float = 150.0
    flight_cost: float = 500.0
    expenses: Optional[List[TravelExpense]] = []

# ============================================================
# STEP 7: PLANNING CONFIG & MANUAL TASKS
# ============================================================
class PhaseTask(BaseModel):
    id: Optional[str] = ""
    name: str
    duration_days: float = 0.0
    weight: Optional[float] = None
    onsite_resources: int = 0
    remote_resources: int = 0


class ModuleTemplate(BaseModel):
    module: str
    phase_tasks: Dict[str, List[PhaseTask]] = {}


class PlanningConfig(BaseModel):
    mode: str = "sequential"
    calendar: str = "standard"
    start_date: Optional[str] = None
    work_days_per_week: int = 5
    hours_per_day: int = 8
    buffer_days: int = 0

class ManualPlanningTask(BaseModel):
    """Tâche saisie manuellement par l'utilisateur"""
    id: str = ""
    phase: str  # prescoping, scoping, build, testing, go_live, support
    name: str
    segment: str = ""
    module: str = ""
    duration_days: float = 1.0
    start_date: str = ""
    end_date: str = ""
    dependencies: List[str] = []
    onsite_resources: int = 0
    remote_resources: int = 0
    total_jh: float = 0.0
    notes: str = ""

# ============================================================
# PLANNING TASK (WBS) avec hiérarchie
# ============================================================
class WBSTask(BaseModel):
    id: str
    name: str
    segment: str
    module: str
    phase: str
    segment_key: str = ""   # clé brute du segment (ex. "retail"), pour matching côté frontend
    module_key: str = ""    # clé brute du module (ex. "kyc_boarding"), pour matching côté frontend
    duration_days: float
    start_date: str
    end_date: str
    start_date_hijri: Optional[str] = None
    end_date_hijri: Optional[str] = None
    dependencies: List[str] = []
    onsite_resources: int = 0
    remote_resources: int = 0
    total_jh: float = 0.0
    parent_id: Optional[str] = None
    is_phase: bool = False
    level: int = 0

class PlanningResult(BaseModel):
    tasks: List[WBSTask]
    total_jh: float
    total_duration_days: float
    phases_timeline: Dict[str, Any] = {}
    config: PlanningConfig

# ============================================================
# WIZARD STATE
# ============================================================
class WizardState(BaseModel):
    current_step: int = 1
    project_info: Optional[ProjectInfo] = None
    segments: Optional[SegmentSelection] = None
    modules: Optional[ModuleSelection] = None
    estimations: Optional[List[ModuleEstimation]] = None
    component_coefficients: Optional[Dict[str, Dict[str, float]]] = None
    resources: Optional[List[Resource]] = None
    travel_costs: Optional[TravelCosts] = None
    planning_config: Optional[PlanningConfig] = None
    manual_planning: Optional[List[ManualPlanningTask]] = []
    margin_percentage: float = 30.0
    risk_factor: float = 1.0
    complexity_factor: float = 1.0
    ai_boost_factor: float = 1.0

# ============================================================
# ESTIMATION RESULTS
# ============================================================
class PhaseEffort(BaseModel):
    phase: str
    jh: float
    percentage: float

class ModuleResult(BaseModel):
    module: str
    segment: str = ""
    total_jh: float
    phases: List[PhaseEffort]

class EstimationResult(BaseModel):
    modules: List[ModuleResult]
    total_jh: float
    phases: Dict[str, float]
    resources: Dict[str, float]
    total_cost: float
    selling_price: float
    margin: float
    travel_cost: float = 0.0
    total_price: float
    planning: Optional[PlanningResult] = None

class ExportRequest(BaseModel):
    wizard_state: WizardState
    estimation_result: EstimationResult
    formats: Optional[List[str]] = ["xml"]