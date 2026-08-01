from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class EmployeeCreate(BaseModel):
    full_name: str
    company_email: EmailStr
    personal_email: EmailStr | None = None
    department: str
    job_title: str
    manager_name: str | None = None
    start_date: date | None = None
    employment_status: str = "active"
    github_username: str | None = None
    microsoft_username: str | None = None
    google_workspace_email: EmailStr | None = None
    auto_provision: bool = True

class EmployeePatch(BaseModel):
    full_name: str | None = None
    personal_email: EmailStr | None = None
    department: str | None = None
    job_title: str | None = None
    manager_name: str | None = None
    employment_status: str | None = None
    risk_score: int | None = Field(default=None, ge=0, le=100)

class AccountCreate(BaseModel):
    platform: str
    account_type: str = "saas"
    identifier: str
    access_level: str = "standard"
    status: str = "active"
    risk_level: str = "low"
    external_account_id: str | None = None
    metadata: dict = {}
    session_count: int = 1
    credentials: list[str] = []

class RevokeRequest(BaseModel):
    reason: str = "Manual administrator action"
    action: str | None = None

class AssetTransferRequest(BaseModel):
    assigned_to: str

class TerminationRequest(BaseModel):
    effective_at: datetime | None = None
    preserve_mailbox: bool = True
    transfer_files_to_manager: bool = True
    preserve_audit_logs: bool = True
    reassign_owned_projects: bool = True
    revoke_sessions: bool = True
    disable_company_email: bool = True
    remove_group_memberships: bool = True
    revoke_saas_accounts: bool = True
    revoke_api_tokens: bool = True
    disable_vpn: bool = True
    remove_cloud_access: bool = True
    freeze_company_card: bool = True
