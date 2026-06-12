from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get('/api/health')
    assert res.status_code == 200
    assert res.json()['status'] == 'ok'


def test_chat_same_day():
    res = client.post('/api/chat', json={
        'message': 'A 3 year old child has fever and fast breathing.',
        'language': 'en',
        'case_context': {'age_months': 36, 'temperature_c': 39.2, 'respiratory_rate': 56, 'symptoms': ['fever', 'fast breathing']},
    })
    assert res.status_code == 200
    data = res.json()
    assert data['urgency'] == 'same_day'
    assert data['evidence']


def test_chat_emergency_and_redaction():
    res = client.post('/api/chat', json={
        'message': 'Patient phone 0912345678. Child has convulsions.',
        'language': 'en',
        'case_context': {'age_months': 24, 'symptoms': ['convulsion']},
    })
    assert res.status_code == 200
    data = res.json()
    assert data['urgency'] == 'emergency'
    assert data['safety']['pii_redacted'] is True
    assert data['review_required'] is True


def test_evaluate():
    res = client.post('/api/evaluate')
    assert res.status_code == 200
    data = res.json()
    assert data['total_cases'] >= 5
    assert data['urgency_accuracy'] >= 0.85


def test_offline_packet():
    res = client.get('/api/offline/field-packet')
    assert res.status_code == 200
    assert res.json()['protocol_count'] > 0
