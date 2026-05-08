import json
import re
from flask import Flask
from flask_cors import CORS


# from codeduel.game import sio

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    cors = CORS(app, supports_credentials=True) # Allows CORS on localhost for development

    if test_config is not None:
        app.config.from_mapping(test_config)
    else: 
        import os
        with open(os.path.join(app.root_path, "..", "config.json")) as f:
            app.config.update(json.load(f))

    from codeduel import auth, duel, game, models, problem, user

    models.db.init_app(app)
    auth.argon2.init_app(app)
    auth.jwt.init_app(app)
    game.sio.init_app(app)

    app.register_blueprint(auth.bp)
    app.register_blueprint(user.bp)
    app.register_blueprint(duel.bp)
    app.register_blueprint(problem.bp)


    with app.app_context():
        models.db.create_all()

    return app

# if __name__ == "__main__":
#     app = create_app()
#     sio.run(app)