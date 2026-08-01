const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export type EmployeeSummary = {
  id: number;
  full_name: string;
  company_email: string;
  department: string;
  job_title: string;
  manager_name: string | null;
  employment_status: string;
  accounts_count: number;
  active_accounts: number;
  risk_score: number;
  risk_level: string;
};

export type EmployeeDetail = EmployeeSummary & {
  personal_email: string | null;
  start_date: string | null;
  termination_date: string | null;
  last_access_review: string | null;
  active_sessions: number;
  active_credentials: number;
  group_memberships: number;
  owned_assets: number;
  created_at: string;
  updated_at: string;
};

export type EmployeeAccount = {
  id: number;
  employee_id: number;
  platform: string;
  account_type: string;
  identifier: string;
  access_level: string;
  status: string;
  last_used_at: string | null;
  risk_level: string;
  revocation_verified: boolean;
  active_sessions: number;
  active_credentials: number;
  metadata: Record<string, unknown>;
};

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Response did not contain JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function login(email: string, password: string) {
  return apiRequest<{
    access_token: string;
    token_type: string;
    user: {
      email: string;
      name: string;
      role: string;
    };
  }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getEmployees(token: string) {
  return apiRequest<EmployeeSummary[]>("/api/v1/employees", {
    headers: authHeaders(token),
    cache: "no-store",
  });
}

export async function getEmployee(token: string, employeeId: string) {
  return apiRequest<EmployeeDetail>(
    `/api/v1/employees/${employeeId}`,
    {
      headers: authHeaders(token),
      cache: "no-store",
    }
  );
}

export async function getEmployeeAccounts(
  token: string,
  employeeId: string
) {
  return apiRequest<EmployeeAccount[]>(
    `/api/v1/employees/${employeeId}/accounts`,
    {
      headers: authHeaders(token),
      cache: "no-store",
    }
  );
}

export async function revokeAccount(
  token: string,
  accountId: number
) {
  return apiRequest<EmployeeAccount>(
    `/api/v1/accounts/${accountId}/revoke`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        reason: "Revoked through GateKeep dashboard",
      }),
    }
  );
}

export async function verifyAccount(
  token: string,
  accountId: number
) {
  return apiRequest<{
    account_id: number;
    verified: boolean;
    status: string;
    remaining_sessions: boolean;
    remaining_credentials: boolean;
  }>(`/api/v1/accounts/${accountId}/verify`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function getTerminationPreview(
  token: string,
  employeeId: string
) {
  return apiRequest<{
    employee_id: number;
    employee: string;
    accounts_discovered: number;
    active_sessions: number;
    active_credentials: number;
    company_cards: number;
    owned_assets: number;
    actions: Array<{
      account_id: number;
      platform: string;
      planned_action: string;
    }>;
  }>(
    `/api/v1/employees/${employeeId}/termination/preview`,
    {
      method: "POST",
      headers: authHeaders(token),
    }
  );
}

export async function terminateEmployee(
  token: string,
  employeeId: string
) {
  return apiRequest<{
    status: string;
    summary: {
      accounts_discovered: number;
      accounts_revoked: number;
      accounts_verified: number;
      requires_manual_action: number;
      sessions_terminated: number;
      tokens_revoked: number;
      company_cards_frozen: number;
      files_transferred: number;
      hidden_access_discovered: number;
    };
  }>(`/api/v1/employees/${employeeId}/terminate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      preserve_mailbox: true,
      transfer_files_to_manager: true,
      preserve_audit_logs: true,
      reassign_owned_projects: true,
      revoke_sessions: true,
      disable_company_email: true,
      remove_group_memberships: true,
      revoke_saas_accounts: true,
      revoke_api_tokens: true,
      disable_vpn: true,
      remove_cloud_access: true,
      freeze_company_card: true,
    }),
  });
}

export async function restoreAccount(
  token: string,
  accountId: number
) {
  return apiRequest<{
    id: number;
    employee_id: number;
    platform: string;
    identifier: string;
    status: string;
    revocation_verified: boolean;
    sessions_restored: boolean;
    credentials_restored: boolean;
    message: string;
  }>(`/api/v1/accounts/${accountId}/restore`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function reactivateEmployee(
  token: string,
  employeeId: string
) {
  return apiRequest<{
    status: string;
    employee: EmployeeDetail;
    accounts_restored: number;
    sessions_restored: boolean;
    credentials_restored: boolean;
    message: string;
  }>(`/api/v1/employees/${employeeId}/reactivate`, {
    method: "POST",
    headers: authHeaders(token),
  });
}


export type AccessTemplate = {
  key: string;
  name: string;
  department: string;
  description: string;
  accounts: Array<{
    platform: string;
    access: string;
    risk: string;
    sessions: number;
    credentials: string[];
  }>;
};

export type CreateEmployeeInput = {
  full_name: string;
  company_email: string;
  personal_email?: string;
  department: string;
  job_title: string;
  manager_name?: string;
  start_date?: string;
  employment_status: string;
  github_username?: string;
  microsoft_username?: string;
  google_workspace_email?: string;
  auto_provision: boolean;
  access_template: string;
};

export async function getAccessTemplates(token: string) {
  return apiRequest<AccessTemplate[]>(
    "/api/v1/access-templates",
    {
      headers: authHeaders(token),
      cache: "no-store",
    }
  );
}

export async function createEmployee(
  token: string,
  input: CreateEmployeeInput
) {
  return apiRequest<EmployeeDetail>("/api/v1/employees", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}
