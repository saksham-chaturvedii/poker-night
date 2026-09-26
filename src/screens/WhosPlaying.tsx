import { Screen } from "../components/Screen";

type WhosPlayingProps = {
  playerNames: string[];
  onChange: (names: string[]) => void;
  onBack: () => void;
  onNext: () => void;
};

export function WhosPlaying({ playerNames, onChange, onBack, onNext }: WhosPlayingProps) {
  const filledCount = playerNames.map((n) => n.trim()).filter(Boolean).length;
  const canProceed = filledCount >= 2;

  const updateName = (i: number, value: string) => {
    onChange(playerNames.map((n, idx) => (idx === i ? value : n)));
  };

  const addField = () => onChange([...playerNames, ""]);
  const removeField = (i: number) =>
    onChange(playerNames.length > 2 ? playerNames.filter((_, idx) => idx !== i) : playerNames);

  return (
    <Screen
      title="Who's Playing"
      onBack={onBack}
      footer={
        <button className="btn btn-primary btn-large" disabled={!canProceed} onClick={onNext}>
          Next →
        </button>
      }
    >
      <section className="section">
        <h2 className="text-section">Who's playing</h2>
        {playerNames.map((name, i) => (
          <div className="row-input" key={i}>
            <input
              className="text-input"
              placeholder={`Player ${i + 1}`}
              value={name}
              autoFocus={i === 0}
              onChange={(e) => updateName(i, e.target.value)}
            />
            {playerNames.length > 2 && (
              <button className="icon-btn" aria-label="Remove player" onClick={() => removeField(i)}>
                ✕
              </button>
            )}
          </div>
        ))}
        <button className="btn-text" onClick={addField}>
          + Add player
        </button>
      </section>
    </Screen>
  );
}
