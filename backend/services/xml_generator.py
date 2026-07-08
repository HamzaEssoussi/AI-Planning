from lxml import etree
from typing import List, Dict
from datetime import datetime, timedelta


class MSProjectXMLGenerator:
    def generate(
        self,
        project_name: str,
        tasks: List[Dict],
        resources: List[str],
        project_start_date: str = None,
    ) -> str:
        root = etree.Element("Project", xmlns="http://schemas.microsoft.com/project")

        etree.SubElement(root, "Name").text = project_name
        start_str = project_start_date or datetime.now().strftime("%Y-%m-%d")
        etree.SubElement(root, "Start").text = f"{start_str}T08:00:00"
        etree.SubElement(root, "MinutesPerDay").text = "480"
        etree.SubElement(root, "MinutesPerWeek").text = "2400"
        etree.SubElement(root, "DaysPerMonth").text = "20"
        etree.SubElement(root, "NewTasksAreManual").text = "0"

        # Calendar
        cal = etree.SubElement(root, "Calendars")
        calendar = etree.SubElement(cal, "Calendar")
        etree.SubElement(calendar, "UID").text = "1"
        etree.SubElement(calendar, "Name").text = "Standard"
        etree.SubElement(calendar, "IsBaseCalendar").text = "1"

        # Resources
        resources_elem = etree.SubElement(root, "Resources")
        for idx, resource in enumerate(resources, 1):
            res = etree.SubElement(resources_elem, "Resource")
            etree.SubElement(res, "UID").text = str(idx)
            etree.SubElement(res, "ID").text = str(idx)
            etree.SubElement(res, "Name").text = resource
            etree.SubElement(res, "Type").text = "1"  # Work resource

        # Tasks
        tasks_elem = etree.SubElement(root, "Tasks")
        start_dt = datetime.strptime(start_str, "%Y-%m-%d")
        current_dt = start_dt

        task_uids = []
        for idx, task in enumerate(tasks, 1):
            task_elem = etree.SubElement(tasks_elem, "Task")
            etree.SubElement(task_elem, "UID").text = str(idx)
            etree.SubElement(task_elem, "ID").text = str(idx)
            etree.SubElement(task_elem, "Name").text = task.get("name", f"Tâche {idx}")

            duration_days = max(1, task.get("duration_days", 5))
            duration_hours = duration_days * 8
            etree.SubElement(task_elem, "Duration").text = f"PT{duration_hours}H0M0S"
            etree.SubElement(task_elem, "DurationFormat").text = "7"
            etree.SubElement(task_elem, "Manual").text = "0"

            etree.SubElement(task_elem, "Start").text = current_dt.strftime("%Y-%m-%dT08:00:00")
            end_dt = _add_working_days(current_dt, duration_days)
            etree.SubElement(task_elem, "Finish").text = end_dt.strftime("%Y-%m-%dT17:00:00")

            # Predecessors
            predecessors = task.get("predecessors", [])
            if predecessors:
                pred_links = etree.SubElement(task_elem, "PredecessorLink")
                for pred_uid in predecessors:
                    etree.SubElement(pred_links, "PredecessorUID").text = str(pred_uid)
                    etree.SubElement(pred_links, "Type").text = "1"  # Finish-to-Start

            task_uids.append({"uid": idx, "resources": task.get("resources", []), "duration_hours": duration_hours})
            current_dt = _add_working_days(current_dt, duration_days)

        # Resource map
        res_map = {name: idx for idx, name in enumerate(resources, 1)}

        # Assignments (lien tâche ↔ ressource)
        assignments_elem = etree.SubElement(root, "Assignments")
        assign_uid = 1
        for task_info in task_uids:
            for res_name in task_info["resources"]:
                res_uid = res_map.get(res_name)
                if res_uid is None:
                    continue
                assign = etree.SubElement(assignments_elem, "Assignment")
                etree.SubElement(assign, "UID").text = str(assign_uid)
                etree.SubElement(assign, "TaskUID").text = str(task_info["uid"])
                etree.SubElement(assign, "ResourceUID").text = str(res_uid)
                etree.SubElement(assign, "Units").text = "1"
                etree.SubElement(assign, "Work").text = f"PT{task_info['duration_hours']}H0M0S"
                assign_uid += 1

        return etree.tostring(
            root, pretty_print=True, encoding="utf-8", xml_declaration=True
        ).decode("utf-8")


def _add_working_days(start: datetime, days: int) -> datetime:
    """Ajoute `days` jours ouvrés (lundi-vendredi) à une date."""
    current = start
    added = 0
    while added < days:
        current += timedelta(days=1)
        if current.weekday() < 5:  # lundi=0 … vendredi=4
            added += 1
    return current