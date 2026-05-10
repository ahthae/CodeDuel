import requests
import uuid
from enum import Enum
from flask_socketio import ConnectionRefusedError, join_room, SocketIO
from flask_jwt_extended import verify_jwt_in_request
from flask import current_app, request, session
from random import randint

from codeduel.models import db, Duel, Problem, User
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
class GameEndedException(Exception):
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
        if self.state == GameState.FINISHED:
            raise GameEndedException(self.id)

        if self.player1 is None:
            self.player1 = user.id
        elif self.player2 is None:
            self.player2 = user.id

        if self.player1 is not None and self.player2 is not None:
            self.state = GameState.STARTED
        
        return self.state

    def end(self, winner):
        self.status = GameState.FINISHED
        self.winner = (self.player2 == winner.id)+1

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
            sio.emit('error', {'error_code': 1, 'description': 'game not found','game_id': str(id)}, to=request.sid)
            return

        game = games[id.int]
        user = session['user']
        try:
            if game.player1 != user.id and game.player2 != user.id:
                game.join(session['user'])
                db.session.commit()
                sio.emit('start', room=id.int)
            join_room(id.int)
            session['game_id'] = game.id
        except GameFullException:
            sio.emit('error', {'error_code': 2, 'description': 'game full', 'game_id':str(id)}, to=request.sid)
        except GameEndedException:
            sio.emit('error', {'error_code': 3, 'description': 'game ended', 'game_id': str(id)}, to=request.sid)
    else:
        # Create a new game instance
        game = Game()
        game.problem = choose_problem()
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

@sio.on('submission')
def submission_handler(data: dict):
    """Sends submission to the judge and sends the results to the game room. Ends the game when a player passes all test cases.

    :param data: submission source code
    """
    game = games[session['game_id'].int]
    problem = db.session.get(Problem, game.problem)
    results = [0 for _ in range(len(problem.test_cases))]
    did_pass = True
    i = 0
    for test_case in problem.test_cases:
        r = requests.post(current_app.config['JUDGE_URL']+'/submissions?wait=true', json={ # TODO use callback_url instead of waiting
            'source_code': data,
            'language_id': 54, # C++ GCC (see 'GET /languages' for the Judge0 langauge IDs)
            'stdin': test_case.input,
            'expected_output': test_case.output
        })
        j = r.json()
        if j['status']['id'] != 3:
            did_pass = False
        results[i] = {
            'user_id': session['user'].id,
            'source_code': j['source_code'],
            'status': j['status'],
            'stdout': j['stdout'],
            'stderr': j['stderr'],
            'compile_output': j['compile_output'],
            'message': j['message'],
            'time': j['time'],
            'memory': j['memory'],
            'token': j['token'],
            'test_case_id': test_case.id
        }
        i += 1
    sio.emit('submission', results, room=game.id.int)
    if did_pass:
        game.end(session['user'])
        db.session.commit()
        sio.emit('end', session['user'].id, room=game.id.int)

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

def choose_problem() -> int:
    """Returns the ID of a random problem from the database."""
    problems = db.session.scalars(db.select(Problem.id)).all()
    return problems[randint(0, len(problems)-1)]