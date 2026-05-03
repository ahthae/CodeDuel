from flask_socketio import SocketIO

sio = SocketIO()

@sio.on('connect')
def connect_handler():
    pass