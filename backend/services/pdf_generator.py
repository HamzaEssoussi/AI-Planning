"""Génération de fichiers PDF enrichis — Page de garde, WBS, Gantt, Frais."""
import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from models.schemas import WizardState, EstimationResult

# ── Palette ──────────────────────────────────────────────────────────────────
BLUE_DARK  = colors.HexColor("#1F4E79")
BLUE_MID   = colors.HexColor("#2E86C1")
BLUE_LIGHT = colors.HexColor("#D6E4F0")
BLUE_XL    = colors.HexColor("#EBF5FB")
WHITE      = colors.white
GREY       = colors.HexColor("#F2F3F4")
GOLD       = colors.HexColor("#D4AC0D")
GREEN      = colors.HexColor("#1E8449")

PHASE_COLORS = {
    'Pré-cadrage':        colors.HexColor("#5DADE2"),
    'Cadrage':            colors.HexColor("#2E86C1"),
    'Développement':      colors.HexColor("#1F4E79"),
    'Tests':              colors.HexColor("#148F77"),
    'Mise en Production': colors.HexColor("#1E8449"),
    'Support':            colors.HexColor("#D4AC0D"),
}

PHASE_ORDER = ['Pré-cadrage', 'Cadrage', 'Développement', 'Tests', 'Mise en Production', 'Support']


