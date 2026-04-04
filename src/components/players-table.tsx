"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DownloadIcon, PencilIcon, Undo2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
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
    row.active !== b.active ||
    (row.bats ?? null) !== (b.bats ?? null) ||
    (row.throws ?? null) !== (b.throws ?? null) ||
    row.nickname !== null ||
    row.ottoneuPositions.join("/") !== b.positions.join("/")
  )
}

function isMajorLeague(row: PlayerRow): boolean {
  return row.universeFgId !== null && !row.universeFgId.startsWith("sa")
}

function isMinorLeague(row: PlayerRow): boolean {
  return row.universeFgId?.startsWith("sa") ?? false
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
      return v ?? <span className="text-muted-foreground">—</span>
    },
  },
  {
    id: "fgId",
    accessorFn: (row) => row.fangraphsId ?? row.universeFgId,
    header: "FG ID",
    size: 60,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      if (!v) return <span className="text-muted-foreground">—</span>
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
      return v ?? <span className="text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: "team",
    header: "Team",
    size: 60,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? <span className="text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: "mlbLevel",
    header: "LG",
    size: 60,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? <span className="text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: "bats",
    header: "B",
    size: 40,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? <span className="text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: "throws",
    header: "T",
    size: 40,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? <span className="text-muted-foreground">—</span>
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
      return pos.length > 0 ? (
        pos.join("/")
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
]

// ── Filter types ──────────────────────────────────────────────────────────────

type ActiveFilter = "yes" | "no" | "all"
type LevelFilter = "all" | "mlb" | "milb"
type MLBLeagueFilter = "all" | "al" | "nl" | "other"
type RoleFilter = "all" | "batter" | "pitcher"

// ── Component ─────────────────────────────────────────────────────────────────

export function PlayersTable({
  data,
  statRows,
  availableYears,
  availableProjections,
  availableSplits,
  statsFilter,
  initialShow = "profiles",
  onEdit,
  onClearOverride,
}: {
  data: PlayerRow[]
  statRows: StatRow[]
  availableYears: number[]
  availableProjections: string[]
  availableSplits: string[]
  statsFilter: StatsFilter
  initialShow?: "profiles" | "stats"
  onEdit?: (row: PlayerRow) => void
  onClearOverride?: (row: PlayerRow) => void
}) {
  const router = useRouter()
  const [show, setShow] = useState<"profiles" | "stats">(initialShow)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("yes")
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("mlb")
  const [mlbLeagueFilter, setMlbLeagueFilter] = useState<MLBLeagueFilter>("all")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")

  function handleShowChange(v: string) {
    const newShow = v as "profiles" | "stats"
    setShow(newShow)
    if (newShow === "stats") {
      const effectiveRole = roleFilter === "all" ? "batter" : roleFilter
      setRoleFilter(effectiveRole)
      pushStatsFilter({
        spt: effectiveRole === "pitcher" ? "PITCHER" : "BATTER",
      })
    } else {
      router.push("/admin/players?show=profiles")
    }
  }

  function handleRoleChange(v: string) {
    const newRole = v as RoleFilter
    setRoleFilter(newRole)
    if (show === "stats" && newRole !== "all") {
      pushStatsFilter({ spt: newRole === "pitcher" ? "PITCHER" : "BATTER" })
    }
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
    const sp = new URLSearchParams({
      show: "stats",
      spt: statsFilter.playerType,
      sse: String(statsFilter.season),
      spr: statsFilter.projection,
      ssp: statsFilter.split,
      ...updates,
    })
    router.push(`/admin/players?${sp.toString()}`)
  }

  // ── Profile filtering ──────────────────────────────────────────────────────

  const displayedProfiles = useMemo(() => {
    let rows = data

    if (activeFilter === "yes") rows = rows.filter((r) => r.active)
    else if (activeFilter === "no") rows = rows.filter((r) => !r.active)

    if (levelFilter === "mlb") rows = rows.filter(isMajorLeague)
    else if (levelFilter === "milb") rows = rows.filter(isMinorLeague)

    if (mlbLeagueFilter === "al")
      rows = rows.filter((r) => isAL(r.team) || r.mlbLevel === "AL")
    else if (mlbLeagueFilter === "nl")
      rows = rows.filter((r) => isNL(r.team) || r.mlbLevel === "NL")
    else if (mlbLeagueFilter === "other")
      rows = rows.filter((r) => !isAL(r.team) && !isNL(r.team) && r.mlbLevel !== "AL" && r.mlbLevel !== "NL")

    if (roleFilter === "batter") rows = rows.filter((r) => !isPitcher(r))
    else if (roleFilter === "pitcher") rows = rows.filter(isPitcher)

    const q = normalize(search.trim())
    if (q) {
      rows = rows.filter(
        (r) =>
          normalize(r.fgSpecialChar ?? r.playerName).includes(q) ||
          normalize(r.playerName).includes(q) ||
          normalize(r.lastName ?? "").includes(q) ||
          normalize(r.team ?? "").includes(q) ||
          normalize(r.mlbLevel ?? "").includes(q) ||
          r.ottoneuPositions.join("/").toLowerCase().includes(q) ||
          String(r.ottoneuId ?? "").includes(q) ||
          String(r.fangraphsId ?? "").includes(q),
      )
    }

    return rows
  }, [data, activeFilter, levelFilter, mlbLeagueFilter, roleFilter, search])

  // ── Stats filtering ────────────────────────────────────────────────────────

  const displayedStats = useMemo(() => {
    let rows = statRows

    if (activeFilter === "yes") rows = rows.filter((r) => r.active)
    else if (activeFilter === "no") rows = rows.filter((r) => !r.active)

    if (levelFilter === "mlb")
      rows = rows.filter(
        (r) => r.fangraphsId !== null && !r.fangraphsId.startsWith("sa"),
      )
    else if (levelFilter === "milb")
      rows = rows.filter((r) => r.fangraphsId?.startsWith("sa") ?? false)

    if (mlbLeagueFilter === "al") rows = rows.filter((r) => isAL(r.team))
    else if (mlbLeagueFilter === "nl") rows = rows.filter((r) => isNL(r.team))
    else if (mlbLeagueFilter === "other") rows = rows.filter((r) => !isAL(r.team) && !isNL(r.team))

    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (r) =>
          r.playerName.toLowerCase().includes(q) ||
          String(r.ottoneuId ?? "").includes(q) ||
          String(r.fangraphsId ?? "").includes(q),
      )
    }

    return rows
  }, [statRows, activeFilter, levelFilter, mlbLeagueFilter, search])

  // ── Stats column definitions ───────────────────────────────────────────────

  const statColKeys =
    statsFilter.playerType === "PITCHER" ? PITCHING_COLS : BATTING_COLS

  const statsColumnDefs = useMemo<ColumnDef<StatRow, unknown>[]>(() => {
    const base: ColumnDef<StatRow, unknown>[] = [
      {
        accessorKey: "ottoneuId",
        header: "Ott ID",
        size: 60,
        cell: ({ getValue }) => {
          const v = getValue() as number | null
          return v ?? <span className="text-muted-foreground">—</span>
        },
      },
      {
        accessorKey: "fangraphsId",
        header: "FG ID",
        size: 60,
        cell: ({ getValue }) => {
          const v = getValue() as string | null
          if (!v) return <span className="text-muted-foreground">—</span>
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
          return v ?? <span className="text-muted-foreground">—</span>
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
  }, [statColKeys])

  // ── Profile columns with optional edit action ──────────────────────────────

  const profileColumnDefs = useMemo<ColumnDef<PlayerRow, unknown>[]>(() => {
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
              onClick={() => onEdit(row.original)}
              aria-label="Edit player"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </IconButton>
          )}
          {onClearOverride && hasActiveOverride(row.original) && (
            <IconButton
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
  }, [onEdit, onClearOverride])

  // ── Role options depend on mode ────────────────────────────────────────────

  const roleOptions =
    show === "stats"
      ? [
          { value: "batter", label: "Batters" },
          { value: "pitcher", label: "Pitchers" },
        ]
      : [
          { value: "batter", label: "Batters" },
          { value: "pitcher", label: "Pitchers" },
          { value: "all", label: "All" },
        ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Filter row 1 */}
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
          onChange={(v) => setMlbLeagueFilter(v as MLBLeagueFilter)}
        />
        <FilterGroup
          label="Role:"
          size="sm"
          options={roleOptions}
          value={
            roleFilter === "all" && show === "stats" ? "batter" : roleFilter
          }
          onChange={handleRoleChange}
        />
      </div>

      {/* Filter row 2 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <FilterGroup
          label="Show:"
          size="sm"
          options={[
            { value: "profiles", label: "Profiles" },
            { value: "stats", label: "Stats" },
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
        <Input
          type="search"
          placeholder="Player Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="md">
                <DownloadIcon className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => triggerExport("BATTER", "csv")}>
                Batters (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => triggerExport("BATTER", "json")}
              >
                Batters (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => triggerExport("PITCHER", "csv")}
              >
                Pitchers (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => triggerExport("PITCHER", "json")}
              >
                Pitchers (JSON)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
