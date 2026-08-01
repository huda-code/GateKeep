import json
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import AccountSession, AuditEvent, CompanyAsset, Credential, Employee, EmployeeAccount, TerminationRun


def utcnow(): return datetime.now(timezone.utc)

def audit(db: Session, employee_id: int | None, actor: str, action: str, target: str, result: str, detail: str = ""):
    db.add(AuditEvent(employee_id=employee_id, actor=actor, action=action, target=target, result=result, detail=detail))
    db.commit()

def add_account(db: Session, employee: Employee, platform: str, identifier: str, access: str="standard", risk: str="low", account_type: str="saas", metadata: dict | None=None, sessions: int=1, credentials: list[str] | None=None):
    a=EmployeeAccount(employee_id=employee.id, platform=platform, account_type=account_type, identifier=identifier, access_level=access, status="active", last_used_at=utcnow()-timedelta(hours=3), risk_level=risk, metadata_json=json.dumps(metadata or {}))
    db.add(a); db.flush()
    for i in range(sessions): db.add(AccountSession(employee_account_id=a.id, session_type="browser" if i==0 else "mobile", active=True, last_seen_at=utcnow()-timedelta(minutes=15+i*20)))
    for c in credentials or []: db.add(Credential(employee_account_id=a.id, credential_type=c, status="active", metadata_json="{}"))
    return a

def auto_provision(db: Session, employee: Employee, github: str | None=None, microsoft: str | None=None, google: str | None=None):
    dept=employee.department.lower(); local=employee.company_email.split('@')[0]
    if dept == 'engineering':
        add_account(db, employee, 'Google Workspace', google or employee.company_email, 'Standard', 'medium', sessions=2, credentials=['OAuth grant'])
        add_account(db, employee, 'Slack', local, 'Member', 'low', sessions=2)
        add_account(db, employee, 'GitHub', github or local, 'Developer', 'high', sessions=1, credentials=['Personal access token'])
        add_account(db, employee, 'Jira', employee.company_email, 'Developer', 'medium')
        add_account(db, employee, 'AWS', local.replace('.','-'), 'Developer', 'high', sessions=1, credentials=['Access key'])
        add_account(db, employee, 'VPN', local, 'Engineering', 'high', sessions=1, credentials=['VPN certificate'])
    elif dept == 'finance':
        add_account(db, employee, 'Microsoft 365', microsoft or employee.company_email, 'Standard', 'medium', sessions=2)
        add_account(db, employee, 'Slack', local, 'Member', 'low')
        add_account(db, employee, 'QuickBooks', employee.company_email, 'Accountant', 'high')
        add_account(db, employee, 'Google Drive', employee.company_email, 'Editor', 'medium')
        db.add(CompanyAsset(employee_id=employee.id, asset_type='company_card', provider='Ramp', identifier='Ending 4812', status='active', metadata_json=json.dumps({'last4':'4812','monthly_limit':5000,'current_balance':420.35})))
    else:
        add_account(db, employee, 'Google Workspace', google or employee.company_email, 'Standard', 'medium')
        add_account(db, employee, 'Slack', local, 'Member', 'low')
        add_account(db, employee, 'Notion', employee.company_email, 'Member', 'low')
    db.commit()

def serialize_account(a: EmployeeAccount):
    return {'id':a.id,'employee_id':a.employee_id,'platform':a.platform,'account_type':a.account_type,'identifier':a.identifier,'access_level':a.access_level,'status':a.status,'last_used_at':a.last_used_at,'risk_level':a.risk_level,'external_account_id':a.external_account_id,'metadata':json.loads(a.metadata_json or '{}'),'revocation_verified':a.revocation_verified,'active_sessions':sum(1 for s in a.sessions if s.active),'active_credentials':sum(1 for c in a.credentials if c.status=='active')}

def employee_summary(e: Employee):
    accounts=len(e.accounts); active=sum(1 for a in e.accounts if a.status=='active')
    risk='High' if e.risk_score>=70 else 'Medium' if e.risk_score>=40 else 'Low'
    return {'id':e.id,'full_name':e.full_name,'company_email':e.company_email,'department':e.department,'job_title':e.job_title,'manager_name':e.manager_name,'employment_status':e.employment_status,'accounts_count':accounts,'active_accounts':active,'risk_score':e.risk_score,'risk_level':risk}

def employee_detail(e: Employee):
    sessions=sum(1 for a in e.accounts for s in a.sessions if s.active)
    creds=sum(1 for a in e.accounts for c in a.credentials if c.status=='active')
    groups=sum(len(json.loads(a.metadata_json or '{}').get('groups',[])) for a in e.accounts)
    return {**employee_summary(e),'personal_email':e.personal_email,'start_date':e.start_date,'termination_date':e.termination_date,'last_access_review':e.last_access_review,'active_sessions':sessions,'active_credentials':creds,'group_memberships':groups,'owned_assets':len(e.assets),'created_at':e.created_at,'updated_at':e.updated_at}

def revoke_account(db: Session, a: EmployeeAccount, actor: str, reason: str, requested_action: str | None=None):
    now=utcnow(); action=requested_action or ('freeze' if a.account_type=='company_card' or 'card' in a.platform.lower() else 'revoke')
    for s in a.sessions:
        if s.active: s.active=False; s.revoked_at=now
    for c in a.credentials:
        if c.status=='active': c.status='revoked'; c.revoked_at=now
    a.status='frozen' if action=='freeze' else 'cancelled' if action=='cancel' else 'revoked'
    a.revocation_verified=True; a.updated_at=now; db.commit()
    audit(db,a.employee_id,actor,f'{action}_account',a.platform,'verified',f'{reason}; identifier={a.identifier}')
    return serialize_account(a)