class PDFGenerator:
    def generate(
        self,
        project_name: str,
        wizard_state: WizardState,
        estimation_result: EstimationResult,
    ) -> bytes:
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            rightMargin=2*cm, leftMargin=2*cm,
            topMargin=2*cm,  bottomMargin=2*cm,
        )

        styles = getSampleStyleSheet()
        story  = []

        story += self._cover_page(project_name, wizard_state, styles)
        story.append(PageBreak())

        story += self._kpi_section(wizard_state, estimation_result, styles)
        story.append(PageBreak())

        story += self._wbs_section(estimation_result, wizard_state, styles)
        story.append(PageBreak())

        story += self._gantt_section(estimation_result, styles)
        story.append(PageBreak())

        story += self._travel_section(wizard_state, estimation_result, styles)

        doc.build(story)
        return buf.getvalue()

    def _styles(self, styles):
        title_s = ParagraphStyle("PTitle", parent=styles["Title"],
                                 fontSize=24, textColor=WHITE,
                                 alignment=TA_CENTER, spaceAfter=6)
        sub_s   = ParagraphStyle("PSub",   parent=styles["Normal"],
                                 fontSize=13, textColor=BLUE_LIGHT,
                                 alignment=TA_CENTER, spaceAfter=4)
        h2_s    = ParagraphStyle("PH2",    parent=styles["Heading2"],
                                 fontSize=13, textColor=BLUE_MID,
                                 spaceBefore=10, spaceAfter=4)
        h3_s    = ParagraphStyle("PH3",    parent=styles["Heading3"],
                                 fontSize=11, textColor=BLUE_DARK,
                                 spaceBefore=6, spaceAfter=3)
        normal  = styles["Normal"]
        small   = ParagraphStyle("PSmall", parent=normal, fontSize=8,
                                 textColor=colors.grey)
        return title_s, sub_s, h2_s, h3_s, normal, small

    def _cover_page(self, project_name, wizard_state, styles):
        title_s, sub_s, h2_s, h3_s, normal, small = self._styles(styles)
        info = wizard_state.project_info
        story = []

        banner_data = [[Paragraph(f"AI Planning", title_s)]]
        banner = Table(banner_data, colWidths=[17*cm])
        banner.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), BLUE_DARK),
            ("TOPPADDING",    (0,0), (-1,-1), 30),
            ("BOTTOMPADDING", (0,0), (-1,-1), 30),
        ]))
        story.append(banner)
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph(project_name, ParagraphStyle("CoverTitle",
            parent=styles["Title"], fontSize=20, textColor=BLUE_DARK,
            alignment=TA_CENTER, spaceBefore=10, spaceAfter=6)))
        if info and info.project_subtitle:
            story.append(Paragraph(info.project_subtitle, ParagraphStyle("CoverSub",
                parent=styles["Normal"], fontSize=13, textColor=BLUE_MID,
                alignment=TA_CENTER, spaceAfter=10)))

        story.append(HRFlowable(width="100%", thickness=2, color=BLUE_MID, spaceAfter=20))
        story.append(Spacer(1, 0.5*cm))

        if info:
            rows = [
                ["Client",          info.client_name or "-"],
                ["Région",          info.region or "-"],
                ["Devise",          info.currency or "-"],
                ["Date de début",   info.start_date or "-"],
                ["Date du document",info.document_date or "-"],
                ["Préparé par",     info.prepared_by or "-"],
                ["Confidentialité", info.confidentiality or "-"],
            ]
            if info.notes:
                rows.append(["Notes", info.notes])
        else:
            rows = [["—", "—"]]

        t = Table([[Paragraph(f"<b>{k}</b>", normal), Paragraph(v, normal)]
                   for k, v in rows],
                  colWidths=[5*cm, 11*cm])
        t.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (0,-1), BLUE_LIGHT),
            ("ROWBACKGROUNDS",(1,0), (1,-1), [WHITE, BLUE_XL]),
            ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#BDC3C7")),
            ("TOPPADDING",    (0,0), (-1,-1), 6),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ]))
        story.append(t)

        story.append(Spacer(1, 1.5*cm))
        story.append(HRFlowable(width="100%", thickness=1, color=BLUE_LIGHT))
        story.append(Paragraph(
            f"Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} — AI Planning",
            ParagraphStyle("Footer", parent=normal, fontSize=8,
                           textColor=colors.grey, alignment=TA_CENTER)))
        return story

    def _kpi_section(self, wizard_state, estimation_result, styles):
        _, _, h2_s, _, normal, _ = self._styles(styles)
        story = [Paragraph("Indicateurs Clés", h2_s)]
        cur = self._currency(wizard_state)
        kpi_data = [
            ["Indicateur", "Valeur"],
            ["Total Jours-Homme (JH)", f"{estimation_result.total_jh:.1f} JH"],
            ["Coût Total", f"{estimation_result.total_cost:,.0f} {cur}"],
            [f"Marge ({wizard_state.margin_percentage:.0f}%)", f"{estimation_result.margin:,.0f} {cur}"],
            ["Prix de Vente", f"{estimation_result.selling_price:,.0f} {cur}"],
            ["Frais de Déplacement", f"{estimation_result.travel_cost:,.0f} {cur}"],
            ["PRIX TOTAL", f"{estimation_result.total_price:,.0f} {cur}"],
        ]
        story.append(self._table(kpi_data, col_widths=[10*cm, 6*cm], header=True, total_last=True))
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph("Distribution par Phase", h2_s))
        total_jh = estimation_result.total_jh or 1
        phase_data = [["Phase", "JH", "% Total"]]
        for phase, jh in estimation_result.phases.items():
            phase_data.append([phase, f"{jh:.1f}", f"{jh/total_jh*100:.1f}%"])
        story.append(self._table(phase_data, col_widths=[8*cm, 4*cm, 4*cm], header=True))
        return story

    def _wbs_section(self, estimation_result, wizard_state, styles):
        _, _, h2_s, h3_s, normal, small = self._styles(styles)
        story = [Paragraph("Planning Détaillé — WBS (Segment → Module → Phase → Tâche)", h2_s)]

        planning = estimation_result.planning
        if not planning or not planning.tasks:
            story.append(Paragraph("Aucun planning calculé.", normal))
            return story

        # Grouper par Segment → Module → Phase
        grouped: dict = {}
        for task in planning.tasks:
            seg = task.segment
            mod = task.module
            ph  = task.phase
            grouped.setdefault(seg, {}).setdefault(mod, {}).setdefault(ph, []).append(task)

        cal = planning.config.calendar == "islamic"

        for seg, modules in grouped.items():
            story.append(Paragraph(f"▌ Segment : {seg}", ParagraphStyle("SegTitle",
                parent=normal, fontSize=12, textColor=WHITE,
                backColor=BLUE_DARK, leftIndent=0, spaceBefore=8, spaceAfter=4,
                leading=18)))

            for mod, phases in modules.items():
                story.append(Paragraph(f"  ◆ Module : {mod}", ParagraphStyle("ModTitle",
                    parent=normal, fontSize=11, textColor=BLUE_DARK,
                    backColor=BLUE_LIGHT, leftIndent=10, spaceBefore=4, spaceAfter=2,
                    leading=16)))

                for ph, tasks in phases.items():
                    ph_color = PHASE_COLORS.get(ph, BLUE_MID)
                    story.append(Paragraph(f"    ● Phase : {ph}", ParagraphStyle("PhTitle",
                        parent=normal, fontSize=10, textColor=ph_color,
                        leftIndent=20, spaceBefore=3, spaceAfter=2)))

                    if cal:
                        headers = ["Tâche", "Durée (j)", "Début (G)", "Début (H)", "Fin (G)", "Fin (H)", "Sur site", "À dist.", "JH"]
                        col_w = [5*cm, 1.5*cm, 2.2*cm, 2.2*cm, 2.2*cm, 2.2*cm, 1.2*cm, 1.2*cm, 1.2*cm]
                    else:
                        headers = ["Tâche", "Durée (j)", "Date Début", "Date Fin", "Sur site", "À dist.", "JH"]
                        col_w = [6*cm, 1.8*cm, 2.5*cm, 2.5*cm, 1.5*cm, 1.5*cm, 1.5*cm]

                    rows = [headers]
                    for t in tasks:
                        if cal:
                            rows.append([
                                t.name, str(t.duration_days),
                                t.start_date, t.start_date_hijri or "-",
                                t.end_date,   t.end_date_hijri or "-",
                                str(t.onsite_resources), str(t.remote_resources),
                                str(t.total_jh),
                            ])
                        else:
                            rows.append([
                                t.name, str(t.duration_days),
                                t.start_date, t.end_date,
                                str(t.onsite_resources), str(t.remote_resources),
                                str(t.total_jh),
                            ])

                    story.append(self._table(rows, col_widths=col_w, header=True))
                    story.append(Spacer(1, 0.2*cm))

        return story

    def _gantt_section(self, estimation_result, styles):
        _, _, h2_s, _, normal, small = self._styles(styles)
        story = [Paragraph("Diagramme de Gantt — Vue par Phase", h2_s)]

        planning = estimation_result.planning
        if not planning or not planning.phases_timeline:
            story.append(Paragraph("Aucun planning calculé.", normal))
            return story

        story.append(Paragraph(
            f"Mode : {'Parallèle' if planning.config.mode == 'parallel' else 'Séquentiel'} | "
            f"Durée totale : {planning.total_duration_days} jours | "
            f"Total JH : {planning.total_jh:.1f}",
            ParagraphStyle("GanttInfo", parent=normal, fontSize=9, textColor=BLUE_MID, spaceAfter=6)
        ))

        if planning.tasks:
            try:
                all_starts = [datetime.strptime(t.start_date, "%Y-%m-%d") for t in planning.tasks]
                all_ends   = [datetime.strptime(t.end_date,   "%Y-%m-%d") for t in planning.tasks]
                proj_start = min(all_starts)
                proj_end   = max(all_ends)
                total_span = max(1, (proj_end - proj_start).days)
            except Exception:
                total_span = 1
                proj_start = datetime.now()
        else:
            total_span = 1
            proj_start = datetime.now()

        BAR_WIDTH = 14*cm
        for phase_name in PHASE_ORDER:
            ph_data = planning.phases_timeline.get(phase_name)
            if not ph_data:
                continue
            try:
                ph_start = datetime.strptime(ph_data["start"], "%Y-%m-%d")
                ph_end   = datetime.strptime(ph_data["end"],   "%Y-%m-%d")
                offset = (ph_start - proj_start).days / total_span
                width  = max(0.02, (ph_end - ph_start).days / total_span)
            except Exception:
                offset, width = 0, 0.1

            bar_color  = PHASE_COLORS.get(phase_name, BLUE_MID)
            empty_left = offset * BAR_WIDTH
            bar_w      = width  * BAR_WIDTH
            empty_right= BAR_WIDTH - empty_left - bar_w

            bar_row = [[
                "",
                Paragraph(f"<b><font color='white'>{phase_name}</font></b>",
                          ParagraphStyle("BarLabel", parent=normal, fontSize=8,
                                         alignment=TA_CENTER)),
                "",
            ]]
            col_ws = [max(0.01*cm, empty_left), max(0.5*cm, bar_w), max(0.01*cm, empty_right)]
            bar_t = Table(bar_row, colWidths=col_ws)
            bar_t.setStyle(TableStyle([
                ("BACKGROUND", (1,0), (1,0), bar_color),
                ("TOPPADDING",    (0,0), (-1,-1), 5),
                ("BOTTOMPADDING", (0,0), (-1,-1), 5),
                ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
            ]))

            label_jh = f"{ph_data.get('jh', 0):.1f} JH | {ph_data['start']} → {ph_data['end']}"
            story.append(KeepTogether([
                Paragraph(f"<b>{phase_name}</b> — {label_jh}",
                          ParagraphStyle("PhLabel", parent=normal, fontSize=9,
                                         textColor=bar_color, spaceBefore=4)),
                bar_t,
                Spacer(1, 0.15*cm),
            ]))

        return story

    def _travel_section(self, wizard_state, estimation_result, styles):
        _, _, h2_s, _, normal, small = self._styles(styles)
        story = [Paragraph("Frais de Déplacement", h2_s)]

        travel = wizard_state.travel_costs
        if not travel or not travel.expenses:
            story.append(Paragraph("Aucun frais de déplacement renseigné.", normal))
            return story

        cur = self._currency(wizard_state)
        story.append(Paragraph(
            f"Per diem : {travel.per_diem} {cur}/j | Hôtel : {travel.hotel_rate} {cur}/nuit | Vol A/R : {travel.flight_cost} {cur}",
            ParagraphStyle("TravelInfo", parent=normal, fontSize=9, textColor=BLUE_MID, spaceAfter=6)
        ))

        headers = ["Phase", "Ressources", "Jours", "Per Diem", "Hôtel", "Vol", "Total Phase"]
        rows    = [headers]
        grand_total = 0.0

        for exp in travel.expenses:
            try:
                start = datetime.strptime(exp.start_date, "%Y-%m-%d")
                end   = datetime.strptime(exp.end_date,   "%Y-%m-%d")
                days  = max(1, (end - start).days)
            except Exception:
                days = 1
            n         = exp.onsite_resources
            per_diem  = days * travel.per_diem * n
            hotel     = days * travel.hotel_rate * n
            flight    = travel.flight_cost * n
            total_ph  = per_diem + hotel + flight
            grand_total += total_ph

            rows.append([
                exp.phase, str(n), str(days),
                f"{per_diem:,.0f}", f"{hotel:,.0f}", f"{flight:,.0f}",
                f"{total_ph:,.0f} {cur}",
            ])

        rows.append(["TOTAL", "", "", "", "", "", f"{grand_total:,.0f} {cur}"])
        story.append(self._table(rows, col_widths=[3.5*cm, 2*cm, 1.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 3*cm],
                            header=True, total_last=True))
        return story

    def _currency(self, wizard_state: WizardState) -> str:
        if wizard_state.project_info:
            return wizard_state.project_info.currency
        return ""

    def _table(self, data, col_widths=None, header=False, total_last=False):
        style = [
            ("BACKGROUND",    (0,0), (-1,0),  BLUE_DARK if header else BLUE_LIGHT),
            ("TEXTCOLOR",     (0,0), (-1,0),  WHITE if header else colors.black),
            ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
            ("FONTSIZE",      (0,0), (-1,-1), 8),
            ("ALIGN",         (0,0), (-1,-1), "LEFT"),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
            ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, BLUE_XL]),
            ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#BDC3C7")),
            ("TOPPADDING",    (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("LEFTPADDING",   (0,0), (-1,-1), 5),
        ]
        if total_last and len(data) > 1:
            last = len(data) - 1
            style += [
                ("BACKGROUND", (0, last), (-1, last), BLUE_DARK),
                ("TEXTCOLOR",  (0, last), (-1, last), WHITE),
                ("FONTNAME",   (0, last), (-1, last), "Helvetica-Bold"),
            ]
        t = Table(data, colWidths=col_widths)
        t.setStyle(TableStyle(style))
        return t