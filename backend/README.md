# CodeDuel

## Running
Copy the example `config.json` into the Flask instance folder
```bash
cd backend
mkdir instance
cp instance/example_config.json instance/config.json
```
Then, start the Judge0 server
```bash
cd docker/judge0
docker compose up -d db redis
sleep 10s
docker compose up -d
```
Finally, start the backend development server
```bash
python run.py
```
or
```bash
python codeduel/__init__.py
```

Start the frontend development server with
```bash
cd frontend
npm run dev
```

## Socket.IO
In-game communication happens over Socket.IO. The server creates a room for each game instance and players in a game are added to the room.

### Events
#### `connect`
Socket.IO connection event. auth argmuents are ignored and the session is autheticated with the HTTP request's JWT.

#### `join`
Sent by client join a game. 

Arguments:
- id: string - UUID of the game. An empty ID creates a new game instance and joins it.

#### `waiting`
Broadcast by the server when a game begins waiting for another player to join the game

Arguments:
- id: string - UUID of the open game.

#### `start`
Emitted by the server to the game room when the game has begun.

#### `editor_update`
Sent by client when their editor content has changed.
Re-broadcast by server to the game room so the other player's client can update.

Arguments:
- content: string - The updated editor content. Represents the entire content, not just a diff.

#### `submission`
Sent by client to submit an answer.
Sent back to client by server with results.

Arguments:
- code: string - Client only. Source code of the submission.
- test_cases: dict[] - Server only. Array of results for each test case. ex:`[{ 'description': 'Accepted', 'id': 3 }]`

## Credits
Example problem data taken from Competitive Coding Club at UC Riverside with permission.
