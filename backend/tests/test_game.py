from flask import session
from flask_socketio import SocketIOTestClient
from uuid import UUID

from codeduel.game import sio, games

def test_connect_unauthorized(app, client):
    sio_client = SocketIOTestClient(app, sio, flask_test_client=client)
    assert not sio_client.is_connected()

def test_connect(sio_client):
    assert sio_client.is_connected()
    assert sio.server.environ[sio_client.eio_sid]['saved_session']['user'] is not None

def test_join_game(client, sio_client):
    sio_client.emit('join')
    assert sio.server.environ[sio_client.eio_sid]['saved_session']['game_id'] is not None

def test_join_existing_game(game):
    game_id = game.create_game()
    game_id = UUID(game_id).int
    assert game_id in games
    assert games[game_id].player1 == 1
    assert games[game_id].player2 == 3
    assert game.sio_client.get_received()[-1]['name'] == 'start'
    assert game.sio_client2.get_received()[-1]['name'] == 'start'

def test_editor_update(game):
    game_id = game.create_game()
    game.sio_client.emit('editor_update', 'test $editor\n content')

    msg = game.sio_client2.get_received()[-1]
    assert msg['name'] == 'editor_update'
    assert msg['args'][0] == 'test $editor\n content'

def test_submit(game):
    game_id = game.create_game()
    code = r'''#include <iostream>
using namespace std;
int main() {
    string s;
    cin >> s;
    cout << "test case 2 output test\n";
    return 0;
}'''
    game.sio_client.emit('submit', code)

    received = game.sio_client.get_received()
    assert received[0]['name'] == 'submission'
    assert received[0]['args'][0] == True
    assert received[0]['args'][1] == False
