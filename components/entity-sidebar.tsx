import Link from 'next/link';
import type { Entity, EntityType } from '@/types';
import { cn } from '@/lib/utils';

const typeLabels: Record<EntityType, string> = {
  person: 'People',
  organization: 'Organizations',
  institution: 'Institutions',
  location: 'Locations',
};

const typeIcons: Record<EntityType, string> = {
  person: 'P',
  organization: 'O',
  institution: 'I',
  location: 'L',
};

export function EntitySidebar({ entities }: { entities: Entity[] }) {
  const grouped = entities.reduce(
    (acc, e) => {
      if (!acc[e.type]) acc[e.type] = [];
      acc[e.type].push(e);
      return acc;
    },
    {} as Record<EntityType, Entity[]>
  );

  const order: EntityType[] = ['person', 'organization', 'institution', 'location'];

  return (
    <div className="border border-border bg-card p-5">
      <h3 className="mb-4 font-serif text-lg font-bold tracking-tight">
        Entities
      </h3>
      <div className="space-y-5">
        {order.map((type) => {
          const items = grouped[type];
          if (!items || items.length === 0) return null;
          return (
            <div key={type}>
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {typeLabels[type]}
              </h4>
              <ul className="space-y-1">
                {items.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/entity/${e.id}`}
                      className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm transition-colors hover:bg-accent"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border text-[10px] font-bold text-muted-foreground">
                        {typeIcons[e.type]}
                      </span>
                      <span className="hover:underline">{e.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {entities.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No entities extracted for this story.
          </p>
        )}
      </div>
    </div>
  );
}

export function EntityCard({ entity }: { entity: Entity }) {
  return (
    <Link
      href={`/entity/${entity.id}`}
      className="group flex flex-col border border-border bg-card p-4 transition-all hover:border-foreground/30 hover:shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-sm border border-border font-serif text-sm font-bold'
          )}
        >
          {entity.name.charAt(0)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {entity.type}
        </span>
      </div>
      <h3 className="mb-1 font-serif text-base font-semibold leading-snug tracking-tight">
        <span className="bg-gradient-to-r from-foreground to-foreground bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
          {entity.name}
        </span>
      </h3>
      {entity.subtitle && (
        <p className="mb-2 text-xs text-muted-foreground">{entity.subtitle}</p>
      )}
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {entity.description}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{entity.mentionCount} mentions</span>
        <span className="text-foreground group-hover:underline">Explore →</span>
      </div>
    </Link>
  );
}
