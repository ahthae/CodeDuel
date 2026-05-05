import uuid
from enum import Enum
from flask_socketio import ConnectionRefusedError, join_room, SocketIO
from flask_jwt_extended import decode_token
from flask import request, session

from codeduel.models import db, Duel
from codeduel.auth import jwt_lookup_cb

sio = SocketIO()
games = {}

class GameState(Enum):
    WAITING = 0
    STARTED = 1
    FINISHED = 2

class Game(Duel):
    state = GameState.WAITING

    def end_game(self):
        # TODO set winner
        db.session.add(super)
        self.model = Duel()

@sio.on('connect')
def connect_handler(auth):
    user = authorize_client()
    session['user'] = user

@sio.on('join_game')
def join_game(id: int = None):
    if id is not None:
        if id not in games:
            sio.emit('error', 'Game ID not found.', to=request.sid)
            return
        games[id].player2 = session['user'].id
        join_room(id)
        sio.emit('start', room=id)
    else:
        game = Game()
        game.player1 = session['user'].id
        db.session.add(game)
        db.session.commit()

        games[game.id.int] = game
        join_room(game.id.int)
        session['game_id'] = game.id
        sio.emit('waiting', game.id.int)

@sio.on('start')
def start_game_handler(json):
    raise NotImplementedError
@sio.on('queue')
def queue_game_handler(json):
    raise NotImplementedError

def authorize_client() -> int:
    """"""
    if 'access_token_cookie' not in request.cookies:
        raise ConnectionRefusedError('Connection refused by server: unauthenticated.')
    token = decode_token(request.cookies['access_token_cookie'])
    if token is None:
        raise ConnectionRefusedError('Connection refused by server: invalid credentials.')
    return jwt_lookup_cb(None, token)