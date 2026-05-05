from flask import session
from codeduel.game import sio, games
from flask_socketio import SocketIOTestClient

def test_connect_unauthorized(app, client):
    sio_client = SocketIOTestClient(app, sio, flask_test_client=client)
    assert not sio_client.is_connected()

def test_connect(sio_client):
    assert sio_client.is_connected()
    assert sio.server.environ[sio_client.eio_sid]['saved_session']['user'] is not None

def test_join_game(client, sio_client):
    sio_client.emit('join_game')
    assert sio.server.environ[sio_client.eio_sid]['saved_session']['game_id'] is not None

def test_join_existing_game(client, sio_client, sio_client2):
    sio_client.emit('join_game')
    game_id = sio_client2.get_received()[0]['args'][0]
    sio_client2.emit('join_game', game_id)
    assert game_id in games
    assert games[game_id].player1 == 1
    assert games[game_id].player2 == 3
    assert sio_client.get_received()[-1]['name'] == 'start'
    assert sio_client2.get_received()[-1]['name'] == 'start'
