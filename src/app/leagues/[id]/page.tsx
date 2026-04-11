import { notFound } from "next/navigation"
import { getLeagueById } from "@/lib/queries/leagues"
import { scoringLabel } from "@/lib/queries/formats"

type Props = {
  params: Promise<{ id: string }>
}

export default async function LeaguePage({ params }: Props) {
  const { id } = await params

  const league = await getLeagueById(id)
  if (!league) notFound()

  const latestSeason =
    league.seasons.length > 0 ? Math.max(...league.seasons) : null

  const scoring = scoringLabel(league.format?.scoring)

  const typeLabel = league.format
    ? [league.format.draftType, league.format.playType].join(" · ")
    : "—"

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <InfoCard label="Format" value={scoring} />
      <InfoCard label="Platform" value={league.format?.platform ?? "—"} />
      <InfoCard label="Season" value={latestSeason?.toString() ?? "—"} />
      <InfoCard label="Teams" value={league._count.teams.toString()} />
      <InfoCard label="Members" value={league._count.members.toString()} />
      <InfoCard label="Type" value={typeLabel} />
      {league.format?.cap != null && (
        <InfoCard label="Cap" value={`$${league.format.cap}`} />
      )}
      {league.hostLeagueUrl && (
        <div className="card p-4">
          <p className="mb-1">Host League</p>
          <a
            href={league.hostLeagueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link text-sm"
          >
            {league.hostLeagueUrl}
          </a>
        </div>
      )}
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="mb-1">{label}</p>
      <p className="card-title">{value}</p>
    </div>
  )
}
