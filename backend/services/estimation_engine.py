"""Moteur de calcul des estimations — formules §8.1 à §8.9."""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from core.constants import (
    COMPLEXITY_COEFFICIENTS, PHASE_DISTRIBUTION,
    SEGMENT_WEIGHTS, ROLE_DISTRIBUTION,
    PHASE_TASK_TEMPLATES, PHASE_LABELS
)
from models.schemas import (
    ModuleEstimation, Resource, EstimationResult, PhaseEffort, ModuleResult,
    TravelCosts, PlanningConfig, PlanningResult, WBSTask, ManualPlanningTask
)

try:
    from hijri_converter import Gregorian
    HIJRI_AVAILABLE = True
except ImportError:
    HIJRI_AVAILABLE = False

SEGMENT_LABELS = {
    'retail': 'Retail',
    'sme': 'PME',
    'corporate': 'Corporate',
    'fi': 'FI',
}

MODULE_LABELS = {
    'kyc_boarding': 'KYC & Onboarding',
    'loan_origination': 'Loan Origination',
    'scoring': 'Scoring',
    'underwriting_approval': 'Underwriting & Approval',
    'limit_management': 'Limit Management',
    'collateral_management': 'Collateral Management',
    'loan_servicing': 'Loan Servicing',
    'collection_provisioning': 'Collection & Provisioning',
    'early_warning': 'Early Warning System',
    'ai_lending': 'AI-Powered Lending',
    'omnichannel': 'Omnichannel',
    'bi_reporting': 'BI & Reporting',
}


def _to_hijri(date_obj: datetime) -> str:
    """Convertit une date grégorienne en date Hijri."""
    if not HIJRI_AVAILABLE:
        return ""
    try:
        h = Gregorian(date_obj.year, date_obj.month, date_obj.day).to_hijri()
        return f"{h.day}/{h.month}/{h.year} H"
    except Exception:
        return ""


