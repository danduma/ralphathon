import type { RaceEvent } from "../shared/types";

interface EventLogProps {
  events: RaceEvent[];
  compact?: boolean;
}

export function EventLog({ events, compact = false }: EventLogProps) {
  const visibleEvents = [...events].slice(compact ? -8 : -18).reverse();

  return (
    <section className="event-log" aria-label="Typed race event log">
      <header className="panel-header">
        <span>Event stream</span>
        <strong>{events.length}</strong>
      </header>
      <div className="log-list">
        {visibleEvents.map((event) => (
          <article className={`log-row ${event.severity}`} key={event.id}>
            <span className="log-id">#{event.id.toString().padStart(3, "0")}</span>
            <span className="log-type">{event.type}</span>
            <span className="log-label">{event.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
