def test_duel_get_all(auth, client):
    response = client.get('/duel/')
    assert response.status_code == 200
    assert len(response.json) > 1

def test_duel_get(client):
    id = '72f107b6-737a-4ba9-9751-e42926d69a46'
    response = client.get(f'/duel/{id}')
    assert response.status_code == 200
    assert response.json['player1'] == 1
    assert response.json['player2'] == 3
    assert response.json['problem'] == 1
    assert response.json['winner'] == 0

def test_duel_by_player_get(client):
    player_id = 1
    response = client.get(f'/duel/?player={player_id}')
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]['player1'] == player_id
    assert response.json[1]['player2'] == player_id

    player_id = 2
    response = client.get(f'/duel/?player={player_id}')
    assert len(response.json) == 1
    assert response.json[0]['player1'] == player_id