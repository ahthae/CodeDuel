from flask import Blueprint, current_app, jsonify, make_response, request, url_for
from flask_argon2 import Argon2
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, set_access_cookies, unset_jwt_cookies

from codeduel.models import db, User

jwt = JWTManager()
argon2 = Argon2()
bp = Blueprint('auth', __name__)

@bp.post('/login')
def login():
    username = request.json['username']
    password = request.json['password']

    user = db.session.scalar(db.select(user).where(user.username == username))
    if not user or not check_password(user.passhash, password):
        return jsonify({'message':'Invalid credentials.'}), 401

    response = jsonify({'message':'Login successful.'})
    access_token = create_access_token(identity=user)
    set_access_cookies(response, access_token)
    return response

@bp.post('/logout')
@jwt_required
def logout():
    response = jsonify({'message':'Logout successful.'})
    unset_jwt_cookies(response)
    return response

@bp.post('/register')
def register():
    data = request.json

    user = user(
        username=data['username'],
        passhash=hash_password(request.json['password']),
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({
        'id': user.id,
        'username': user.username,
        }), 201, { 'Location': url_for('user.user', id=user.id) }

@jwt.user_identity_loader
def jwt_identity_cb(user):
    return str(user.id)

@jwt.user_lookup_loader
def jwt_lookup_cb(jwt_header, jwt_data):
    id = int(jwt_data['sub'])
    return db.session.get(user, id)

def pepper_password(password):
    return password+current_app.config['PEPPER']

def hash_password(password):
    return argon2.generate_password_hash(pepper_password(password))

def check_password(passhash, password):
    return argon2.check_password_hash(passhash, pepper_password(password))