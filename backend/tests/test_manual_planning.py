from models.schemas import PhaseEffort, PlanningConfig, ModuleResult, Resource, WBSTask
from services.estimation_engine import EstimationEngine


def test_wbs_task_defaults():
    task = WBSTask(
        id='T0001',
        name='Analyse',
        segment='sme',
        module='kyc_boarding',
        phase='Pré-cadrage',
        duration_days=3,
        start_date='2026-06-30',
        end_date='2026-07-03',
        dependencies=[],
        onsite_resources=2,
        remote_resources=1,
        total_jh=12.0,
        parent_id=None,
        is_phase=False,
        level=1,
    )

    assert task.name == 'Analyse'
    assert task.duration_days == 3
    assert task.onsite_resources == 2
    assert task.remote_resources == 1


def test_planning_deduplicates_segment_module_pairs():
    engine = EstimationEngine()
    planning = engine._generate_planning(
        module_results_detailed=[
            ModuleResult(
                module='collateral_management',
                total_jh=8,
                phases=[
                    PhaseEffort(phase='prescoping', jh=8, percentage=100),
                ],
            )
        ],
        segments=['sme', 'sme'],
        resources=[
            Resource(role='functional_consultant', count=1, daily_rate=500, allocation=1, profile='senior'),
        ],
        segments_modules={'sme': ['collateral_management', 'collateral_management']},
        config=PlanningConfig(mode='parallel', calendar='standard', start_date='2026-06-30'),
        start_date_str='2026-06-30',
        manual_planning=[],
    )

    phase_tasks = [task for task in planning.tasks if task.is_phase]

    assert len(phase_tasks) == 1
    assert phase_tasks[0].segment == 'sme'
    assert phase_tasks[0].module == 'collateral_management'
