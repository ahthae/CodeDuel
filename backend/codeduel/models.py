import enum
import uuid
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Identity, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON
from typing import List, Optional

db = SQLAlchemy(engine_options={'connect_args':{'autocommit': False}})
class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, unique=True)
    username: Mapped[str] = mapped_column(unique=True)
    passhash: Mapped[str] = mapped_column(nullable=False)
    role: Mapped[int] = mapped_column(default=0) # 0: user, 9: admin
    games_played: Mapped[int] = mapped_column(default=0)
    games_won: Mapped[int] = mapped_column(default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'games_played': self.games_played,
            'games_won': self.games_won
        }

class Problem(db.Model):
    id: Mapped[int] = mapped_column(Identity(), primary_key=True)
    name: Mapped[str]
    description: Mapped[str]
    test_cases: Mapped[List['TestCase']] = relationship(back_populates='problem', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'test_cases': [test_case.to_dict() for test_case in self.test_cases]
        }

class TestCase(db.Model):
    id: Mapped[int] = mapped_column(Identity(), primary_key=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey('problem.id'))
    problem: Mapped['Problem'] = relationship(back_populates='test_cases')
    input: Mapped[Optional[str]]
    output: Mapped[Optional[str]]

    def to_dict(self):
        return {
            'id': self.id,
            'problem_id': self.problem_id,
            'input': self.input,
            'output': self.output
        }

class GameState(enum.IntEnum):
    CREATED = 0
    WAITING = 1
    STARTED = 2
    FINISHED = 3

class Duel(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    player1: Mapped[Optional[int]] = mapped_column(ForeignKey(User.id))
    player2: Mapped[Optional[int]] = mapped_column(ForeignKey(User.id))
    problem: Mapped[Optional[int]] = mapped_column(ForeignKey(Problem.id))
    winner: Mapped[Optional[int]] = mapped_column(nullable=True) # 1 or 2 for player 1 and player 2 respectively
    state: Mapped[GameState] = mapped_column(default=GameState.WAITING)

    def to_dict(self):
        return {
            'id': str(self.id),
            'player1': self.player1,
            'player2': self.player2,
            'problem': self.problem,
            'winner': self.winner,
            'state': self.state
        }
