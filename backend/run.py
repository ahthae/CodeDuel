import contextlib
import requests
import subprocess
import time
from codeduel import create_app
from codeduel.game import sio

app = create_app()

if __name__ == "__main__":
    # Start Judge0 if necessary
    if requests.get(app.config['JUDGE_URL']+'/about').status_code != 200:
        print("Starting Judge0")
        with contextlib.chdir('docker/judge0'):
            subprocess.run(["docker","compose","up", "-d", "db", "redis"])
            print("Waiting 10s for DB and Redis to settle") # https://github.com/judge0/judge0/issues/567#issuecomment-3418212866
            time.sleep(10)
            subprocess.run(["docker","compose","up", "-d"])
        print("Judge0 started")
    else:
        print("Judge0 already running")

    sio.run(app, host="127.0.0.1", port=5000, debug=True)