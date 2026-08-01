# GateKeep Backend v2

FastAPI + SQLite backend for the GateKeep hackathon demo.

## Features
- Dummy admin login using a backend-issued Bearer token
- Employee directory and employee profiles
- Department-based sample account provisioning
- Account, asset, session and credential inventory
- Granular revoke/freeze/cancel actions with verification
- Full employee termination preview and execution
- Audit events and termination report
- Synthetic demo data only

## Run
```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Open http://127.0.0.1:8000/docs

## Demo login
- Email: `admin@gatekeep.demo`
- Password: `admin123`

## Reset demo data
```bash
curl -X POST http://127.0.0.1:8000/api/v1/demo/reset
```
