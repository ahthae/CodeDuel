import uuid
from enum import Enum
from flask_socketio import ConnectionRefusedError, join_room, SocketIO
from flask_jwt_extended import verify_jwt_in_request
from flask import request, session

from codeduel.models import db, Duel, User
from codeduel.auth import jwt_lookup_cb

sio = SocketIO(cors_allowed_origins='*')
games = {}

class GameState(Enum):
    WAITING = 0
    STARTED = 1
    FINISHED = 2

class GameFullException(Exception):
    def __init__(self, game_id):
        self.game_id = game_id

class Game(Duel):
    state = GameState.WAITING
    
    def join(self, user: User) -> GameState:
        """Adds a player to the game. Changes state from :attr:`GameState.WAITING` to :attr:`GameState.STARTED` when both players have joined.

        :raises GameFullException: Raised when attempting to join a game that already has 2 players.
        :param user: :class:`codeduel.models.User` instance joining the game.
        :returns: :class:`codeduel.game.GameState` after user has joined
        """
        if self.state != GameState.WAITING or self.player2 is not None:
            raise GameFullException(self.id)

        if self.player1 is None:
            self.player1 = user.id
        elif self.player2 is None:
            self.player2 = user.id

        if self.player1 is not None and self.player2 is not None:
            self.state = GameState.STARTED
        
        return self.state

    def end(self):
        # TODO set winner
        db.session.add(super)
        self.model = Duel()
        sio.emit('end', room=self.id)

@sio.on('connect')
def connect_handler(auth: dict) -> None:
    """Initializes Socket.IO connection."""
    user = authenticate_client()
    session['user'] = user

@sio.on('join')
def join_game(id: str = None) -> None:
    """Creates a game instance and waits for another player to join, or joins another game instance.

    :param id: Game UUID as 128-bit string
    """
    if id is not None:
        id = uuid.UUID(id)
        if id.int not in games:
            sio.emit('error', 'Game ID not found.', to=request.sid)
            return
        try:
            games[id.int].join(session['user'])
            db.session.commit()
            join_room(id.int)
            sio.emit('start', room=id.int)
        except GameFullException:
            sio.emit('error', 'Game not joinable.', to=request.sid)
    else:
        # Create a new game instance
        game = Game()
        game.join(session['user'])
        db.session.add(game)
        db.session.commit()

        games[game.id.int] = game
        join_room(game.id.int)
        session['game_id'] = game.id
        sio.emit('waiting', str(game.id))

@sio.on('editor_update')
def editor_update_handler(data: str):
    sio.emit('editor_update', data, room=session['game_id'].int, skip_sid=request.sid)

@sio.on('submit')
def submission_handler(data: dict):
    raise NotImplementedError

@sio.on('queue')
def queue_game_handler():
    raise NotImplementedError

def authenticate_client() -> int:
    """Authenticates the socket connection using the JWT cookie from the initial HTTP connection request.

    :returns: :class:`codeduel.models.User` object of authenticated user or None if authentication failed
    """
    
    if 'access_token_cookie' not in request.cookies:
        raise ConnectionRefusedError('Connection refused by server: unauthenticated.')
    try:
        jwt_header, jwt_data = verify_jwt_in_request() # uses the request context pushed by Flask-Socket.IO
    except:
        raise ConnectionRefusedError('Connection refused by server: invalid token.')
    return jwt_lookup_cb(jwt_header, jwt_data)