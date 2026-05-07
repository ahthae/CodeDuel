import pytest
import tempfile
from flask_socketio import SocketIOTestClient
from uuid import UUID

from codeduel import create_app
from codeduel.game import sio

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
        from codeduel.models import Duel, db, Problem, TestCase, User
        from codeduel.auth import hash_password
        user = User(1, 'testusername', hash_password('testpassword'))
        user2 = User(3, 'testusername2', hash_password('testpassword2'))
        admin = User(2, 'testadmin', hash_password('testadminpass'))
        admin.role = 9
        db.session.add_all(
            [
                Duel(id=UUID('72f107b6-737a-4ba9-9751-e42926d69a46'),
                    player1=1,
                    player2=3,
                    problem=1,
                    winner=0
                ),
                Duel(id=UUID('7a43222e-da9f-43a8-ab26-d52ab72738c5'),
                    player1=2,
                    player2=1,
                    problem=1,
                    winner=1
                )
            ])
        problem = Problem(
            id=1,
            name='Test Problem',
            description='Test problem description.'
        )
        test_case = TestCase(
            input='test case input test',
            output='test case output test',
            problem=problem
        )
        problem2 = Problem(
            id=2,
            name='Test Problem 2',
            description='Test problem 2 description.'
        )
        test_case2 = TestCase(
            input='test case 2 input test',
            output='test case 2 output test',
            problem=problem
        )
        db.session.add_all((user, user2, admin, problem, test_case, problem2, test_case2))
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

@pytest.fixture
def sio_client(app, auth, client):
    auth.login()
    return SocketIOTestClient(app, sio, flask_test_client=client)

@pytest.fixture
def sio_client2(app, auth, client):
    auth.login(username='testusername2', password='testpassword2')
    return SocketIOTestClient(app, sio, flask_test_client=client)

class GameController(object):
    def __init__(self, sio_client, sio_client2):
        self.sio_client = sio_client
        self.sio_client2 = sio_client2

    def create_game(self) -> int:
        self.sio_client.emit('join')
        game_id = self.sio_client2.get_received()[0]['args'][0]
        self.sio_client2.emit('join', game_id)
        return game_id

@pytest.fixture
def game(sio_client, sio_client2):
    return GameController(sio_client, sio_client2)