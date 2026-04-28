from typing import Optional

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Identity, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

db = SQLAlchemy()

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, unique=True)
    username: Mapped[str] = mapped_column(unique=True)
    password: Mapped[str] = mapped_column(nullable=False)
    games_played: Mapped[int] = mapped_column(default=0)
    games_won: Mapped[int] = mapped_column(default=0)

class Problem(db.Model):
    id: Mapped[int] = mapped_column(Identity(), primary_key=True)
    name; Mapped[str]
    description: Mapped[str]
    solver_url: Mapped[str] = mapped_column(nullable=False)

class TestCase(db.Model):
    id: Mapped[int] = mapped_column(Identity(), primary_key=True)
    problem: Mapped[int] = mapped_column(ForeignKey(Problem.id))
    input: Mapped[str]
    output: Mapped[str]

    def to_dict(self):
        return {
            'id': self.id,
            'problem': self.problem,
            'input': self.input,
            'output': self.output
        }

class Duel(db.Model):
    id: Mapped[int] = mapped_column(Identity(), primary_key=True)
    player1: Mapped[int] = mapped_column(ForeignKey(User.id))
    player2: Mapped[int] = mapped_column(ForeignKey(User.id))
    problem: Mapped[int] = mapped_column(ForeignKey(Problem.id))
    winner: Mapped[int] # 1 or 2 for player 1 and player 2 respectively

    def to_dict(self):
        return {
            'id': self.id,
            'player1': self.player1,
            'player2': self.player2,
            'problem': self.problem,
            'winner': self.winner
        }
