from flask import Blueprint, current_app, request

from codeduel.models import db, Duel

bp = Blueprint('duel', __name__)

@bp.get('/')
def game_get_all():
    duels = db.session.scalars(db.select(Duel)).all()
    return jsonify([ duel.to_dict for duel in duels ])