class EstimationEngine:
    def __init__(self):
        self.coefficients = COMPLEXITY_COEFFICIENTS
        self.phase_distribution = PHASE_DISTRIBUTION
        self.segment_weights = SEGMENT_WEIGHTS
        self.role_distribution = ROLE_DISTRIBUTION
        self.phase_templates = PHASE_TASK_TEMPLATES
        self.phase_labels = PHASE_LABELS

    # ------------------------------------------------------------------
    # §8.1 + §8.2 : Calcul JH d'un module
    # ------------------------------------------------------------------
    def calculate_module_jh(self, module_est: ModuleEstimation, segment_weight: float = 1.0, coefficients: Optional[Dict[str, Dict[str, float]]] = None) -> Dict:
        coeffs = coefficients if coefficients is not None else self.coefficients
        total_jh = 0.0
        for comp in module_est.components:
            coeff = coeffs.get(comp.component, {}).get(comp.complexity, 0)
            effort = comp.quantity * coeff
            total_jh += effort
        total_jh *= segment_weight
        return {'module': module_est.module, 'segment': getattr(module_est, 'segment', ''), 'total_jh': total_jh}

    # ------------------------------------------------------------------
    # §8.3 : Répartition des efforts par phase
    # ------------------------------------------------------------------
    def distribute_phases(self, module_jh: float) -> Dict[str, float]:
        return {phase: module_jh * pct for phase, pct in self.phase_distribution.items()}

    def calculate_phases(self, modules_results: List[Dict]) -> Dict[str, float]:
        total_phases = {phase: 0.0 for phase in self.phase_distribution.keys()}
        for module in modules_results:
            for phase, jh in self.distribute_phases(module['total_jh']).items():
                total_phases[phase] += jh
        return total_phases

    # ------------------------------------------------------------------
    # §8.4 : Répartition par rôle
    # ------------------------------------------------------------------
    def calculate_resources(self, phases: Dict[str, float]) -> Dict[str, float]:
        total_jh = sum(phases.values())
        return {role: total_jh * pct for role, pct in self.role_distribution.items()}

    # ------------------------------------------------------------------
    # §8.5 : Calcul du coût
    # ------------------------------------------------------------------
    def calculate_costs(self, resources_jh: Dict[str, float], resource_list: List[Resource]) -> Dict:
        role_map = {r.role: r for r in resource_list}
        costs = {}
        total_cost = 0.0
        for role, jh in resources_jh.items():
            if role in role_map:
                res = role_map[role]
                cost = jh * res.daily_rate * res.allocation
                costs[role] = cost
                total_cost += cost
        return {'costs': costs, 'total_cost': total_cost}

    # ------------------------------------------------------------------
    # §8.7 : Calcul des frais de déplacement
    # ------------------------------------------------------------------
    def calculate_travel_costs(self, travel: Optional[TravelCosts]) -> float:
        if not travel or not travel.expenses:
            return 0.0
        total = 0.0
        for exp in travel.expenses:
            try:
                start = datetime.strptime(exp.start_date, "%Y-%m-%d")
                end = datetime.strptime(exp.end_date, "%Y-%m-%d")
                days = max(1, (end - start).days)
            except Exception:
                days = 1
            n = exp.onsite_resources
            per_diem_cost = days * travel.per_diem * n
            hotel_cost = days * travel.hotel_rate * n
            flight_cost = travel.flight_cost * n
            total += per_diem_cost + hotel_cost + flight_cost
        return total

    # ------------------------------------------------------------------
    # §8.9 + §8.6 : Calcul principal avec ajustements
    # ------------------------------------------------------------------
    def calculate_estimation(
        self,
        estimations: List[ModuleEstimation],
        segments: List[str],
        resources: List[Resource],
        margin_percentage: float = 30.0,
        risk_factor: float = 1.0,
        complexity_factor: float = 1.0,
        ai_boost_factor: float = 1.0,
        travel_costs: Optional[TravelCosts] = None,
        planning_config: Optional[PlanningConfig] = None,
        project_start_date: Optional[str] = None,
        segments_modules: Optional[Dict] = None,
        manual_planning: Optional[List[ManualPlanningTask]] = None,
        component_coefficients: Optional[Dict[str, Dict[str, float]]] = None,
    ) -> EstimationResult:

        avg_weight = (
            sum(self.segment_weights.get(s, 1.0) for s in segments) / len(segments)
            if segments else 1.0
        )

        module_results = []
        coefficients = component_coefficients if component_coefficients is not None else self.coefficients
        for est in estimations:
            # Prefer per-module segment weight if provided
            seg = getattr(est, 'segment', None)
            if seg:
                seg_weight = self.segment_weights.get(seg, avg_weight)
            else:
                seg_weight = avg_weight
            module_results.append(self.calculate_module_jh(est, seg_weight, coefficients))

        total_phases = self.calculate_phases(module_results)
        total_jh_raw = sum(total_phases.values())

        adjusted_jh = total_jh_raw * risk_factor * complexity_factor * ai_boost_factor
        ratio = adjusted_jh / total_jh_raw if total_jh_raw > 0 else 1.0
        adjusted_phases = {phase: jh * ratio for phase, jh in total_phases.items()}

        resources_jh = self.calculate_resources(adjusted_phases)
        cost_result = self.calculate_costs(resources_jh, resources)
        total_cost = cost_result['total_cost']

        rate = margin_percentage / 100
        if rate < 1:
            selling_price = total_cost / (1 - rate)
        else:
            selling_price = total_cost * 2
        margin = selling_price - total_cost

        travel_cost = self.calculate_travel_costs(travel_costs)
        total_price = selling_price + travel_cost

        module_results_detailed = []
        for mr in module_results:
            phases_detail = []
            raw_phases = self.distribute_phases(mr['total_jh'])
            for phase, jh_raw in raw_phases.items():
                jh_adj = jh_raw * ratio
                pct = (jh_adj / adjusted_jh * 100) if adjusted_jh > 0 else 0
                phases_detail.append(PhaseEffort(phase=phase, jh=jh_adj, percentage=pct))
            module_results_detailed.append(
                ModuleResult(module=mr['module'], segment=mr.get('segment', ''), total_jh=mr['total_jh'] * ratio, phases=phases_detail)
            )

        # Génération du WBS / Planning
        planning = None
        if planning_config or project_start_date:
            cfg = planning_config or PlanningConfig()
            start_str = project_start_date or (
                cfg.start_date or datetime.now().strftime("%Y-%m-%d")
            )
            planning = self._generate_planning(
                module_results_detailed=module_results_detailed,
                segments=segments,
                resources=resources,
                segments_modules=segments_modules or {},
                config=cfg,
                start_date_str=start_str,
                manual_planning=manual_planning or [],
            )

        return EstimationResult(
            modules=module_results_detailed,
            total_jh=adjusted_jh,
            phases=adjusted_phases,
            resources=resources_jh,
            total_cost=total_cost,
            selling_price=selling_price,
            margin=margin,
            travel_cost=travel_cost,
            total_price=total_price,
            planning=planning,
        )

    # ------------------------------------------------------------------
    # Tri topologique des tâches manuelles
    # ------------------------------------------------------------------
    def _topological_sort_manual_tasks(
        self, tasks: List[ManualPlanningTask]
    ) -> List[ManualPlanningTask]:
        """Ordonne les tâches saisies manuellement en respectant leurs prédécesseurs."""
        by_id = {t.id: t for t in tasks if t.id}
        if not by_id:
            return tasks

        visited: Dict[str, int] = {}
        ordered: List[ManualPlanningTask] = []

        def visit(task: ManualPlanningTask, stack: set):
            if task.id in visited:
                return
            if task.id in stack:
                return
            stack.add(task.id)
            for dep_id in task.dependencies or []:
                dep_task = by_id.get(dep_id)
                if dep_task:
                    visit(dep_task, stack)
            stack.discard(task.id)
            visited[task.id] = 1
            ordered.append(task)

        for t in tasks:
            visit(t, set())

        return ordered

    # ------------------------------------------------------------------
    # ✅ GÉNÉRATION DU PLANNING CORRIGÉE (SANS DUPLICATION)
    # ------------------------------------------------------------------
    def _generate_planning(
        self,
        module_results_detailed: List[ModuleResult],
        segments: List[str],
        resources: List[Resource],
        segments_modules: Dict,
        config: PlanningConfig,
        start_date_str: str,
        manual_planning: Optional[List[ManualPlanningTask]] = None,
    ) -> PlanningResult:

        total_resources = max(1, sum(r.count for r in resources)) if resources else 1
        use_islamic = config.calendar == "islamic"

        try:
            project_start = datetime.strptime(start_date_str, "%Y-%m-%d")
        except Exception:
            project_start = datetime.now()

        tasks: List[WBSTask] = []
        task_id = 0
        phases_order = list(self.phase_distribution.keys())

        # Récupérer les segments et modules pour les métadonnées
        all_segments = segments or ["Tous segments"]
        all_modules = list(set(
            mod for mods in segments_modules.values() for mod in mods
        )) or ["Tous modules"]
        
        segment_labels = [SEGMENT_LABELS.get(s, s) for s in all_segments]
        module_labels = [MODULE_LABELS.get(m, m) for m in all_modules]
        segments_str = ", ".join(segment_labels)
        modules_str = ", ".join(module_labels)

        # ✅ Étape 1 : Tâches manuelles regroupées par phase
        manual_tasks_by_phase: Dict[str, List[ManualPlanningTask]] = {}
        for item in manual_planning or []:
            if item.name.strip():
                manual_tasks_by_phase.setdefault(item.phase, []).append(item)

        # Ordre des couples (segment, module) : celui défini aux étapes Segments/Modules,
        # complété par tout couple présent dans les tâches manuelles mais absent de cet ordre.
        group_order: List[tuple] = []
        seen_groups = set()
        for seg in (segments or []):
            for mod in segments_modules.get(seg, []):
                key = (seg, mod)
                if key not in seen_groups:
                    seen_groups.add(key)
                    group_order.append(key)
        for item in manual_planning or []:
            key = (item.segment or "", item.module or "")
            if key not in seen_groups:
                seen_groups.add(key)
                group_order.append(key)

        def _group_label(seg_val: str, mod_val: str):
            seg_disp = SEGMENT_LABELS.get(seg_val, seg_val) if seg_val else segments_str
            mod_disp = MODULE_LABELS.get(mod_val, mod_val) if mod_val else modules_str
            return seg_disp, mod_disp

        def _duration_days(a: datetime, b: datetime) -> float:
            return max(0.5, (b - a).total_seconds() / 86400)

        # ✅ Étape 3 : Génération des phases et de leurs sous-tâches
        previous_phase_id = None
        current_phase_date = project_start  # curseur pour le chaînage séquentiel des phases

        for phase in phases_order:
            phase_label = self.phase_labels.get(phase, phase)
            phase_manual_tasks = manual_tasks_by_phase.get(phase, [])

            if not phase_manual_tasks:
                # ✅ Aucune tâche saisie pour cette phase : on ne génère RIEN
                # (ni ligne de phase, ni sous-tâche). La phase est simplement absente
                # du planning tant que l'utilisateur n'y a pas ajouté de tâche.
                continue

            # Mode "parallel" : toutes les phases démarrent au début du projet.
            # Mode "sequential" : chaque phase démarre à la fin réelle de la
            # précédente phase effectivement générée.
            phase_start = project_start if config.mode == "parallel" else current_phase_date

            task_id += 1
            phase_task_id = f"T{task_id:04d}"
            deps = [previous_phase_id] if previous_phase_id and config.mode != "parallel" else []

            subtasks: List[WBSTask] = []

            # ✅ Regroupement par (segment, module), dans l'ordre défini par l'utilisateur
            groups: Dict[tuple, List[ManualPlanningTask]] = {}
            for t in phase_manual_tasks:
                key = (t.segment or "", t.module or "")
                groups.setdefault(key, []).append(t)
            ordered_group_keys = [k for k in group_order if k in groups] + \
                [k for k in groups if k not in group_order]

            # Le mode Séquentiel/Parallèle du planning s'applique aussi entre
            # segments/modules : en parallèle, chaque groupe démarre en même temps
            # que la phase ; en séquentiel, les groupes s'enchaînent l'un après l'autre.
            group_start_map: Dict[tuple, datetime] = {}
            if config.mode == "parallel":
                for gkey in ordered_group_keys:
                    group_start_map[gkey] = phase_start
            else:
                g_cursor = phase_start
                for gkey in ordered_group_keys:
                    group_start_map[gkey] = g_cursor
                    g_duration = sum(max(0.1, t.duration_days) for t in groups[gkey])
                    g_cursor = g_cursor + timedelta(days=g_duration)

            group_end_dates: List[datetime] = []
            manual_id_to_subtask_id: Dict[str, str] = {}

            for gkey in ordered_group_keys:
                seg_val, mod_val = gkey
                seg_disp, mod_disp = _group_label(seg_val, mod_val)
                ordered_tasks = self._topological_sort_manual_tasks(groups[gkey])
                current_date = group_start_map[gkey]

                for t in ordered_tasks:
                    # ✅ La durée saisie par l'utilisateur est utilisée telle quelle
                    duration = max(0.1, t.duration_days)
                    t_end = current_date + timedelta(days=duration)
                    task_id += 1
                    subtask_id = f"T{task_id:04d}"

                    manual_deps = t.dependencies or []
                    resolved_deps = [
                        manual_id_to_subtask_id[d] for d in manual_deps if d in manual_id_to_subtask_id
                    ]
                    task_dependencies = resolved_deps if resolved_deps else [phase_task_id]

                    # ✅ JH = jours saisis × ressources assignées à la tâche
                    assigned_resources = (t.onsite_resources or 0) + (t.remote_resources or 0)
                    if assigned_resources <= 0:
                        assigned_resources = total_resources

                    subtasks.append(WBSTask(
                        id=subtask_id,
                        name=t.name,
                        segment=seg_disp,
                        module=mod_disp,
                        phase=phase_label,
                        segment_key=seg_val,
                        module_key=mod_val,
                        duration_days=round(duration, 1),
                        start_date=current_date.strftime("%Y-%m-%d"),
                        end_date=t_end.strftime("%Y-%m-%d"),
                        start_date_hijri=_to_hijri(current_date) if use_islamic else None,
                        end_date_hijri=_to_hijri(t_end) if use_islamic else None,
                        dependencies=task_dependencies,
                        onsite_resources=t.onsite_resources or 0,
                        remote_resources=t.remote_resources or 0,
                        total_jh=round(duration * assigned_resources * 8, 2),
                        parent_id=phase_task_id,
                        is_phase=False,
                        level=1
                    ))

                    if t.id:
                        manual_id_to_subtask_id[t.id] = subtask_id
                    current_date = t_end

                group_end_dates.append(current_date)

            phase_end = max(group_end_dates) if group_end_dates else phase_start + timedelta(days=0.5)
            phase_jh = round(sum(s.total_jh for s in subtasks), 2)

            tasks.append(WBSTask(
                id=phase_task_id,
                name=phase_label,
                segment=segments_str,
                module=modules_str,
                phase=phase_label,
                duration_days=round(_duration_days(phase_start, phase_end), 1),
                start_date=phase_start.strftime("%Y-%m-%d"),
                end_date=phase_end.strftime("%Y-%m-%d"),
                start_date_hijri=_to_hijri(phase_start) if use_islamic else None,
                end_date_hijri=_to_hijri(phase_end) if use_islamic else None,
                dependencies=deps,
                onsite_resources=total_resources,
                remote_resources=0,
                total_jh=phase_jh,
                parent_id=None,
                is_phase=True,
                level=0
            ))
            tasks.extend(subtasks)

            previous_phase_id = phase_task_id
            if config.mode != "parallel":
                current_phase_date = phase_end

        # ✅ Étape 4 : Statistiques globales
        total_jh = sum(t.total_jh for t in tasks if t.is_phase)

        if tasks:
            overall_end = max(
                (datetime.strptime(t.end_date, "%Y-%m-%d") for t in tasks if t.end_date),
                default=project_start
            )
        else:
            overall_end = project_start

        total_days = max(0, (overall_end - project_start).days)

        # ✅ Étape 5 : Frise des phases (basée sur les dates réellement calculées)
        phases_timeline: Dict = {}
        for t in tasks:
            if t.is_phase:
                phases_timeline[t.phase] = {
                    "start": t.start_date,
                    "end": t.end_date,
                    "jh": t.total_jh,
                    "subtasks": [s for s in tasks if s.parent_id == t.id],
                    "segments": segment_labels,
                    "modules": module_labels,
                }

        return PlanningResult(
            tasks=tasks,
            total_jh=round(total_jh, 2),
            total_duration_days=total_days,
            phases_timeline=phases_timeline,
            config=config,
        )