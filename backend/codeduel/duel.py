from flask import Blueprint, current_app, jsonify, request
from uuid import UUID

from codeduel.models import db, Duel, User

bp = Blueprint('duel', __name__, url_prefix='/api/duel')

@bp.get('/')
def duel_get_all():
    duels = []
    if 'player' in request.args:
        player_id = request.args['player']

        duels = db.session.scalars(db.select(Duel).from_statement(db.union_all(
            db.select(Duel).where(Duel.player1 == player_id),
            db.select(Duel).where(Duel.player2 == player_id)
            ))).all()
    # elif 'winner' in request.args: TODO
    else:
        duels = db.session.scalars(db.select(Duel)).all()
    return jsonify([ duel.to_dict() for duel in duels ])

@bp.get('/<uuid:id>')
def duel_get(id):
    duel = db.get_or_404(Duel, id)
    return jsonify(duel.to_dict())
