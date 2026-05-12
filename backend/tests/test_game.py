from flask import session
from flask_socketio import SocketIOTestClient
from uuid import UUID

from codeduel.game import sio, games
from codeduel.models import db, Duel

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

def test_join_full_game(game, auth, app, client):
    game_id = game.create_game()
    with auth.login(username='testadmin', password='testadminpass'):
        sio_client3 = SocketIOTestClient(app, sio, flask_test_client=client)
        sio_client3.emit('join', game_id)

        game_id = UUID(game_id).int
        assert games[game_id].player1 != 2
        assert games[game_id].player2 != 2
        assert sio_client3.get_received()[-1]['name'] != 'start'

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

    received = game.sio_client.get_received()[-1]
    assert received['name'] == 'submission'
    assert game.sio_client2.get_received()[-1]['name'] == 'submission' # Make sure the other player gets the submission results too
    assert received['args'][0][0]['status']['id'] == 3 # Accepted
    assert received['args'][0][1]['status']['id'] == 4 # Wrong  Answer

def test_win(game):
    game_id = game.create_game()
    code = r'''#include <iostream>
using namespace std;
int main() {
    string s;
    cin >> s;
    cout << "test case output test\n";
    return 0;
}'''

    with game.sio_client.app.app_context():
        games[UUID(game_id).int].problem = 1
        db.session.commit()

    game.sio_client.emit('submission', code)

    received = game.sio_client.get_received()[-1]
    received2 = game.sio_client2.get_received()[-1]
    assert received['name'] == 'end'
    assert received2['name'] == 'end'
    assert received['args'][0] == 1 # Player 1 won
    assert received2['args'][0] == 1 # Player 2 is notified player 1 won

    with game.sio_client.app.app_context():
        duel = db.session.get(Duel, UUID(game_id))
        assert duel is not None
        assert duel.winner == 1
