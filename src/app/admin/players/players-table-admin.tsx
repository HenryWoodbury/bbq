"use client"

import { ChevronLeftIcon, Trash2Icon, Undo2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Suspense, use, useState } from "react"
import type { UniverseSearchResult } from "@/app/api/admin/players/universe-search/route"
import { PlayerAddIcon } from "@/components/icons"
import {
  type PlayerRow,
  PlayersTable,
  type StatRow,
  type StatsFilter,
} from "@/components/players-table"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { showToast } from "@/components/ui/sonner"
import { parsePositions } from "@/lib/positions"
import { deriveLevelFromFgId } from "@/lib/team-codes"
import { useDebouncedFetch } from "@/lib/use-debounced-fetch"
import { cn } from "@/lib/utils"
import { type OverrideFields, PlayerFormGrid } from "./player-form-grid"

// ── Shared field types ────────────────────────────────────────────────────────

type OverrideStringKey = Exclude<
  keyof OverrideFields,
  "active" | "nickname" | "positions"
>

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyOverride(): OverrideFields {
  return {
    displayName: "",
    firstName: "",
    lastName: "",
    nickname: "",
    birthday: "",
    team: "",
    mlbLevel: "",
    league: "",
    active: null,
    bats: "",
    throws: "",
    positions: "",
  }
}

function rowToOverride(row: PlayerRow): OverrideFields {
  return {
    displayName: row.fgSpecialChar ?? row.playerName ?? "",
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    nickname: row.nickname ?? "",
    birthday: row.birthday ?? "",
    team: row.team ?? "",
    mlbLevel: row.mlbLevel ?? "",
    league: row.league ?? "",
    active: row.active,
    bats: row.bats ?? "",
    throws: row.throws ?? "",
    positions: row.ottoneuPositions.join("/"),
  }
}

function nullify(s: string): string | null {
  return s.trim() || null
}

function buildOverridePayload(fields: OverrideFields) {
  return {
    displayName: nullify(fields.displayName),
    firstName: nullify(fields.firstName),
    lastName: nullify(fields.lastName),
    nickname: nullify(fields.nickname),
    birthday: nullify(fields.birthday),
    team: nullify(fields.team),
    mlbLevel: nullify(fields.mlbLevel),
    league: nullify(fields.league),
    active: fields.active,
    bats: nullify(fields.bats),
    throws: nullify(fields.throws),
    positions: parsePositions(fields.positions),
  }
}

