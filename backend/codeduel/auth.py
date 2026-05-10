from random import randint
from flask import Blueprint, current_app, jsonify, make_response, request, url_for
from flask_argon2 import Argon2
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, set_access_cookies, unset_jwt_cookies

from codeduel.models import db, User

jwt = JWTManager()
argon2 = Argon2()
bp = Blueprint('auth', __name__, url_prefix='/api')

@bp.post('/login')
def login():
    print("LOGIN REQUEST JSON:", request.json)
    
    username = request.json['username']
    password = request.json['password']

    user = db.session.scalar(db.select(User).where(User.username == username))
    if not user or not check_password(user.passhash, password):
        return jsonify({'message':'Invalid credentials.'}), 401

    # Set JWT
    response = jsonify({'message':'Login successful.'})
    access_token = create_access_token(identity=user)
    set_access_cookies(response, access_token)
    response.set_cookie('user_id', f'{user.id}')

    return response

@bp.post('/logout')
@jwt_required()
def logout():
    response = jsonify({'message':'Logout successful.'})
    unset_jwt_cookies(response)
    response.set_cookie('user_id', '', expires=0)
    return response

@bp.post('/register')
def register():
    data = request.json

    if db.session.scalar(db.select(User).where(User.username == data['username'])):
        return jsonify({'message': 'Username already exists'}), 409

    user = User(
        id=generate_user_id(),
        username=data['username'],
        passhash=hash_password(request.json['password'])
    )
    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        print("REGISTER ERROR:", e)
        return jsonify({'message': str(e)}), 500

    return jsonify({
        'id': user.id,
        'username': user.username,
        }), 201, { 'Location': url_for('user.user', id=user.id) }

@jwt.user_identity_loader
def jwt_identity_cb(user):
    return str(user.id)

@jwt.user_lookup_loader
def jwt_lookup_cb(jwt_header, jwt_data):
    user_id = int(jwt_data["sub"])
    return db.session.get(User, user_id)

def pepper_password(password):
    return password+current_app.config['PEPPER']

def hash_password(password):
    return argon2.generate_password_hash(pepper_password(password))

def check_password(passhash, password):
    return argon2.check_password_hash(passhash, pepper_password(password))

def generate_user_id():
    timeout = 10_000
    user_id = randint(1, 1000)

    while db.session.get(User, user_id) is not None:
        user_id = randint(1, 1000)
        timeout -= 1
        if timeout <= 0:
            raise Exception("Could not generate unique user id")

    return user_id