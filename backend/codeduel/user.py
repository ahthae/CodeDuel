from flask import Blueprint, jsonify, make_response, redirect, request, url_for
from flask_jwt_extended import current_user, jwt_required

from codeduel.models import db, User
from codeduel.auth import hash_password

bp = Blueprint('user', __name__, url_prefix='/api/user')

@bp.get('/')
@jwt_required()
def user_get_all():
    if current_user.role == 0:
        return make_response(), 403
    users = db.session.scalars(db.select(User)).all()
    return jsonify([user.to_dict() for user in users])

@bp.put('/')
@jwt_required()
def user_put():
    data = request.get_json()

    if current_user.role == 0:
        return jsonify({'message':'Unauthorized method.'}), 403

    try:
        user = User(
            id=data['id'],
            username=data['username'],
            passhash=hash_password(data['password']),
        )
    except KeyError:
        return jsonify({'message':'Missing required data.'}), 400

    db.session.add(user)
    db.session.commit()

    return jsonify(user.to_dict()), 201, { 'Location': url_for('user.user', id=user.id) }

@bp.route('/<string:username>', methods=['GET', 'POST', 'DELETE'])
def user_username(username):
    id = db.one_or_404(db.select(User.id).where(User.username == username))
    return redirect(url_for('user.user', id=id))

@bp.route('/<int:id>', methods=['GET', 'POST', 'DELETE'])
@jwt_required(optional=True)
def user(id):
    user = db.get_or_404(User, id, description=f'User with ID {id} not found.')

    if (request.method == 'DELETE'):
        db.session.delete(user)
        db.session.commit()
        return make_response(), 204
        

    if (request.method == 'POST'):
        if not current_user or current_user.role == 0:
            return make_response(), 403
        data = request.json
        if 'id' in data: user.id = data['id']
        if 'username' in data: user.username = data['username']
        if 'password' in data: user.passhash = hash_password(data['password'])
        db.session.commit()

    data = user.to_dict()

    return data