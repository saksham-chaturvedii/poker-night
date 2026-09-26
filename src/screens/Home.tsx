import { MoneyAmount } from "../components/MoneyAmount";
import type { Game } from "../types";

type HomeProps = {
  activeGame: Game | null;
  history: Game[];
  onNewGame: () => void;
  onResume: () => void;
  onOpenHistory: () => void;
};

export function Home({ activeGame, history, onNewGame, onResume, onOpenHistory }: HomeProps) {
  const totalPot = activeGame?.players.reduce((a, p) => a + p.totalIn, 0) ?? 0;

  return (
    <div className="screen">
      <header className="screen-header screen-header-home">
        <h1 className="text-display">🃏 Poker Night</h1>
        <p className="subtitle">Chips, buy-ins, and settle-up — sorted.</p>
      </header>
      <div className="screen-body">
        {activeGame && (
          <button className="active-game-block" onClick={onResume}>
            <div className="active-game-label">
              <span className="text-section">Game in progress</span>
              <span className="active-game-meta">{activeGame.players.length} players</span>
            </div>
            <MoneyAmount value={totalPot} variant="hero" />
            <span className="text-small">Tap to resume →</span>
          </button>
        )}

        <button className="btn btn-primary btn-large" onClick={onNewGame}>
          + New Game
        </button>

        {history.length > 0 && (
          <button className="btn-text" onClick={onOpenHistory}>
            Past games ({history.length})
          </button>
        )}
      </div>
    </div>
  );
}
