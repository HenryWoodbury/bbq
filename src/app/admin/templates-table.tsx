"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Scoring uses Prisma enum names (FiveX5 etc.) since @map only affects DB storage
export type TemplateRow = {
  id: string
  name: string
  platform: "ESPN" | "Ottoneu" | "Custom"
  playType: "H2H" | "Season"
  scoring: "FiveX5" | "FourX4" | "Fangraphs" | "SABR" | "Points"
  draftMode: "Live" | "Slow"
  draftType: "Snake" | "Auction"
  teams: number
  rosterSize: number
  cap: number | null
  rosters: unknown
  isActive: boolean
  version: number
  description: string | null
  rulesText: string | null
}

type FormState = {
  name: string
  platform: "ESPN" | "Ottoneu" | "Custom"
  playType: "H2H" | "Season"
  scoring: "FiveX5" | "FourX4" | "Fangraphs" | "SABR" | "Points"
  draftMode: "Live" | "Slow"
  draftType: "Snake" | "Auction"
  teams: string
  rosterSize: string
  cap: string
  rosters: string
  description: string
  rulesText: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  name: "",
  platform: "Custom",
  playType: "Season",
  scoring: "FiveX5",
  draftMode: "Live",
  draftType: "Snake",
  teams: "12",
  rosterSize: "23",
  cap: "",
  rosters:
    '["C","1B","2B","3B","SS","OF","OF","OF","Util","P","P","P","P","P","P","P","BN","BN","BN","BN","BN","BN","BN"]',
  description: "",
  rulesText: "",
  isActive: true,
}

function toFormState(row: TemplateRow): FormState {
  return {
    name: row.name,
    platform: row.platform,
    playType: row.playType,
    scoring: row.scoring,
    draftMode: row.draftMode,
    draftType: row.draftType,
    teams: String(row.teams),
    rosterSize: String(row.rosterSize),
    cap: row.cap !== null ? String(row.cap) : "",
    rosters: JSON.stringify(row.rosters, null, 2),
    description: row.description ?? "",
    rulesText: row.rulesText ?? "",
    isActive: row.isActive,
  }
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function TemplateForm({
  mode,
  initial,
  templateId,
  onDone,
}: {
  mode: "create" | "edit"
  initial: FormState
  templateId?: string
  onDone: () => void
}) {
  const [form, setForm] = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let parsedRosters: unknown
    try {
      parsedRosters = JSON.parse(form.rosters)
      if (!Array.isArray(parsedRosters)) throw new Error("must be an array")
    } catch {
      setError("Rosters must be a valid JSON array of position strings")
      return
    }

    const teams = Number.parseInt(form.teams, 10)
    const rosterSize = Number.parseInt(form.rosterSize, 10)
    const cap = form.cap.trim() ? Number.parseInt(form.cap, 10) : null

    if (Number.isNaN(teams) || Number.isNaN(rosterSize)) {
      setError("Teams and roster size must be valid integers")
      return
    }
    if (cap !== null && Number.isNaN(cap)) {
      setError("Cap must be a valid integer or empty")
      return
    }

    setSaving(true)
    try {
      const url =
        mode === "create"
          ? "/api/admin/league-templates"
          : `/api/admin/league-templates/${templateId}`

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          platform: form.platform,
          playType: form.playType,
          scoring: form.scoring,
          draftMode: form.draftMode,
          draftType: form.draftType,
          teams,
          rosterSize,
          cap,
          rosters: parsedRosters,
          description: form.description || null,
          rulesText: form.rulesText || null,
          isActive: form.isActive,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: unknown }
        setError(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error),
        )
        return
      }

      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Name">
        <Input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. ESPN H2H 5x5"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Platform">
          <Select
            value={form.platform}
            onChange={(e) =>
              set("platform", e.target.value as FormState["platform"])
            }
            className="form-control"
          >
            <option value="ESPN">ESPN</option>
            <option value="Ottoneu">Ottoneu</option>
            <option value="Custom">Custom</option>
          </Select>
        </Field>

        <Field label="Play Type">
          <Select
            value={form.playType}
            onChange={(e) =>
              set("playType", e.target.value as FormState["playType"])
            }
            className="form-control"
          >
            <option value="Season">Season Long</option>
            <option value="H2H">H2H</option>
          </Select>
        </Field>

        <Field label="Scoring">
          <Select
            value={form.scoring}
            onChange={(e) =>
              set("scoring", e.target.value as FormState["scoring"])
            }
            className="form-control"
          >
            <option value="FiveX5">5×5 Roto</option>
            <option value="FourX4">4×4 Roto</option>
            <option value="Fangraphs">FanGraphs Points</option>
            <option value="SABR">SABR Points</option>
            <option value="Points">Points (ESPN)</option>
          </Select>
        </Field>

        <Field label="Draft Type">
          <Select
            value={form.draftType}
            onChange={(e) =>
              set("draftType", e.target.value as FormState["draftType"])
            }
            className="form-control"
          >
            <option value="Snake">Snake</option>
            <option value="Auction">Auction</option>
          </Select>
        </Field>

        <Field label="Draft Mode">
          <Select
            value={form.draftMode}
            onChange={(e) =>
              set("draftMode", e.target.value as FormState["draftMode"])
            }
            className="form-control"
          >
            <option value="Live">Live</option>
            <option value="Slow">Slow (async)</option>
          </Select>
        </Field>

        <Field label="Teams">
          <Input
            type="number"
            min={2}
            max={30}
            value={form.teams}
            onChange={(e) => set("teams", e.target.value)}
            required
          />
        </Field>

        <Field label="Roster Size">
          <Input
            type="number"
            min={1}
            value={form.rosterSize}
            onChange={(e) => set("rosterSize", e.target.value)}
            required
          />
        </Field>

        <Field label="Cap (leave blank for snake)">
          <Input
            type="number"
            min={1}
            value={form.cap}
            onChange={(e) => set("cap", e.target.value)}
            placeholder="e.g. 400"
          />
        </Field>
      </div>

      <Field label="Roster Slots (JSON array)">
        <Textarea
          value={form.rosters}
          onChange={(e) => set("rosters", e.target.value)}
          rows={5}
          spellCheck={false}
          className="form-control font-mono text-xs placeholder:text-muted-foreground"
        />
      </Field>

      <Field label="Description">
        <Input
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Optional short description"
        />
      </Field>

      <Field label="Rules Text (Markdown)">
        <Textarea
          value={form.rulesText}
          onChange={(e) => set("rulesText", e.target.value)}
          rows={5}
          placeholder="Human-readable league rules (markdown). Not machine-enforced."
          className="form-control placeholder:text-muted-foreground"
        />
      </Field>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isActive"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </Button>
      </div>
    </form>
  )
}

