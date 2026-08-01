from fastapi.testclient import TestClient
from app.main import app

client=TestClient(app)

def auth():
    r=client.post('/api/v1/auth/login',json={'email':'admin@gatekeep.demo','password':'admin123'})
    return {'Authorization':f"Bearer {r.json()['access_token']}"}

def test_full_demo_flow():
    client.post('/api/v1/demo/reset')
    h=auth()
    employees=client.get('/api/v1/employees',headers=h)
    assert employees.status_code==200 and len(employees.json())==3
    sarah=next(e for e in employees.json() if e['full_name']=='Sarah Chen')
    accounts=client.get(f"/api/v1/employees/{sarah['id']}/accounts",headers=h)
    assert len(accounts.json())==8
    preview=client.post(f"/api/v1/employees/{sarah['id']}/termination/preview",headers=h)
    assert preview.json()['accounts_discovered']==8
    result=client.post(f"/api/v1/employees/{sarah['id']}/terminate",headers=h,json={})
    assert result.json()['status']=='completed'
