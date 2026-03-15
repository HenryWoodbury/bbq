import { notFound } from "next/navigation"
import { getLeagueById } from "@/lib/queries/leagues"

type Props = {
  params: Promise<{ id: string }>
}

export default async function LeaguePage({ params }: Props) {
  const { id } = await params

  const league = await getLeagueById(id)
  if (!league) notFound()

  const latestSeason =
    league.seasons.length > 0 ? Math.max(...league.seasons) : null

  const scoringLabel = (() => {
    switch (league.template?.scoring) {
      case "FiveX5": return "5×5"
      case "FourX4": return "4×4"
      case "Fangraphs": return "FGPTs"
      case "SABR": return "SABR"
      case "Points": return "Points"
      default: return "—"
    }
  })()

  const typeLabel = league.template
    ? [league.template.draftType, league.template.playType].join(" · ")
    : "—"

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <InfoCard label="Format" value={scoringLabel} />
      <InfoCard label="Platform" value={league.template?.platform ?? "—"} />
      <InfoCard label="Season" value={latestSeason?.toString() ?? "—"} />
      <InfoCard label="Teams" value={league._count.teams.toString()} />
      <InfoCard label="Members" value={league._count.members.toString()} />
      <InfoCard label="Type" value={typeLabel} />
      {league.template?.cap != null && (
        <InfoCard label="Cap" value={`$${league.template.cap}`} />
      )}
      {league.hostLeagueUrl && (
        <div className="card p-4">
          <p className="mb-1 section-label">Host League</p>
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
      <p className="mb-1 section-label">{label}</p>
      <p className="card-title">{value}</p>
    </div>
  )
}