function EditDialog({ row }: { row: TemplateRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <IconButton aria-label={`Edit ${row.name}`}>
          <PencilIcon className="h-3.5 w-3.5" />
        </IconButton>
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Template — {row.name}</DialogTitle>
        </DialogHeader>
        <TemplateForm
          mode="edit"
          initial={toFormState(row)}
          templateId={row.id}
          onDone={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function DeleteButton({ row }: { row: TemplateRow }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (
      !window.confirm(`Delete template "${row.name}"? This cannot be undone.`)
    )
      return
    setPending(true)
    try {
      await fetch(`/api/admin/league-templates/${row.id}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <IconButton
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Delete ${row.name}`}
      className="hover:text-destructive"
    >
      <Trash2Icon className="h-3.5 w-3.5" />
    </IconButton>
  )
}

const SCORING_LABEL: Record<TemplateRow["scoring"], string> = {
  FiveX5: "5×5",
  FourX4: "4×4",
  Fangraphs: "FGPTs",
  SABR: "SABR",
  Points: "Points",
}

const columns: ColumnDef<TemplateRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 200,
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "platform",
    header: "Platform",
    size: 90,
    cell: ({ getValue }) => <Badge>{getValue() as string}</Badge>,
  },
  {
    accessorKey: "playType",
    header: "Type",
    size: 70,
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "scoring",
    header: "Scoring",
    size: 80,
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {SCORING_LABEL[getValue() as TemplateRow["scoring"]]}
      </span>
    ),
  },
  {
    accessorKey: "draftType",
    header: "Draft",
    size: 70,
    cell: ({ getValue }) => (
      <span className="text-xs capitalize text-muted-foreground">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "teams",
    header: "Teams",
    size: 60,
    cell: ({ getValue }) => (
      <span className="tabular-nums text-xs text-muted-foreground">
        {getValue() as number}
      </span>
    ),
  },
  {
    accessorKey: "rosterSize",
    header: "Roster",
    size: 60,
    cell: ({ getValue }) => (
      <span className="tabular-nums text-xs text-muted-foreground">
        {getValue() as number}
      </span>
    ),
  },
  {
    accessorKey: "cap",
    header: "Cap",
    size: 60,
    cell: ({ getValue }) => {
      const v = getValue() as number | null
      return (
        <span className="tabular-nums text-xs text-muted-foreground">
          {v !== null ? `$${v}` : "—"}
        </span>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: "Active",
    size: 70,
    cell: ({ getValue }) =>
      getValue() ? (
        <Badge>Active</Badge>
      ) : (
        <Badge variant="warning">Inactive</Badge>
      ),
  },
  {
    id: "actions",
    header: "",
    size: 64,
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <EditDialog row={row.original} />
        <DeleteButton row={row.original} />
      </div>
    ),
  },
]

export function TemplatesTable({ data }: { data: TemplateRow[] }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1.5">
              <PlusIcon size={14} />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>New League Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              mode="create"
              initial={EMPTY_FORM}
              onDone={() => {
                setCreateOpen(false)
                router.refresh()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={data}
        defaultPageSize={20}
        defaultSorting={[{ id: "name", desc: false }]}
      />
    </div>
  )
}
