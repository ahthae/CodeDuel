from flask import Blueprint, jsonify, request

from codeduel.models import db, Problem

bp = Blueprint('problem', __name__, url_prefix='/api/problem')

@bp.get('/')
def problem_get_all():
    problems = db.session.scalars(db.select(Problem)).all()
    return jsonify([ problem.to_dict() for problem in problems ])

@bp.get('/<int:id>')
def problem_get(id):
    problem = db.get_or_404(Problem, id)
    return jsonify(problem.to_dict())

