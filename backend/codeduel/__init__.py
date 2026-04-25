import json
from flask import Flask

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)

    if test_config is not None:
        app.config.from_mapping(test_config)
    else: 
        app.config.from_file('config.json', load=json.load, silent=True)

    # blueprints

    # init_apps

    with app.app_context():
        db.create_all()

    return app
