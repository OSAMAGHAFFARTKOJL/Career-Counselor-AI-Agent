import { Badge } from '@/components/ui/badge';

const dna = [
  ['Builder', 'Ships concrete outcomes'],
  ['Strategist', 'Thinks in systems'],
  ['Analyst', 'Likes evidence'],
  ['Explorer', 'Learns by testing'],
  ['Leader', 'Coordinates people']
];

export function CareerDNAChips() {
  return (
    <div className="flex flex-wrap gap-3">
      {dna.map(([name, description]) => (
        <Badge key={name} variant="secondary" className="flex flex-col items-start gap-1 rounded-2xl px-4 py-3 text-left">
          <span className="text-sm font-semibold">{name}</span>
          <span className="max-w-36 text-[11px] font-normal leading-4 text-muted-foreground">{description}</span>
        </Badge>
      ))}
    </div>
  );
}