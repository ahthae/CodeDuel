import pytest
import tempfile
from random import randint

from codeduel import create_app

@pytest.fixture()
def app():
    tmp_fd, tmp_path = tempfile.mkstemp()

    app = create_app({
        'SECRET_KEY': 'secretkeysecretkeysecretkeysecretkey',
        'PEPPER': 'pepper',
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{tmp_path}.sqlite',
        'SQLALCHEMY_RECORD_QUERIES': True,
        'TESTING': True,
        'JWT_TOKEN_LOCATION': ['cookies'],
        'JWT_COOKIE_CSRF_PROTECT': False
        })

    with app.app_context():
        from codeduel.models import db, User
        from codeduel.auth import hash_password
        user = User(1, 'testusername', hash_password('testpassword'))
        admin = User(2, 'testadmin', hash_password('testadminpass'))
        admin.role = 9
        db.session.add_all((user,admin))
        db.session.commit()

    yield app

@pytest.fixture()
def client(app):
    return app.test_client()

class AuthController(object):
    def __init__(self, client):
        self.client = client

    def login(self, username='testusername', password='testpassword'):
        return self.client.post('/login', json={'username': username, 'password': password})
    
    def logout(self):
        return self.client.post('/logout')

@pytest.fixture
def auth(client):
    return AuthController(client)