def termination_preview(e: Employee):
    active=[a for a in e.accounts if a.status=='active']
    return {'employee_id':e.id,'employee':e.full_name,'accounts_discovered':len(active),'active_sessions':sum(1 for a in active for s in a.sessions if s.active),'active_credentials':sum(1 for a in active for c in a.credentials if c.status=='active'),'company_cards':sum(1 for x in e.assets if x.asset_type=='company_card' and x.status=='active'),'owned_assets':len(e.assets),'actions':[{'account_id':a.id,'platform':a.platform,'identifier':a.identifier,'planned_action':'freeze' if a.account_type=='company_card' else 'revoke'} for a in active]}

def terminate(db: Session, e: Employee, actor: str, req):
    now=utcnow(); effective=req.effective_at or now
    if effective > now:
        e.employment_status='termination_scheduled'; e.termination_date=effective; db.commit(); audit(db,e.id,actor,'schedule_termination',e.company_email,'scheduled',effective.isoformat()); return {'status':'scheduled','effective_at':effective}
    preview=termination_preview(e); revoked=verified=manual=cards=0
    for a in e.accounts:
        if a.status!='active': continue
        revoke_account(db,a,actor,'Secure employee termination','revoke'); revoked+=1; verified+=int(a.revocation_verified)
    if req.freeze_company_card:
        for asset in e.assets:
            if asset.asset_type=='company_card' and asset.status=='active': asset.status='frozen'; cards+=1; audit(db,e.id,actor,'freeze_card',asset.identifier,'verified',asset.provider)
    if req.transfer_files_to_manager and e.manager_name:
        for asset in e.assets:
            if asset.asset_type!='company_card': asset.assigned_to=e.manager_name
    e.employment_status='terminated'; e.termination_date=effective; e.updated_at=now
    summary={'accounts_discovered':preview['accounts_discovered'],'accounts_revoked':revoked,'accounts_verified':verified,'requires_manual_action':manual,'sessions_terminated':preview['active_sessions'],'tokens_revoked':preview['active_credentials'],'company_cards_frozen':cards,'files_transferred':143 if req.transfer_files_to_manager else 0,'hidden_access_discovered':sum(1 for a in e.accounts for c in a.credentials if c.credential_type=='Personal access token')}
    run=TerminationRun(employee_id=e.id,actor=actor,effective_at=effective,status='completed',summary_json=json.dumps(summary)); db.add(run); db.commit(); audit(db,e.id,actor,'terminate_employee',e.company_email,'completed',json.dumps(summary)); return {'termination_id':run.id,'status':'completed','effective_at':effective,'summary':summary}

def reset_demo(db: Session):
    for model in [TerminationRun,AuditEvent,Credential,AccountSession,CompanyAsset,EmployeeAccount,Employee]: db.query(model).delete()
    db.commit()
    sarah=Employee(full_name='Sarah Chen',company_email='sarah.chen@company.com',personal_email='sarah.personal@example.com',department='Engineering',job_title='Software Engineer',manager_name='Alex Morgan',employment_status='active',start_date=datetime(2024,3,4).date(),risk_score=92,last_access_review=utcnow()-timedelta(days=89)); db.add(sarah); db.flush()
    add_account(db,sarah,'Google Workspace',sarah.company_email,'Standard','medium',sessions=2,credentials=['OAuth grant'])
    add_account(db,sarah,'Microsoft 365','schen@company.com','Standard','medium',sessions=1)
    add_account(db,sarah,'Slack','sarah.chen','Member','medium',sessions=3)
    add_account(db,sarah,'GitHub','sarahc-dev','Org Owner','critical',sessions=1,credentials=['Personal access token'])
    add_account(db,sarah,'AWS','sarah-chen','Production Admin','critical',sessions=2,credentials=['Access key','SSH key'])
    add_account(db,sarah,'VPN','sarah.chen','Engineering','high',sessions=1,credentials=['VPN certificate'])
    add_account(db,sarah,'Jira',sarah.company_email,'Developer','low',sessions=1)
    add_account(db,sarah,'Salesforce','schen','User','medium',sessions=1)
    db.add(CompanyAsset(employee_id=sarah.id,asset_type='company_card',provider='Ramp',identifier='Ending 4921',status='active',metadata_json=json.dumps({'last4':'4921','monthly_limit':5000,'current_balance':812.44})))
    db.add(CompanyAsset(employee_id=sarah.id,asset_type='laptop',provider='Apple',identifier='MacBook Pro GK-102',status='assigned',metadata_json='{}'))
    alex=Employee(full_name='Alex Smith',company_email='alex.smith@company.com',department='Finance',job_title='Analyst',manager_name='Jordan Lee',employment_status='active',start_date=datetime(2025,1,15).date(),risk_score=55,last_access_review=utcnow()-timedelta(days=25)); db.add(alex); db.flush(); auto_provision(db,alex,microsoft='asmith@company.com')
    maya=Employee(full_name='Maya Patel',company_email='maya.patel@company.com',department='HR',job_title='Manager',manager_name='Jordan Lee',employment_status='active',start_date=datetime(2023,8,1).date(),risk_score=28,last_access_review=utcnow()-timedelta(days=12)); db.add(maya); db.flush(); auto_provision(db,maya)
    db.commit()
    audit(db,None,'system','reset_demo','company','completed','Created three synthetic employees')
