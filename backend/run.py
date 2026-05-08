from codeduel import create_app
from codeduel.game import sio

app = create_app()

if __name__ == "__main__":
    sio.run(app, host="127.0.0.1", port=5000, debug=True)