import requests
import uuid
from base64 import b64encode
from enum import Enum
from flask_socketio import ConnectionRefusedError, join_room, SocketIO
from flask_jwt_extended import verify_jwt_in_request
from flask import current_app, request, session
from random import randint

from codeduel.models import db, Duel, GameState, Problem, User
from codeduel.auth import jwt_lookup_cb

sio = SocketIO(cors_allowed_origins='*')
class GameFullException(Exception):
    def __init__(self, game_id):
        self.game_id = game_id
class GameEndedException(Exception):
    def __init__(self, game_id):
        self.game_id = game_id

class Game:
    def __init__(self, game_id=None):
        if game_id is None:
            duel = Duel()
            db.session.add(duel)
            db.session.commit()
            self.game_id = duel.id
        else:
            self.game_id = game_id

    def get(self):
        return db.session.get(Duel, self.game_id)
    
    def join(self, user: User) -> GameState:
        """Adds a player to the game. Changes state from :attr:`GammodeleState.WAITING` to :attr:`GameState.STARTED` when both players have joined.

        :raises GameFullException: Raised when attempting to join a game that already has 2 players.
        :param user: :class:`codeduel.models.User` instance joining the game.
        :returns: :class:`codeduel.game.GameState` after user has joined
        """
        model = self.get()

        if model.state != GameState.WAITING or model.player2 is not None:
            raise GameFullException(model.id)
        if model.state == GameState.FINISHED:
            raise GameEndedException(model.id)

        if model.player1 is None:
            model.player1 = user.id
        elif model.player2 is None:
            model.player2 = user.id

        if model.player1 is not None and model.player2 is not None:
            model.state = GameState.STARTED
            model.problem = choose_problem()

        db.session.commit()
        return model.state

    def end(self, winner):
        model = self.get()

        if model.state != GameState.STARTED:
            return
        model.state = GameState.FINISHED
        model.winner = (model.player2 == winner.id)+1

        db.session.commit()

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
    user = session['user']
    if id is not None:
        try:
            id = uuid.UUID(id)
        except:
            sio.emit('error', {'error_code': 1, 'description': 'malformed ID'}, to=request.sid)
            return

        game = Game(id)
        model = game.get()
        if model is None:
            sio.emit('error', {'error_code': 1, 'description': 'game not found','game_id': str(id)}, to=request.sid)
            return

        try:
            if model.player1 != user.id and model.player2 != user.id:
                print(f'Adding player {user.username} to {str(model.id)}')
                game.join(session['user'])
                join_room(id.int)
                sio.emit('start', model.problem, room=id.int)
            else:
                print(f'Player {user.username} rejoining {str(model.id)}')
                join_room(id.int)
                session[model.id.int] = game
                if model.state == GameState.STARTED:
                    sio.emit('start', model.problem, to=request.sid)
            session['game'] = game
            sio.emit('join', { 'game_id': str(model.id), 'user_id': user.id }, room=model.id.int)
        except GameFullException:
            sio.emit('error', {'error_code': 2, 'description': 'game full', 'game_id':str(id)}, to=request.sid)
        except GameEndedException:
            sio.emit('error', {'error_code': 3, 'description': 'game ended', 'game_id': str(id)}, to=request.sid)
    else:
        # Create a new game instance
        game = Game()
        game.join(session['user'])
        session['game'] = game

        join_room(game.game_id.int)
        sio.emit('join', { 'game_id': str(game.game_id), 'user_id': user.id }, room=game.game_id.int)
        sio.emit('waiting', str(game.game_id))

@sio.on('editor_update')
def editor_update_handler(data: str):
    sio.emit('editor_update', data, room=session['game'].game_id.int, skip_sid=request.sid)

@sio.on('submission')
def submission_handler(data: dict):
    """Sends submission to the judge and sends the results to the game room. Ends the game when a player passes all test cases.

    :param data: submission source code
    """
    game = session['game']
    model = game.get()
    problem = db.session.get(Problem, model.problem)
    results = [0 for _ in range(len(problem.test_cases))]
    did_pass = True
    i = 0
    for test_case in problem.test_cases:
        r = requests.post(current_app.config['JUDGE_URL']+'/submissions?base64_encoded=true&wait=true', json={ # TODO use callback_url instead of waiting
            'source_code': data,
            'language_id': 54, # C++ GCC (see 'GET /languages' for the Judge0 langauge IDs)
            'stdin': b64encode(test_case.input.encode()).decode(),
            'expected_output': b64encode(test_case.output.encode()).decode()
        })
        j = r.json()
        if j['status']['id'] != 3:
            did_pass = False
        results[i] = {
            'user_id': session['user'].id,
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
    sio.emit('submission', results, room=game.game_id.int)
    if did_pass and model.state == GameState.STARTED:
        game.end(session['user'])
        sio.emit('end', session['user'].id, room=game.game_id.int)

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