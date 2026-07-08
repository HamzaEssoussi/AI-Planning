"""Constants pour AI Planning"""

# ============================================================
# COMPLEXITY COEFFICIENTS
# ============================================================
COMPLEXITY_COEFFICIENTS = {
    'workflow': {'low': 3, 'medium': 5, 'high': 8},
    'document': {'low': 1, 'medium': 2, 'high': 3},
    'interface': {'low': 2, 'medium': 4, 'high': 7},
    'report': {'low': 1, 'medium': 2, 'high': 4},
    'alert': {'low': 0.5, 'medium': 1, 'high': 2},
    'bi_dashboard': {'low': 2, 'medium': 4, 'high': 6},
    'ocr': {'low': 2, 'medium': 5, 'high': 9},
    'ai_writeups': {'low': 3, 'medium': 6, 'high': 10}
}

# ============================================================
# PHASE DISTRIBUTION
# ============================================================
PHASE_DISTRIBUTION = {
    'prescoping': 0.05,
    'scoping': 0.10,
    'build': 0.50,
    'testing': 0.20,
    'go_live': 0.10,
    'support': 0.05
}

# ============================================================
# PHASE TASK TEMPLATES
# ============================================================
# Les sous-tâches WBS ne sont pas codées en dur : elles sont saisies
# manuellement dans l'écran Planning et sauvegardées dans manual_planning.
PHASE_TASK_TEMPLATES = {}

# ============================================================
# PHASE LABELS
# ============================================================
PHASE_LABELS = {
    'prescoping': 'Pré-cadrage',
    'scoping': 'Cadrage',
    'build': 'Développement',
    'testing': 'Tests',
    'go_live': 'Mise en Production',
    'support': 'Support',
}

# ============================================================
# SEGMENT WEIGHTS
# ============================================================
SEGMENT_WEIGHTS = {
    'retail': 1.0,
    'sme': 1.1,
    'corporate': 1.3,
    'fi': 1.2
}

# ============================================================
# ROLE DISTRIBUTION
# ============================================================
ROLE_DISTRIBUTION = {
    'project_manager': 0.10,
    'functional_consultant': 0.25,
    'integration_consultant': 0.20,
    'qa_tester': 0.15,
    'devops': 0.10,
    'data_bi_engineer': 0.10,
    'ai_engineer': 0.10
}

# ============================================================
# SEGMENT LABELS
# ============================================================
SEGMENT_LABELS = {
    'retail': 'Retail',
    'sme': 'PME',
    'corporate': 'Corporate',
    'fi': 'FI',
}

# ============================================================
# MODULE LABELS
# ============================================================
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

# ============================================================
# SEGMENTS & MODULES (pour l'interface)
# ============================================================
SEGMENTS = {
    'retail': 'Retail Banking',
    'sme': 'SME Banking',
    'corporate': 'Corporate Banking',
    'fi': 'Financial Institutions'
}

MODULES = {
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
    'bi_reporting': 'BI & Reporting'
}

# ============================================================
# SEGMENT-MODULE MAPPING
# ============================================================
MODULE_SEGMENT_MAPPING = {
    'kyc_boarding': ['retail', 'sme', 'corporate', 'fi'],
    'loan_origination': ['retail', 'sme', 'corporate', 'fi'],
    'scoring': ['retail', 'sme', 'corporate', 'fi'],
    'underwriting_approval': ['retail', 'sme', 'corporate', 'fi'],
    'limit_management': ['retail', 'sme', 'corporate', 'fi'],
    'collateral_management': ['retail', 'sme', 'corporate', 'fi'],
    'loan_servicing': ['retail', 'sme', 'corporate', 'fi'],
    'collection_provisioning': ['retail', 'sme', 'corporate', 'fi'],
    'early_warning': ['retail', 'sme', 'corporate', 'fi'],
    'ai_lending': ['retail', 'sme', 'corporate'],
    'omnichannel': ['retail', 'sme'],
    'bi_reporting': ['retail', 'sme', 'corporate', 'fi']
}
