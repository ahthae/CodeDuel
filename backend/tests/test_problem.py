def test_problem_get_all(client):
    response = client.get('/problem/')
    assert response.status_code == 200
    assert len(response.json) > 1

def test_problem_get(client):
    id = 1
    response = client.get(f'/problem/{id}')
    assert response.status_code == 200
    assert response.json['id'] == 1
    assert response.json['name'] == 'Test Problem'
    assert len(response.json['test_cases']) > 0
    assert response.json['test_cases'][0]['problem_id'] == id
    assert response.json['description'] == 'Test problem description.'
