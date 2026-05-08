from flask import session
from flask_socketio import SocketIOTestClient
from uuid import UUID

from codeduel.game import sio, games
from codeduel.models import db

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

# TODO rewrite this test to work without needed a Judge0 instance running
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

    with game.sio_client.app.app_context():
        games[UUID(game_id).int].problem = 2
        db.session.commit()

    game.sio_client.emit('submission', code)

    # TODO add test case ID, compiler output, and output logs to results
    # TODO maybe add submission ID
    received = game.sio_client.get_received()[-1]
    assert received['name'] == 'submission'
    assert received['args'][0][0]['id'] == 3 # Accepted
    assert received['args'][0][1]['id'] == 4 # Wrong  Answer
