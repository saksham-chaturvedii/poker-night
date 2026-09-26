import type { ReactNode } from "react";

type ScreenProps = {
  title: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Screen({ title, onBack, children, footer }: ScreenProps) {
  return (
    <div className="screen">
      <header className="screen-header">
        {onBack ? (
          <button className="icon-btn" onClick={onBack} aria-label="Back">
            ←
          </button>
        ) : (
          <span className="icon-btn-spacer" />
        )}
        <h1 className="text-page-title">{title}</h1>
        <span className="icon-btn-spacer" />
      </header>
      <div className="screen-body">{children}</div>
      {footer && <div className="screen-footer">{footer}</div>}
    </div>
  );
}
