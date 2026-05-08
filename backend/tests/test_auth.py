from codeduel.models import db, User
from codeduel.auth import argon2, hash_password
from codeduel.game import sio

def test_register(client, app):
    data = {
        'username': 'thisisausername',
        'password': 'thisisapassword',
    }

    response = client.post('/api/register', json=data)
    assert response.status_code == 201

    assert response.json['username'] == data['username']
    assert 'id' in response.json
    assert 'password' not in response.json
    assert 'passhash' not in response.json
    assert 'role' not in response.json

    with app.app_context():
        user = db.session.get(User, response.json['id'])
        assert user is not None
        assert user.passhash != ''
        assert user.passhash != data['password'] # Make sure we hashed the password
 
    # Make sure the hashed password is peppered
    assert not argon2.check_password_hash(user.passhash, data['password'])
    assert argon2.check_password_hash(user.passhash, data['password']+app.config['PEPPER'])

def test_login(client, app):
    bad_data = {
        'username': 'incorrect username',
        'password': 'incorrect password',
    }
    data = {
        'username': 'testusername',
        'password': 'testpassword',
    }
    with app.app_context():
        passhash = hash_password(data['password'])
        db.session.get_one(User, 1).passhash = passhash
        db.session.commit()

    # Invalid login
    response = client.post('/api/login', json=bad_data)
    assert response.status_code == 401
    assert client.get_cookie('access_token_cookie') is None

    # Valid login
    response = client.post('/api/login', json=data)
    assert response.status_code == 200
    assert client.get_cookie('access_token_cookie') is not None

def test_logout(client, auth):
    auth.login()
    with client:
        response = auth.logout()
        assert response.status_code == 200
        assert client.get_cookie('access_token_cookie') is None