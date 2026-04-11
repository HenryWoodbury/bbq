"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DownloadIcon, PencilIcon, Trash2Icon, Undo2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { FilterGroup } from "@/components/filter-group"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { AL_TEAM_CODES, NL_TEAM_CODES } from "@/lib/team-codes"

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlayerRow = {
  id: string
  ottoneuId: number | null
  /** ASCII name from SFBB PLAYERNAME — search fallback */
  playerName: string
  /** Preferred display name from SFBB FGSPECIALCHAR — includes diacritics/accents */
  fgSpecialChar: string | null
  firstName: string | null
  /** For sort */
  lastName: string | null
  active: boolean
  /** ISO date string "YYYY-MM-DD" */
  birthday: string | null
  team: string | null
  mlbLevel: string | null
  league: string | null
  fangraphsId: string | null
  nickname: string | null
  bats: string | null
  throws: string | null
  /** Ottoneu-specific eligible positions; empty if no universe entry */
  ottoneuPositions: string[]
  /** PlayerUniverse.fangraphsId — "sa…" prefix indicates MiLB */
  universeFgId: string | null
  /** ID of the PlayerOverride record, if one exists and is active */
  overrideId: string | null
  /** true if this row originates from a manual PlayerOverride (no SFBB record) */
  isManual: boolean
  /** Underlying player values before any override; null for manual rows */
  baseFields: PlayerBaseFields | null
}

export type PlayerBaseFields = {
  displayName: string
  firstName: string | null
  lastName: string | null
  birthday: string | null
  team: string | null
  mlbLevel: string | null
  league: string | null
  active: boolean
  bats: string | null
  throws: string | null
  positions: string[]
}

export type StatRow = {
  playerId: string
  playerName: string
  ottoneuId: number | null
  fangraphsId: string | null
  mlbLevel: string | null
  team: string | null
  active: boolean
  stats: Record<string, number | string | null>
}

