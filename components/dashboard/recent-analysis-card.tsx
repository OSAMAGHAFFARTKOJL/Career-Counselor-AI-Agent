export function RecentAnalysisCard({ analysis }: { analysis: any }) {
  if (!analysis) {
    return <p className="text-sm text-muted-foreground">No analysis yet. Upload a resume or start a conversation to generate your first career report.</p>;
  }

  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <p className="text-base font-semibold text-foreground">{analysis.title}</p>
      <p>{analysis.summary ?? 'Analysis available from recent session.'}</p>
      <pre className="overflow-auto rounded-2xl bg-muted p-4 text-xs leading-6 text-foreground">{JSON.stringify(analysis.payload, null, 2)}</pre>
    </div>
  );
}