import re
from datetime import date

from app.agent.schemas import (
    EmployeeHints,
    OffboardingActions,
    OffboardingPlan,
    OnboardingEmployeeData,
    OnboardingPlan,
    UnknownPlan,
)


ROLE_TEMPLATES = {
    "software engineer": {
        "department": "Engineering",
        "job_title": "Software Engineer",
        "access_template": "software_engineer",
    },
    "engineer": {
        "department": "Engineering",
        "job_title": "Software Engineer",
        "access_template": "software_engineer",
    },
    "developer": {
        "department": "Engineering",
        "job_title": "Software Engineer",
        "access_template": "software_engineer",
    },
    "designer": {
        "department": "Design",
        "job_title": "Designer",
        "access_template": "designer",
    },
    "product designer": {
        "department": "Design",
        "job_title": "Product Designer",
        "access_template": "designer",
    },
    "finance": {
        "department": "Finance",
        "job_title": "Finance Associate",
        "access_template": "finance",
    },
    "financial analyst": {
        "department": "Finance",
        "job_title": "Financial Analyst",
        "access_template": "finance",
    },
    "accountant": {
        "department": "Finance",
        "job_title": "Accountant",
        "access_template": "finance",
    },
    "data analyst": {
        "department": "Data",
        "job_title": "Data Analyst",
        "access_template": "data_analyst",
    },
}


ONBOARDING_TERMS = {
    "add",
    "hire",
    "onboard",
    "create employee",
    "new employee",
    "joining",
    "starts",
    "starting",
    "grant access",
}

OFFBOARDING_TERMS = {
    "terminate",
    "offboard",
    "revoke",
    "left",
    "leaving",
    "last day",
    "disable access",
    "remove access",
    "fire",
    "fired",
}


def normalize_instruction(instruction: str) -> str:
    return " ".join(instruction.strip().split())


def detect_intent(instruction: str) -> str:
    lowered = instruction.lower()

    onboarding_score = sum(
        1 for term in ONBOARDING_TERMS if term in lowered
    )
    offboarding_score = sum(
        1 for term in OFFBOARDING_TERMS if term in lowered
    )

    if onboarding_score > offboarding_score:
        return "onboard_employee"

    if offboarding_score > onboarding_score:
        return "offboard_employee"

    return "unknown"


def extract_email(instruction: str) -> str | None:
    match = re.search(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        instruction,
    )
    return match.group(0) if match else None


def extract_name(instruction: str) -> str | None:
    patterns = [
        (
            r"(?:add|hire|onboard|terminate|offboard|remove|disable)\s+"
            r"([A-Za-z][A-Za-z'-]+(?:\s+[A-Za-z][A-Za-z'-]+){1,2}?)"
            r"(?=\s+(?:as|immediately|today|tomorrow|from|who|and|is|was)|[.,]|$)"
        ),
        (
            r"([A-Za-z][A-Za-z'-]+(?:\s+[A-Za-z][A-Za-z'-]+){1,2})\s+"
            r"(?:left|is leaving|was fired|starts|is joining|joined)"
        ),
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            instruction,
            flags=re.IGNORECASE,
        )

        if match:
            return " ".join(
                part.capitalize()
                for part in match.group(1).strip().split()
            )

    return None


def extract_manager(instruction: str) -> str | None:
    patterns = [
        r"(?:manager is|manager:|reports to)\s+"
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})",
        r"(?:(?:transfer|move) .*? to)\s+"
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            instruction,
            flags=re.IGNORECASE,
        )

        if match:
            return " ".join(
                part.capitalize()
                for part in match.group(1).strip().split()
            )

    return None


def detect_role(instruction: str) -> dict | None:
    lowered = instruction.lower()

    for role_name in sorted(
        ROLE_TEMPLATES,
        key=len,
        reverse=True,
    ):
        if role_name in lowered:
            return ROLE_TEMPLATES[role_name]

    return None


def parse_onboarding(instruction: str) -> OnboardingPlan:
    full_name = extract_name(instruction)
    company_email = extract_email(instruction)
    manager_name = extract_manager(instruction)
    role = detect_role(instruction)

    missing_fields = []

    if not full_name:
        missing_fields.append("full_name")

    if not company_email:
        missing_fields.append("company_email")

    if not role:
        missing_fields.append("role")

    confidence = 0.95

    if missing_fields:
        confidence = max(
            0.35,
            confidence - (0.2 * len(missing_fields)),
        )

    employee = OnboardingEmployeeData(
        full_name=full_name or "Unknown Employee",
        company_email=company_email or "unknown@invalid.local",
        department=role["department"] if role else "Unknown",
        job_title=role["job_title"] if role else "Unknown",
        manager_name=manager_name,
        start_date=date.today(),
        access_template=(
            role["access_template"]
            if role
            else "software_engineer"
        ),
    )

    return OnboardingPlan(
        employee=employee,
        confidence=confidence,
        missing_fields=missing_fields,
    )


def parse_offboarding(instruction: str) -> OffboardingPlan:
    lowered = instruction.lower()

    full_name = extract_name(instruction)
    company_email = extract_email(instruction)
    manager_name = extract_manager(instruction)

    preserve_mailbox = not any(
        phrase in lowered
        for phrase in {
            "delete mailbox",
            "remove mailbox",
            "do not preserve mailbox",
        }
    )

    transfer_files = any(
        phrase in lowered
        for phrase in {
            "transfer files",
            "transfer her files",
            "transfer his files",
            "transfer their files",
            "transfer documents",
            "transfer her documents",
            "transfer his documents",
            "transfer their documents",
            "transfer assets",
            "transfer her assets",
            "transfer his assets",
            "transfer their assets",
            "move files",
            "move her files",
            "move his files",
            "move their files",
            "move documents",
            "move her documents",
            "move his documents",
            "move their documents",
        }
    )

    freeze_card = not any(
        phrase in lowered
        for phrase in {
            "do not freeze card",
            "leave card active",
        }
    )

    revoke_all = not any(
        phrase in lowered
        for phrase in {
            "keep access",
            "leave all access active",
        }
    )

    exceptions = []

    keep_match = re.search(
        r"(?:keep|leave)\s+([A-Za-z0-9 ._-]+?)\s+"
        r"(?:active|enabled|for)",
        instruction,
        re.IGNORECASE,
    )

    if keep_match:
        exceptions.append(keep_match.group(1).strip())

    confidence = 0.95

    if not full_name and not company_email:
        confidence = 0.55

    return OffboardingPlan(
        employee_hints=EmployeeHints(
            full_name=full_name,
            company_email=company_email,
            manager_name=manager_name,
        ),
        actions=OffboardingActions(
            revoke_all_access=revoke_all,
            preserve_mailbox=preserve_mailbox,
            transfer_files_to_manager=transfer_files,
            transfer_to=manager_name,
            freeze_company_card=freeze_card,
            preserve_audit_logs=True,
            revoke_sessions=True,
            revoke_credentials=True,
        ),
        exceptions=exceptions,
        confidence=confidence,
    )


def parse_instruction(
    instruction: str,
) -> OnboardingPlan | OffboardingPlan | UnknownPlan:
    cleaned = normalize_instruction(instruction)
    intent = detect_intent(cleaned)

    if intent == "onboard_employee":
        return parse_onboarding(cleaned)

    if intent == "offboard_employee":
        return parse_offboarding(cleaned)

    return UnknownPlan(
        reason=(
            "The instruction did not clearly describe employee "
            "onboarding or offboarding."
        ),
        confidence=0.2,
    )
