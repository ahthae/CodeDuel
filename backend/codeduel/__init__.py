import json
import re
from flask import Flask
from flask_cors import CORS

from codeduel.game import sio

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    cors = CORS(app, supports_credentials=True) # Allows CORS

    if test_config is not None:
        app.config.from_mapping(test_config)
    else: 
        app.config.from_file('config.json', load=json.load, silent=True)

    from codeduel import auth, duel, game, models, problem, user

    models.db.init_app(app)
    auth.argon2.init_app(app)
    auth.jwt.init_app(app)
    game.sio.init_app(app)

    app.register_blueprint(auth.bp)
    app.register_blueprint(user.bp)
    app.register_blueprint(duel.bp)
    app.register_blueprint(problem.bp)

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def index(path):
        return app.send_static_file("index.html")

    with app.app_context():
        models.db.create_all()

    return app

def init_db(app: Flask) -> None:
    import codeduel
    from codeduel.models import db, Duel, GameState, Problem, TestCase, User

    with open('example_data/example_data.json', 'r') as f:
        data = json.load(f)
        with app.app_context():
            db.create_all()

            db.session.add_all([
                User(username=user['username'],
                     passhash=codeduel.auth.hash_password(user['username']))
                for user in data['users']])
            db.session.add_all([
                    Duel(player1=duel['player1'],
                         player2=duel['player2'],
                         problem=duel['problem'],
                         winner=duel['winner'],
                         state=GameState.FINISHED)
                    for duel in data['duels']])
            for problem in data['problems']:
                record = Problem(name=problem['name'])
                with open('example_data/'+problem['description_file'], 'r') as desc_f:
                    record.description = desc_f.read()
                for test_case in zip(problem['test_cases'][0], problem['test_cases'][1]):
                    test_case_record = TestCase(input=test_case[0], output=test_case[1])
                    record.test_cases.append(test_case_record)
                    db.session.add(test_case_record)
                db.session.add(record)

            db.session.commit()

if __name__ == "__main__":
    app = create_app()
    sio.run(app)