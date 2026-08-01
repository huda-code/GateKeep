from difflib import SequenceMatcher
from typing import Literal

from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.agent.schemas import EmployeeHints
from app.models import Employee


class EmployeeCandidate(BaseModel):
    id: int
    full_name: str
    company_email: str
    department: str
    job_title: str
    employment_status: str
    match_score: float
    match_reason: str


class EmployeeResolution(BaseModel):
    status: Literal[
        "resolved",
        "ambiguous",
        "not_found",
    ]
    employee_id: int | None = None
    employee_name: str | None = None
    confidence: float = 0
    match_reason: str | None = None
    candidates: list[EmployeeCandidate] = []
    message: str


def normalize(value: str | None) -> str:
    if not value:
        return ""

    return " ".join(value.strip().lower().split())


def similarity(first: str, second: str) -> float:
    return SequenceMatcher(
        None,
        normalize(first),
        normalize(second),
    ).ratio()


def employee_to_candidate(
    employee: Employee,
    score: float,
    reason: str,
) -> EmployeeCandidate:
    return EmployeeCandidate(
        id=employee.id,
        full_name=employee.full_name,
        company_email=employee.company_email,
        department=employee.department,
        job_title=employee.job_title,
        employment_status=employee.employment_status,
        match_score=round(score, 3),
        match_reason=reason,
    )


def resolve_by_email(
    db: Session,
    email: str,
) -> EmployeeResolution | None:
    normalized_email = normalize(email)

    employee = db.scalar(
        select(Employee).where(
            or_(
                func.lower(Employee.company_email)
                == normalized_email,
                func.lower(Employee.personal_email)
                == normalized_email,
            )
        )
    )

    if not employee:
        return None

    return EmployeeResolution(
        status="resolved",
        employee_id=employee.id,
        employee_name=employee.full_name,
        confidence=1.0,
        match_reason="exact_email",
        candidates=[
            employee_to_candidate(
                employee,
                1.0,
                "exact_email",
            )
        ],
        message=(
            f"Resolved employee using exact email: "
            f"{employee.full_name}"
        ),
    )


def resolve_by_exact_name(
    db: Session,
    full_name: str,
    department: str | None,
) -> EmployeeResolution | None:
    query = select(Employee).where(
        func.lower(Employee.full_name)
        == normalize(full_name)
    )

    if department:
        query = query.where(
            func.lower(Employee.department)
            == normalize(department)
        )

    employees = list(db.scalars(query).all())

    if len(employees) == 1:
        employee = employees[0]

        return EmployeeResolution(
            status="resolved",
            employee_id=employee.id,
            employee_name=employee.full_name,
            confidence=0.98,
            match_reason="exact_name",
            candidates=[
                employee_to_candidate(
                    employee,
                    0.98,
                    "exact_name",
                )
            ],
            message=(
                f"Resolved employee using exact name: "
                f"{employee.full_name}"
            ),
        )

    if len(employees) > 1:
        candidates = [
            employee_to_candidate(
                employee,
                0.98,
                "exact_name",
            )
            for employee in employees
        ]

        return EmployeeResolution(
            status="ambiguous",
            confidence=0.98,
            match_reason="multiple_exact_name_matches",
            candidates=candidates,
            message=(
                "More than one employee matched the exact name."
            ),
        )

    return None


def resolve_by_partial_name(
    db: Session,
    full_name: str,
    department: str | None,
) -> EmployeeResolution:
    requested_name = normalize(full_name)

    query = select(Employee)

    if department:
        query = query.where(
            func.lower(Employee.department)
            == normalize(department)
        )

    employees = list(db.scalars(query).all())

    scored_candidates: list[EmployeeCandidate] = []

    for employee in employees:
        employee_name = normalize(employee.full_name)

        if (
            requested_name in employee_name
            or employee_name in requested_name
        ):
            score = 0.90
            reason = "partial_name"
        else:
            score = similarity(
                requested_name,
                employee_name,
            )
            reason = "fuzzy_name"

        if score >= 0.65:
            scored_candidates.append(
                employee_to_candidate(
                    employee,
                    score,
                    reason,
                )
            )

    scored_candidates.sort(
        key=lambda candidate: candidate.match_score,
        reverse=True,
    )

    if not scored_candidates:
        return EmployeeResolution(
            status="not_found",
            confidence=0,
            candidates=[],
            message=(
                f"No employee matched '{full_name}'."
            ),
        )

    best = scored_candidates[0]

    if len(scored_candidates) == 1:
        return EmployeeResolution(
            status="resolved",
            employee_id=best.id,
            employee_name=best.full_name,
            confidence=best.match_score,
            match_reason=best.match_reason,
            candidates=scored_candidates,
            message=(
                f"Resolved employee as {best.full_name}."
            ),
        )

    second = scored_candidates[1]

    score_difference = (
        best.match_score - second.match_score
    )

    if (
        best.match_score >= 0.85
        and score_difference >= 0.12
    ):
        return EmployeeResolution(
            status="resolved",
            employee_id=best.id,
            employee_name=best.full_name,
            confidence=best.match_score,
            match_reason=best.match_reason,
            candidates=scored_candidates[:5],
            message=(
                f"Resolved employee as {best.full_name}."
            ),
        )

    return EmployeeResolution(
        status="ambiguous",
        confidence=best.match_score,
        match_reason="multiple_possible_matches",
        candidates=scored_candidates[:5],
        message=(
            "Multiple employees may match this request. "
            "Manual selection is required."
        ),
    )


def resolve_employee(
    db: Session,
    hints: EmployeeHints,
) -> EmployeeResolution:
    email = (
        hints.company_email
        or hints.personal_email
    )

    if email:
        email_result = resolve_by_email(
            db,
            str(email),
        )

        if email_result:
            return email_result

    if hints.full_name:
        exact_result = resolve_by_exact_name(
            db,
            hints.full_name,
            hints.department,
        )

        if exact_result:
            return exact_result

        return resolve_by_partial_name(
            db,
            hints.full_name,
            hints.department,
        )

    return EmployeeResolution(
        status="not_found",
        confidence=0,
        candidates=[],
        message=(
            "The request did not contain an employee "
            "name or email address."
        ),
    )
