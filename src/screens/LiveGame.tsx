import { useState } from "react";
import { Screen } from "../components/Screen";
import { PlayerRow } from "../components/PlayerRow";
import { MoneyAmount } from "../components/MoneyAmount";
import type { Game } from "../types";

type LiveGameProps = {
  game: Game;
  onBack: () => void;
  onRebuy: (playerId: string) => void;
  onUndoRebuy: (playerId: string) => void;
  onAddLatePlayer: (name: string) => void;
  onCashOut: () => void;
};

export function LiveGame({ game, onBack, onRebuy, onUndoRebuy, onAddLatePlayer, onCashOut }: LiveGameProps) {
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [newName, setNewName] = useState("");

  const totalPot = game.players.reduce((a, p) => a + p.totalIn, 0);

  return (
    <Screen
      title="Live Game"
      onBack={onBack}
      footer={
        <button className="btn btn-primary btn-large" onClick={onCashOut}>
          Cash out →
        </button>
      }
    >
      <div className="pot-hero">
        <span className="text-section">Total pot</span>
        <MoneyAmount value={totalPot} variant="hero" />
      </div>

      <div className="player-list">
        {game.players.map((player) => (
          <PlayerRow
            key={player.id}
            name={player.name}
            meta={`×${player.buyIns}`}
            amount={<MoneyAmount value={player.totalIn} variant="md" />}
            action={
              <>
                {player.buyIns > 1 && (
                  <button
                    type="button"
                    className="undo-rebuy-btn"
                    aria-label={`Undo rebuy for ${player.name}`}
                    title="Undo rebuy"
                    onClick={() => onUndoRebuy(player.id)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
                <button className="btn btn-rebuy" onClick={() => onRebuy(player.id)}>
                  + Rebuy
                </button>
              </>
            }
          />
        ))}
      </div>

      {addingPlayer ? (
        <div className="row-input">
          <input
            className="text-input"
            placeholder="Player name"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (newName.trim()) onAddLatePlayer(newName.trim());
              setNewName("");
              setAddingPlayer(false);
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <button className="btn btn-secondary btn-large" onClick={() => setAddingPlayer(true)}>
          + Add late player
        </button>
      )}
    </Screen>
  );
}
