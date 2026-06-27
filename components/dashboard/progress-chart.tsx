"use client";

import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

export function ProgressChart({ progress }: { progress: number }) {
  const data = [{ name: 'completion', value: progress, fill: 'hsl(var(--primary))' }];

  return (
    <div className="h-72 rounded-3xl border border-border/60 bg-background p-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={999} background={{ fill: 'hsl(var(--muted))' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="-mt-40 text-center">
        <p className="text-4xl font-semibold">{progress}%</p>
        <p className="mt-2 text-sm text-muted-foreground">Career profile completion</p>
      </div>
    </div>
  );
}