function EditOverrideDrawer({
  row,
  onClose,
  onRemoveManual,
}: {
  row: PlayerRow
  onClose: () => void
  onRemoveManual?: () => void
}) {
  const router = useRouter()
  const [fields, setFields] = useState<OverrideFields>(rowToOverride(row))
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")
  const [error, setError] = useState("")

  function isDirty(key: OverrideStringKey): boolean {
    if (!row.baseFields) return false
    return (nullify(fields[key]) ?? null) !== (row.baseFields[key] ?? null)
  }

  function isDirtyActive(): boolean {
    if (!row.baseFields) return false
    return fields.active !== row.baseFields.active
  }

  function isDirtyPositions(): boolean {
    if (!row.baseFields) return false
    return (
      parsePositions(fields.positions).join("/") !==
      row.baseFields.positions.join("/")
    )
  }

  function clearField(key: keyof OverrideFields) {
    if (key === "active") {
      set("active", row.baseFields?.active ?? null)
    } else if (key === "nickname") {
      set("nickname", "")
    } else if (key === "positions") {
      set("positions", (row.baseFields?.positions ?? []).join("/"))
    } else {
      const k = key as OverrideStringKey
      set(k, row.baseFields?.[k] ?? "")
    }
  }

  function set<K extends keyof OverrideFields>(key: K, val: OverrideFields[K]) {
    setFields((f) => ({ ...f, [key]: val }))
  }

  function isAnyDirty(): boolean {
    const stringKeys: OverrideStringKey[] = [
      "displayName",
      "firstName",
      "lastName",
      "birthday",
      "team",
      "mlbLevel",
      "league",
      "bats",
      "throws",
    ]
    return (
      stringKeys.some((k) => isDirty(k)) ||
      isDirtyActive() ||
      !!nullify(fields.nickname) ||
      isDirtyPositions()
    )
  }

  async function handleSave() {
    if (row.isManual) {
      setStatus("saving")
      setError("")
      try {
        const res = await fetch(`/api/admin/players/manual/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildOverridePayload(fields)),
        })
        if (!res.ok) {
          const d = (await res.json()) as { error: string }
          setError(d.error ?? "Save failed")
          setStatus("error")
          return
        }
        router.refresh()
        onClose()
      } catch {
        setError("Network error")
        setStatus("error")
      }
      return
    }

    if (!isAnyDirty()) {
      if (row.overrideId) {
        // All field overrides cleared — remove the now-empty record
        await handleRemove()
        onClose()
      } else {
        onClose()
      }
      return
    }
    setStatus("saving")
    setError("")
    try {
      // Null for non-dirty fields clears any previously-stored accidental override
      // and keeps isDirty correct for derived fields (league, mlbLevel) on future opens.
      const payload = {
        displayName: isDirty("displayName") ? nullify(fields.displayName) : null,
        firstName: isDirty("firstName") ? nullify(fields.firstName) : null,
        lastName: isDirty("lastName") ? nullify(fields.lastName) : null,
        nickname: nullify(fields.nickname),
        birthday: isDirty("birthday") ? nullify(fields.birthday) : null,
        team: isDirty("team") ? nullify(fields.team) : null,
        mlbLevel: isDirty("mlbLevel") ? nullify(fields.mlbLevel) : null,
        league: isDirty("league") ? nullify(fields.league) : null,
        active: isDirtyActive() ? fields.active : null,
        bats: isDirty("bats") ? nullify(fields.bats) : null,
        throws: isDirty("throws") ? nullify(fields.throws) : null,
        positions: isDirtyPositions() ? parsePositions(fields.positions) : [],
      }
      const res = await fetch(`/api/admin/players/${row.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = (await res.json()) as { error: string }
        setError(d.error ?? "Save failed")
        setStatus("error")
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError("Network error")
      setStatus("error")
    }
  }

  async function handleRemove() {
    if (!row.overrideId) {
      setFields(rowToOverride(row))
      setStatus("idle")
      setError("")
      return
    }
    setStatus("saving")
    setError("")
    try {
      const res = await fetch(`/api/admin/players/${row.id}/override`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const d = (await res.json()) as { error: string }
        setError(d.error ?? "Delete failed")
        setStatus("error")
        return
      }
      router.refresh()
    } catch {
      setError("Network error")
      setStatus("error")
    }
  }

  return (
    <DrawerContent width="w-150">
      <DrawerHeader onClose={onClose}>
        <DrawerTitle>
          {row.isManual
            ? "Edit Manually Added Player"
            : "Override Player Profile"}
        </DrawerTitle>
      </DrawerHeader>

      <DrawerBody>
        <h2 className="mb-3">{row.fgSpecialChar ?? row.playerName}</h2>
        <PlayerFormGrid
          fields={fields}
          onChange={set}
          undo={
            row.isManual
              ? undefined
              : {
                  isDirty,
                  isDirtyActive,
                  isDirtyPositions,
                  clearField,
                  hasNickname: !!nullify(fields.nickname),
                }
          }
        />
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      </DrawerBody>

      <DrawerFooter className="flex items-center justify-between gap-2">
        <div>
          {row.isManual ? (
            <Button
              variant="subtle"
              size="md"
              onClick={onRemoveManual}
              disabled={status === "saving"}
            >
              <Trash2Icon size={16} className="shrink-0" />
              Remove Player
            </Button>
          ) : (
            isAnyDirty() && (
              <Button
                variant="subtle"
                size="md"
                onClick={() => {
                  ;(
                    Object.keys(emptyOverride()) as (keyof OverrideFields)[]
                  ).forEach(clearField)
                }}
                disabled={status === "saving"}
              >
                <Undo2Icon size={16} className="shrink-0" />
                Clear Overrides
              </Button>
            )
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={handleSave} disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save"}
          </Button>
        </div>
      </DrawerFooter>
    </DrawerContent>
  )
}

function SearchResults({
  promise,
  onSelect,
}: {
  promise: Promise<UniverseSearchResult[]>
  onSelect: (r: UniverseSearchResult) => void
}) {
  const results = use(promise)
  if (results.length === 0)
    return <p className="px-3 py-2 text-sm text-muted-foreground">No results</p>
  return results.map((r) => (
    <Button
      key={r.ottoneuId}
      type="button"
      variant="ghost"
      disabled={r.alreadyTracked}
      onClick={() => onSelect(r)}
      className={cn(
        "flex w-full items-center justify-between px-3 py-2 text-left text-sm rounded-none",
        "border-t-0 border-x-0 border-b border-border",
        "first:rounded-t-lg last:pb-2.125 last:rounded-b-lg last:border-b-0",
        r.alreadyTracked
          ? "cursor-not-allowed text-muted-foreground/40 !opacity-100"
          : "hover:bg-muted",
      )}
    >
      <span className="font-medium flex flex-5">{r.playerName}</span>
      {r.positions.length > 0 && (
        <span className="flex flex-2">{r.positions.join("/")}</span>
      )}
      <span className="">#{r.ottoneuId}</span>
    </Button>
  ))
}

function AddManualDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter()

  // ── Step 1: Search ──────────────────────────────────────────────────────────
  const [nameQuery, setNameQuery] = useState("")
  const [idQuery, setIdQuery] = useState("")

  const searchUrl = (() => {
    if (!nameQuery && !idQuery) return null
    const params = new URLSearchParams()
    if (idQuery) params.set("ottoneuId", idQuery)
    else params.set("q", nameQuery)
    return `/api/admin/players/universe-search?${params}`
  })()
  const { promise, pending: searching } =
    useDebouncedFetch<UniverseSearchResult>(searchUrl)

  // ── Step 2: Fill ────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<UniverseSearchResult | null>(null)
  const [fields, setFields] = useState<OverrideFields>(emptyOverride())
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")
  const [error, setError] = useState("")

  function selectPlayer(u: UniverseSearchResult) {
    setSelected(u)
    setFields({
      ...emptyOverride(),
      displayName: u.playerName,
      birthday: u.birthday ?? "",
      positions: u.positions.join("/"),
      mlbLevel: deriveLevelFromFgId(u.fangraphsId),
    })
  }

  function set<K extends keyof OverrideFields>(key: K, val: OverrideFields[K]) {
    setFields((f) => ({ ...f, [key]: val }))
  }

  async function handleSave() {
    if (!selected) return
    setStatus("saving")
    setError("")
    try {
      const res = await fetch("/api/admin/players/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildOverridePayload(fields),
          fangraphsId: selected.fangraphsId,
          mlbamId: selected.mlbamId,
          ottoneuId: selected.ottoneuId,
        }),
      })
      if (!res.ok) {
        const d = (await res.json()) as {
          error: string | { formErrors: string[] }
        }
        const msg =
          typeof d.error === "string"
            ? d.error
            : (d.error?.formErrors?.[0] ?? "Save failed")
        setError(msg)
        setStatus("error")
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError("Network error")
      setStatus("error")
    }
  }

  return (
    <DrawerContent width="w-150">
      <DrawerHeader onClose={onClose}>
        <DrawerTitle>Add to Player List</DrawerTitle>
      </DrawerHeader>

      <DrawerBody>
        {!selected ? (
          <>
            <p className="caption mb-4">
              Search the Player Universe by name or ID
            </p>
            <div className="flex gap-2">
              <Input
                autoFocus
                className="flex-1"
                placeholder="Player name"
                value={nameQuery}
                onChange={(e) => {
                  setNameQuery(e.target.value)
                  setIdQuery("")
                }}
              />
              <Input
                className="w-40"
                placeholder="ID"
                value={idQuery}
                onChange={(e) => {
                  setIdQuery(e.target.value)
                  setNameQuery("")
                }}
              />
            </div>

            {(nameQuery || idQuery) && (
              <div className="mt-3 rounded-lg border border-border">
                <Suspense
                  fallback={
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Searching…
                    </p>
                  }
                >
                  <SearchResults promise={promise} onSelect={selectPlayer} />
                </Suspense>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-3 flex gap-2">
              <IconButton
                onClick={() => setSelected(null)}
                className="flex items-center gap-1"
                aria-label="Return to search"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </IconButton>
              <h2>{fields.displayName}</h2>
            </div>
            <div className="mb-4 flex gap-4 rounded-lg bg-muted px-3 py-2 text-sm">
              <span>
                <span className="text-muted-foreground">Ott ID</span>{" "}
                <span className="font-medium">{selected.ottoneuId}</span>
              </span>
              <span>
                <span className="text-muted-foreground">FG ID</span>{" "}
                <span className="font-medium">
                  {selected.fangraphsId ?? "—"}
                </span>
              </span>
              {selected.positions.length > 0 && (
                <span>
                  <span className="text-muted-foreground">Pos</span>{" "}
                  <span className="font-medium">
                    {selected.positions.join("/")}
                  </span>
                </span>
              )}
            </div>

            <PlayerFormGrid
              fields={fields}
              onChange={set}
              autoFocusDisplayName
            />
            {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
          </>
        )}
      </DrawerBody>

      <DrawerFooter className="flex items-center justify-between gap-2">
        {!selected ? (
          <div className="flex w-full justify-end">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full justify-end">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="md"
              onClick={handleSave}
              disabled={status === "saving"}
            >
              {status === "saving" ? "Saving…" : "Add Player"}
            </Button>
          </div>
        )}
      </DrawerFooter>
    </DrawerContent>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PlayersTableAdmin({
  data,
  statRows,
  availableYears,
  availableProjections,
  availableSplits,
  statsFilter,
  initialShow = "profiles",
  playerExports = [],
}: {
  data: PlayerRow[]
  statRows: StatRow[]
  availableYears: number[]
  availableProjections: string[]
  availableSplits: string[]
  statsFilter: StatsFilter
  initialShow?: "profiles" | "batting" | "pitching"
  playerExports?: string[]
}) {
  const router = useRouter()
  const [editingRow, setEditingRow] = useState<PlayerRow | null>(null)
  const [addingManual, setAddingManual] = useState(false)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(
    new Set(),
  )
  const [prevData, setPrevData] = useState(data)
  if (prevData !== data) {
    setPrevData(data)
    if (editingRow) {
      const updated = data.find((r) => r.id === editingRow.id)
      if (updated) setEditingRow(updated)
    }
  }

  const visibleData = data.filter((r) => !pendingDeleteIds.has(r.id))

  function scheduleManualDelete(row: PlayerRow) {
    setPendingDeleteIds((prev) => new Set(prev).add(row.id))
    let cancelled = false
    let executed = false

    function removePending() {
      setPendingDeleteIds((prev) => {
        const next = new Set(prev)
        next.delete(row.id)
        return next
      })
    }

    async function execute() {
      if (executed || cancelled) return
      executed = true
      const res = await fetch(`/api/admin/players/manual/${row.id}`, {
        method: "DELETE",
      })
      removePending()
      if (res.ok) {
        router.refresh()
      } else {
        showToast.error(
          `Failed to remove ${row.fgSpecialChar ?? row.playerName}`,
        )
      }
    }

    showToast({
      title: `You have removed ${row.fgSpecialChar ?? row.playerName} from the player list.`,
      action: {
        label: "Restore",
        onClick: () => {
          cancelled = true
          removePending()
        },
      },
      onDismiss: execute,
      onAutoClose: execute,
    })
  }

  async function handleClearOverride(row: PlayerRow) {
    if (row.isManual) {
      scheduleManualDelete(row)
      return
    }
    const res = await fetch(`/api/admin/players/${row.id}/override`, {
      method: "DELETE",
    })
    if (res.ok) router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <h2 className="min-w-36">Players</h2>
        <Drawer open={addingManual} onClose={() => setAddingManual(false)}>
          <DrawerTrigger asChild>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setAddingManual(true)}
              className="font-medium"
            >
              <PlayerAddIcon size={15} className="shrink-0" />
              Add Player
            </Button>
          </DrawerTrigger>
          {addingManual && (
            <AddManualDrawer onClose={() => setAddingManual(false)} />
          )}
        </Drawer>
      </div>

      <PlayersTable
        data={visibleData}
        statRows={statRows}
        availableYears={availableYears}
        availableProjections={availableProjections}
        availableSplits={availableSplits}
        statsFilter={statsFilter}
        initialShow={initialShow}
        playerExports={playerExports}
        onEdit={setEditingRow}
        onClearOverride={handleClearOverride}
      />

      <Drawer open={!!editingRow} onClose={() => setEditingRow(null)}>
        {editingRow && (
          <EditOverrideDrawer
            key={editingRow.id}
            row={editingRow}
            onClose={() => setEditingRow(null)}
            onRemoveManual={() => {
              scheduleManualDelete(editingRow)
              setEditingRow(null)
            }}
          />
        )}
      </Drawer>
    </>
  )
}