export type StatsFilter = {
  playerType: "BATTER" | "PITCHER"
  season: number
  projection: string
  split: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AL_TEAMS = new Set(AL_TEAM_CODES)
const NL_TEAMS = new Set(NL_TEAM_CODES)
const ALL_TEAM_CODES = [...AL_TEAM_CODES, ...NL_TEAM_CODES].sort()

const BATTING_COLS = [
  "G",
  "PA",
  "HR",
  "R",
  "RBI",
  "SB",
  "BB%",
  "K%",
  "ISO",
  "BABIP",
  "AVG",
  "OBP",
  "SLG",
  "wOBA",
]
const PITCHING_COLS = [
  "W",
  "L",
  "SV",
  "G",
  "GS",
  "IP",
  "K/9",
  "BB/9",
  "HR/9",
  "BABIP",
  "LOB%",
  "GB%",
  "HR/FB",
  "ERA",
  "FIP",
]

function emptyCell() {
  return <span className="text-muted-foreground">—</span>
}

// ── Filter helpers ────────────────────────────────────────────────────────────

/** Strip diacritics so "ramirez" matches "Ramírez", "rodriguez" matches "Rodríguez", etc. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function hasActiveOverride(row: PlayerRow): boolean {
  if (!row.overrideId) return false
  if (!row.baseFields) return true // manual rows — the whole record is the override
  const b = row.baseFields
  return (
    (row.fgSpecialChar ?? row.playerName ?? null) !== (b.displayName ?? null) ||
    (row.firstName ?? null) !== (b.firstName ?? null) ||
    (row.lastName ?? null) !== (b.lastName ?? null) ||
    (row.birthday ?? null) !== (b.birthday ?? null) ||
    (row.team ?? null) !== (b.team ?? null) ||
    (row.mlbLevel ?? null) !== (b.mlbLevel ?? null) ||
    (row.league ?? null) !== (b.league ?? null) ||
    row.active !== b.active ||
    (row.bats ?? null) !== (b.bats ?? null) ||
    (row.throws ?? null) !== (b.throws ?? null) ||
    row.nickname !== null ||
    row.ottoneuPositions.join("/") !== b.positions.join("/")
  )
}

function isMiLBFgId(fgId: string | null): boolean {
  return fgId !== null && fgId.startsWith("sa")
}

function isMajorLeague(row: PlayerRow): boolean {
  const fgId = row.universeFgId ?? row.fangraphsId
  return fgId !== null && !isMiLBFgId(fgId)
}

function isMinorLeague(row: PlayerRow): boolean {
  return isMiLBFgId(row.universeFgId ?? row.fangraphsId)
}

function isAL(team: string | null): boolean {
  return AL_TEAMS.has(team ?? "")
}

function isNL(team: string | null): boolean {
  return NL_TEAMS.has(team ?? "")
}

function isPitcher(row: PlayerRow): boolean {
  return row.ottoneuPositions.some((p) => p === "SP" || p === "RP")
}

function isUtil(row: PlayerRow): boolean {
  return row.ottoneuPositions.some((p) => p !== "SP" && p !== "RP")
}

const PITCHER_POSITIONS = new Set<PositionFilter>(["SP", "RP"])

// ── Stat formatting ───────────────────────────────────────────────────────────

const PCT_STATS = new Set(["BB%", "K%", "LOB%", "GB%", "HR/FB"])
const RATE_STATS = new Set([
  "AVG",
  "OBP",
  "SLG",
  "wOBA",
  "BABIP",
  "ISO",
  "ERA",
  "FIP",
])
const PER9_STATS = new Set(["K/9", "BB/9", "HR/9"])

function fmtStat(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—"
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  if (PCT_STATS.has(key)) return `${(n * 100).toFixed(1)}%`
  if (RATE_STATS.has(key)) return n.toFixed(3)
  if (PER9_STATS.has(key)) return n.toFixed(2)
  if (key === "IP") return n.toFixed(1)
  return Math.round(n).toString()
}

// ── Profile column definitions ────────────────────────────────────────────────

const profileColumns: ColumnDef<PlayerRow, unknown>[] = [
  {
    accessorKey: "ottoneuId",
    header: "Ott ID",
    size: 60,
    cell: ({ getValue }) => {
      const v = getValue() as number | null
      return v ?? emptyCell()
    },
  },
  {
    id: "fgId",
    accessorFn: (row) => row.fangraphsId ?? row.universeFgId,
    header: "FG ID",
    size: 60,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      if (!v) return emptyCell()
      return (
        <a
          href={`https://www.fangraphs.com/statss.aspx?playerid=${v}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {v}
        </a>
      )
    },
  },
  {
    id: "displayName",
    accessorFn: (row) => row.fgSpecialChar ?? row.playerName,
    header: "Name",
    size: 150,
    sortingFn: (a, b) => {
      const key = (row: PlayerRow) => {
        if (row.lastName) return row.lastName
        const words = row.playerName.trim().split(/\s+/)
        return words[words.length - 1]
      }
      return key(a.original).localeCompare(key(b.original))
    },
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "birthday",
    header: "Birthdate",
    size: 90,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? emptyCell()
    },
  },
  {
    accessorKey: "team",
    header: "Team",
    size: 60,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? emptyCell()
    },
  },
  {
    accessorKey: "league",
    header: "LG",
    size: 60,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? emptyCell()
    },
  },
  {
    accessorKey: "bats",
    header: "B",
    size: 40,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? emptyCell()
    },
  },
  {
    accessorKey: "throws",
    header: "T",
    size: 40,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? emptyCell()
    },
  },
  {
    accessorKey: "ottoneuPositions",
    header: "Positions",
    size: 100,
    sortingFn: (a, b) =>
      a.original.ottoneuPositions
        .join("/")
        .localeCompare(b.original.ottoneuPositions.join("/")),
    cell: ({ getValue }) => {
      const pos = getValue() as string[]
      return pos.length > 0 ? pos.join("/") : emptyCell()
    },
  },
]

// ── Filter types ──────────────────────────────────────────────────────────────

type ActiveFilter = "yes" | "no" | "all"
type LevelFilter = "all" | "mlb" | "milb"
type MLBLeagueFilter = "all" | "al" | "nl" | "other"
type StatusFilter = "all" | "adds" | "overrides"
type PositionFilter =
  | "all"
  | "C"
  | "1B"
  | "2B"
  | "3B"
  | "SS"
  | "OF"
  | "Util"
  | "SP"
  | "RP"

// ── Component ─────────────────────────────────────────────────────────────────

export function PlayersTable({
  data,
  statRows,
  availableYears,
  availableProjections,
  availableSplits,
  statsFilter,
  initialShow = "profiles" as "profiles" | "batting" | "pitching",
  playerExports = [],
  onEdit,
  onClearOverride,
}: {
  data: PlayerRow[]
  statRows: StatRow[]
  availableYears: number[]
  availableProjections: string[]
  availableSplits: string[]
  statsFilter: StatsFilter
  initialShow?: "profiles" | "batting" | "pitching"
  playerExports?: string[]
  onEdit?: (row: PlayerRow) => void
  onClearOverride?: (row: PlayerRow) => void
}) {
  const router = useRouter()
  const [show, setShow] = useState<"profiles" | "batting" | "pitching">(
    initialShow,
  )
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("yes")
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("mlb")
  const [mlbLeagueFilter, setMlbLeagueFilter] = useState<MLBLeagueFilter>("all")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  function handleShowChange(v: string) {
    const newShow = v as "profiles" | "batting" | "pitching"
    setShow(newShow)
    // Reset position filter if incompatible with the new tab
    if (newShow === "batting" && PITCHER_POSITIONS.has(positionFilter)) {
      setPositionFilter("all")
    } else if (
      newShow === "pitching" &&
      positionFilter !== "all" &&
      !PITCHER_POSITIONS.has(positionFilter)
    ) {
      setPositionFilter("all")
    }
    if (newShow === "batting") {
      pushStatsFilter({ spt: "BATTER" })
    } else if (newShow === "pitching") {
      pushStatsFilter({ spt: "PITCHER" })
    } else {
      router.push("/admin/players?show=profiles")
    }
  }

  function handleLeagueChange(v: string) {
    setMlbLeagueFilter(v as MLBLeagueFilter)
    setTeamFilter("all")
  }

  function deriveLeagueParam(): string {
    if (levelFilter === "milb") return "milb"
    if (mlbLeagueFilter === "al") return "al"
    if (mlbLeagueFilter === "nl") return "nl"
    if (levelFilter === "mlb") return "mlb"
    return "all"
  }

  function triggerExport(
    playerType: "BATTER" | "PITCHER",
    format: "csv" | "json",
  ) {
    const sp = new URLSearchParams({
      season: String(statsFilter.season),
      projection: statsFilter.projection,
      playerType,
      active: activeFilter,
      league: deriveLeagueParam(),
      format,
    })
    window.location.href = `/api/admin/export/batcast?${sp.toString()}`
  }

  function pushStatsFilter(updates: Record<string, string>) {
    const effectiveShow = show === "profiles" ? "batting" : show
    const sp = new URLSearchParams({
      show: effectiveShow,
      spt: statsFilter.playerType,
      sse: String(statsFilter.season),
      spr: statsFilter.projection,
      ssp: statsFilter.split,
      ...updates,
    })
    router.push(`/admin/players?${sp.toString()}`)
  }

  // ── Profile filtering ──────────────────────────────────────────────────────

  let displayedProfiles = data

  if (activeFilter === "yes")
    displayedProfiles = displayedProfiles.filter((r) => r.active)
  else if (activeFilter === "no")
    displayedProfiles = displayedProfiles.filter((r) => !r.active)

  if (levelFilter === "mlb")
    displayedProfiles = displayedProfiles.filter(isMajorLeague)
  else if (levelFilter === "milb")
    displayedProfiles = displayedProfiles.filter(isMinorLeague)

  if (mlbLeagueFilter === "al")
    displayedProfiles = displayedProfiles.filter(
      (r) => isAL(r.team) || r.league === "AL",
    )
  else if (mlbLeagueFilter === "nl")
    displayedProfiles = displayedProfiles.filter(
      (r) => isNL(r.team) || r.league === "NL",
    )
  else if (mlbLeagueFilter === "other")
    displayedProfiles = displayedProfiles.filter(
      (r) =>
        !isAL(r.team) &&
        !isNL(r.team) &&
        r.league !== "AL" &&
        r.league !== "NL",
    )

  if (teamFilter !== "all")
    displayedProfiles = displayedProfiles.filter((r) => r.team === teamFilter)

  if (positionFilter !== "all") {
    if (positionFilter === "Util")
      displayedProfiles = displayedProfiles.filter(isUtil)
    else
      displayedProfiles = displayedProfiles.filter((r) =>
        r.ottoneuPositions.includes(positionFilter),
      )
  }

  const profileSearchQ = normalize(search.trim())
  if (profileSearchQ) {
    displayedProfiles = displayedProfiles.filter(
      (r) =>
        normalize(r.playerName).includes(profileSearchQ) ||
        (r.fgSpecialChar !== null &&
          normalize(r.fgSpecialChar).includes(profileSearchQ)) ||
        normalize(r.lastName ?? "").includes(profileSearchQ) ||
        normalize(r.team ?? "").includes(profileSearchQ) ||
        normalize(r.mlbLevel ?? "").includes(profileSearchQ) ||
        r.ottoneuPositions.join("/").toLowerCase().includes(profileSearchQ) ||
        String(r.ottoneuId ?? "").includes(profileSearchQ) ||
        String(r.fangraphsId ?? "").includes(profileSearchQ),
    )
  }

  if (statusFilter === "adds") {
    displayedProfiles = displayedProfiles.filter((r) => r.isManual)
  } else if (statusFilter === "overrides") {
    displayedProfiles = displayedProfiles.filter(
      (r) => !r.isManual && hasActiveOverride(r),
    )
  }

  // ── Stats filtering ────────────────────────────────────────────────────────

  let displayedStats = statRows
  const playerById = new Map(data.map((r) => [r.id, r]))

  if (activeFilter === "yes")
    displayedStats = displayedStats.filter((r) => r.active)
  else if (activeFilter === "no")
    displayedStats = displayedStats.filter((r) => !r.active)

  if (levelFilter === "mlb")
    displayedStats = displayedStats.filter(
      (r) => r.fangraphsId !== null && !isMiLBFgId(r.fangraphsId),
    )
  else if (levelFilter === "milb")
    displayedStats = displayedStats.filter((r) => isMiLBFgId(r.fangraphsId))

  if (mlbLeagueFilter === "al")
    displayedStats = displayedStats.filter((r) => isAL(r.team))
  else if (mlbLeagueFilter === "nl")
    displayedStats = displayedStats.filter((r) => isNL(r.team))
  else if (mlbLeagueFilter === "other")
    displayedStats = displayedStats.filter(
      (r) => !isAL(r.team) && !isNL(r.team),
    )

  if (teamFilter !== "all")
    displayedStats = displayedStats.filter((r) => r.team === teamFilter)

  const statsSearchQ = search.trim().toLowerCase()
  if (statsSearchQ) {
    displayedStats = displayedStats.filter(
      (r) =>
        r.playerName.toLowerCase().includes(statsSearchQ) ||
        String(r.ottoneuId ?? "").includes(statsSearchQ) ||
        String(r.fangraphsId ?? "").includes(statsSearchQ),
    )
  }

  if (positionFilter !== "all") {
    displayedStats = displayedStats.filter((r) => {
      const profile = playerById.get(r.playerId)
      if (!profile) return false
      if (positionFilter === "Util") return isUtil(profile)
      return profile.ottoneuPositions.includes(positionFilter)
    })
  }

  if (statusFilter === "adds") {
    displayedStats = displayedStats.filter(
      (r) => playerById.get(r.playerId)?.isManual === true,
    )
  } else if (statusFilter === "overrides") {
    displayedStats = displayedStats.filter((r) => {
      const profile = playerById.get(r.playerId)
      return profile !== undefined && !profile.isManual && hasActiveOverride(profile)
    })
  }

  // ── Stats column definitions ───────────────────────────────────────────────

  const statColKeys = show === "pitching" ? PITCHING_COLS : BATTING_COLS

  const statsColumnDefs = ((): ColumnDef<StatRow, unknown>[] => {
    const base: ColumnDef<StatRow, unknown>[] = [
      {
        accessorKey: "ottoneuId",
        header: "Ott ID",
        size: 60,
        cell: ({ getValue }) => {
          const v = getValue() as number | null
          return v ?? emptyCell()
        },
      },
      {
        accessorKey: "fangraphsId",
        header: "FG ID",
        size: 60,
        cell: ({ getValue }) => {
          const v = getValue() as string | null
          if (!v) return emptyCell()
          return (
            <a
              href={`https://www.fangraphs.com/statss.aspx?playerid=${v}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {v}
            </a>
          )
        },
      },
      {
        id: "displayName",
        accessorKey: "playerName",
        header: "Name",
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "mlbLevel",
        header: "LG",
        size: 60,
        cell: ({ getValue }) => {
          const v = getValue() as string | null
          return v ?? emptyCell()
        },
      },
    ]
    const statValueCols: ColumnDef<StatRow, unknown>[] = statColKeys.map(
      (col) => ({
        id: col,
        header: col,
        size: 60,
        enableSorting: true,
        accessorFn: (row: StatRow) => row.stats[col] ?? null,
        cell: ({ getValue }: { getValue: () => unknown }) =>
          fmtStat(col, getValue()),
      }),
    )
    return [...base, ...statValueCols]
  })()

  // ── Profile columns with optional edit action ──────────────────────────────

  const profileColumnDefs = ((): ColumnDef<PlayerRow, unknown>[] => {
    if (!onEdit && !onClearOverride) return profileColumns
    const editCol: ColumnDef<PlayerRow, unknown> = {
      id: "_edit",
      header: "",
      size: onEdit && onClearOverride ? 64 : 36,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {onEdit && (
            <IconButton
              size="md"
              onClick={() => onEdit(row.original)}
              aria-label="Edit player"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </IconButton>
          )}
          {onClearOverride && row.original.isManual && (
            <IconButton
              size="md"
              onClick={() => onClearOverride(row.original)}
              aria-label="Delete player"
            >
              <Trash2Icon className="h-3.5 w-3.5" />
            </IconButton>
          )}
          {onClearOverride &&
            !row.original.isManual &&
            hasActiveOverride(row.original) && (
              <IconButton
                size="md"
                onClick={() => onClearOverride(row.original)}
                aria-label="Clear override"
              >
                <Undo2Icon className="h-3.5 w-3.5" />
              </IconButton>
            )}
        </div>
      ),
    }
    return [...profileColumns, editCol]
  })()

  const teamDropdownOptions =
    mlbLeagueFilter === "al"
      ? AL_TEAM_CODES
      : mlbLeagueFilter === "nl"
        ? NL_TEAM_CODES
        : ALL_TEAM_CODES

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <FilterGroup
          label="Status:"
          size="sm"
          options={[
            { value: "all", label: "All" },
            { value: "adds", label: "Adds" },
            { value: "overrides", label: "Overrides" },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
        />
        <Input
          type="search"
          placeholder="Player Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <FilterGroup
          label="Active:"
          size="sm"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "all", label: "All" },
          ]}
          value={activeFilter}
          onChange={(v) => setActiveFilter(v as ActiveFilter)}
        />
        <FilterGroup
          label="Level:"
          size="sm"
          options={[
            { value: "mlb", label: "MLB" },
            { value: "milb", label: "MiLB" },
            { value: "all", label: "All" },
          ]}
          value={levelFilter}
          onChange={(v) => setLevelFilter(v as LevelFilter)}
        />
        <FilterGroup
          label="League:"
          size="sm"
          options={[
            { value: "al", label: "AL" },
            { value: "nl", label: "NL" },
            { value: "other", label: "Other" },
            { value: "all", label: "All" },
          ]}
          value={mlbLeagueFilter}
          onChange={handleLeagueChange}
        />
        <div className="flex items-center gap-1.5">
          <span className="text-body font-normal text-muted-foreground">
            Team:
          </span>
          <Select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            disabled={mlbLeagueFilter === "other"}
          >
            <option value="all">All</option>
            {teamDropdownOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-body font-normal text-muted-foreground">
            Pos:
          </span>
          <Select
            value={positionFilter}
            onChange={(e) =>
              setPositionFilter(e.target.value as PositionFilter)
            }
          >
            <option value="all">All</option>
            {(
              show === "pitching"
                ? (["SP", "RP"] as const)
                : show === "batting"
                  ? (["C", "1B", "2B", "3B", "SS", "OF", "Util"] as const)
                  : (["C", "1B", "2B", "3B", "SS", "OF", "Util", "SP", "RP"] as const)
            ).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <FilterGroup
          label="Show:"
          size="sm"
          options={[
            { value: "profiles", label: "Profile" },
            { value: "batting", label: "Batting" },
            { value: "pitching", label: "Pitching" },
          ]}
          value={show}
          onChange={handleShowChange}
        />
        <div className="flex items-center gap-1.5">
          <span className="text-body font-normal text-muted-foreground">
            Year:
          </span>
          <Select
            value={String(statsFilter.season)}
            onChange={(e) => pushStatsFilter({ sse: e.target.value })}
            disabled={show === "profiles" || availableYears.length === 0}
          >
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-body font-normal text-muted-foreground">
            Projection:
          </span>
          <Select
            value={statsFilter.projection}
            onChange={(e) => pushStatsFilter({ spr: e.target.value })}
            disabled={show === "profiles"}
          >
            <option
              value="None"
              disabled={!availableProjections.includes("None")}
            >
              None
            </option>
            <option
              value="ZiPS"
              disabled={!availableProjections.includes("ZiPS")}
            >
              ZiPS
            </option>
            <option
              value="Steamer"
              disabled={!availableProjections.includes("Steamer")}
            >
              Steamer
            </option>
            <option
              value="ATC"
              disabled={!availableProjections.includes("ATC")}
            >
              ATC
            </option>
            <option
              value="TheBat"
              disabled={!availableProjections.includes("TheBat")}
            >
              The Bat
            </option>
            <option
              value="TheBatX"
              disabled={!availableProjections.includes("TheBatX")}
            >
              The Bat X
            </option>
            <option
              value="OOPSY"
              disabled={!availableProjections.includes("OOPSY")}
            >
              OOPSY
            </option>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-body font-normal text-muted-foreground">
            Splits:
          </span>
          <Select
            value={statsFilter.split}
            onChange={(e) => pushStatsFilter({ ssp: e.target.value })}
            disabled={show === "profiles"}
          >
            <option value="None" disabled={!availableSplits.includes("None")}>
              None
            </option>
            <option
              value="VsLeft"
              disabled={!availableSplits.includes("VsLeft")}
            >
              vs Left
            </option>
            <option
              value="VsRight"
              disabled={!availableSplits.includes("VsRight")}
            >
              vs Right
            </option>
          </Select>
        </div>
        {playerExports.length > 0 && (
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="md">
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {playerExports.map((name) => (
                  <DropdownMenuItem
                    key={name}
                    onSelect={() =>
                      triggerExport(
                        name.toLowerCase().includes("pitcher")
                          ? "PITCHER"
                          : "BATTER",
                        "csv",
                      )
                    }
                  >
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Table */}
      {show === "profiles" ? (
        <DataTable
          columns={profileColumnDefs}
          data={displayedProfiles}
          defaultPageSize={20}
          defaultSorting={[{ id: "displayName", desc: false }]}
        />
      ) : (
        <DataTable
          columns={statsColumnDefs}
          data={displayedStats}
          defaultPageSize={20}
          defaultSorting={[{ id: "displayName", desc: false }]}
        />
      )}
    </div>
  )
}
