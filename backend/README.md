# CodeDuel

## Socket.IO
In-game communication happens over Socket.IO. The server creates a room for each game instance and players in a game are added to the room.

### Events
- 'connect' Socket.IO connection event. 
- 'join' Sent by client with game ID to join a game. An empty message creates a new game instance and joins it.
- 'waiting' Emitted by the server when waiting for antoher player to join the game
