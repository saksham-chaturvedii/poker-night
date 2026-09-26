import { Screen } from "../components/Screen";
import { MoneyAmount } from "../components/MoneyAmount";
import { formatMoney } from "../lib/format";
import type { Game } from "../types";

type HistoryProps = {
  history: Game[];
  onBack: () => void;
};

export function History({ history, onBack }: HistoryProps) {
  return (
    <Screen title="Past Games" onBack={onBack}>
      {history.length === 0 && <p className="text-small">No finished games yet.</p>}
      <div className="history-list">
        {history.map((game) => {
          const totalPot = game.players.reduce((a, p) => a + p.totalIn, 0);
          return (
            <div className="card" key={game.id}>
              <p className="card-title">
                {new Date(game.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
              <div className="history-meta">
                <span>{game.players.length} players</span>
                <span>pot {formatMoney(totalPot)}</span>
              </div>
              {game.players
                .slice()
                .sort((a, b) => (b.cashOut ?? 0) - b.totalIn - ((a.cashOut ?? 0) - a.totalIn))
                .map((p) => {
                  const net = (p.cashOut ?? 0) - p.totalIn;
                  return (
                    <div className="net-row" key={p.id}>
                      <span>{p.name}</span>
                      <MoneyAmount value={net} variant="sm" signed />
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
