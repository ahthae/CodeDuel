import pytest
import json

from codeduel.models import db, User
from codeduel.auth import check_password, hash_password

def test_user_get_all(client, app, auth):
    auth.login(username='testadmin', password='testadminpass')
    response = client.get('/api/user/')
    assert response.status_code == 200
    users = response.json
    assert len(users) > 1

def test_user_get(client, app):
    id = 1
    username='testusername'
    name='testpassword'
 
    response = client.get(f'/api/user/{id}')
    assert response.status_code == 200
 
    assert response.json['id'] == id
    assert response.json['username'] == username
    assert 'passhash' not in response.json
    assert 'password' not in response.json
    assert 'role' not in response.json

def test_user_put(client, app, auth):
    data = {
        'id':8,
        'username':'newtest',
        'password':'newtesttest',
    }

    response = client.put(f'/api/user/', json=data)
    assert response.status_code == 401

    auth.login(username='testadmin', password='testadminpass')
    response = client.put(f'/api/user/', json=data)
    assert response.status_code == 201

    with app.app_context():
        user = db.session.get(User, response.json['id'])
        assert user is not None
        assert user.username == data['username']
        assert check_password(user.passhash, data['password'])

def test_user_update(client, app, auth):
    id = 1
    data = { 'username': 'updated' }

    response = client.post(f'/api/user/{id}', json=data)
    assert response.status_code == 403

    auth.login(username='testadmin', password='testadminpass')
    response = client.post(f'/api/user/{id}', json=data)
    assert response.status_code == 200
    assert response.json['username'] == 'updated'

def test_user_delete(client, app):
    id = 1

    assert client.delete(f'/api/user/{id}').status_code == 204

    with app.app_context():
        assert db.session.get(User, id) is None