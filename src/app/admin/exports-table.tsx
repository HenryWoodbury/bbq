"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DataTable } from "@/components/data-table"
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
import { Field, FormError } from "@/components/ui/field"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ExportScope, ExportType } from "@/generated/prisma/client"
import { useOptimisticDelete } from "@/hooks/use-optimistic-delete"

export type ExportRow = {
  id: string
  name: string
  scope: ExportScope
  type: ExportType
  fields: string[]
}

type FormState = {
  name: string
  scope: ExportRow["scope"]
  type: ExportRow["type"]
  fields: string
}

const EMPTY_FORM: FormState = {
  name: "",
  scope: "Players",
  type: "Standard",
  fields: "",
}

function toFormState(row: ExportRow): FormState {
  return {
    name: row.name,
    scope: row.scope,
    type: row.type,
    fields: row.fields.join("\n"),
  }
}

function ExportForm({
  mode,
  initial,
  exportId,
  onClose,
  onDone,
}: {
  mode: "create" | "edit"
  initial: FormState
  exportId?: string
  onClose: () => void
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

    const fields = form.fields
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)

    setSaving(true)
    try {
      const url =
        mode === "create"
          ? "/api/admin/data-exports"
          : `/api/admin/data-exports/${exportId}`

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          scope: form.scope,
          type: form.type,
          fields,
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
    <DrawerContent width="w-150">
      <DrawerHeader onClose={onClose}>
        <DrawerTitle>
          {mode === "create" ? "Add Export" : `Edit Export — ${initial.name}`}
        </DrawerTitle>
      </DrawerHeader>
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <DrawerBody className="flex flex-col gap-4">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Batcast Batters"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Scope">
              <Select
                value={form.scope}
                onChange={(e) =>
                  set("scope", e.target.value as FormState["scope"])
                }
                className="form-control"
              >
                <option value="Players">Players</option>
                <option value="Teams">Teams</option>
                <option value="Leagues">Leagues</option>
                <option value="Parks">Parks</option>
                <option value="Platform">Platform</option>
              </Select>
            </Field>

            <Field label="Type">
              <Select
                value={form.type}
                onChange={(e) =>
                  set("type", e.target.value as FormState["type"])
                }
                className="form-control"
              >
                <option value="Standard">Standard</option>
                <option value="Splits">Splits</option>
                <option value="Profiles">Profiles</option>
              </Select>
            </Field>
          </div>

          <Field label="Fields (one per line)">
            <Textarea
              value={form.fields}
              onChange={(e) => set("fields", e.target.value)}
              rows={6}
              placeholder={"Name\nBirthday\nPositions"}
              className="form-control font-mono text-xs placeholder:text-muted-foreground"
            />
          </Field>

          {error && <FormError>{error}</FormError>}
        </DrawerBody>
        <DrawerFooter className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
          </Button>
        </DrawerFooter>
      </form>
    </DrawerContent>
  )
}

function EditDrawer({ row }: { row: ExportRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <Drawer open={open} onClose={() => setOpen(false)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger asChild>
            <IconButton
              tooltip={false}
              aria-label={`Edit ${row.name}`}
              onClick={() => setOpen(true)}
            >
              <PencilIcon />
            </IconButton>
          </DrawerTrigger>
        </TooltipTrigger>
        <TooltipContent>Edit {row.name}</TooltipContent>
      </Tooltip>
      {open && (
        <ExportForm
          mode="edit"
          initial={toFormState(row)}
          exportId={row.id}
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      )}
    </Drawer>
  )
}

export function ExportsTable({ data }: { data: ExportRow[] }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [scopeFilter, setScopeFilter] = useState<string>("ALL")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const { pendingDeleteIds, scheduleDelete } = useOptimisticDelete<ExportRow>({
    getId: (row) => row.id,
    title: (row) => `Deleted export "${row.name}"`,
    perform: async (row) =>
      (await fetch(`/api/admin/data-exports/${row.id}`, { method: "DELETE" }))
        .ok,
    onSuccess: () => router.refresh(),
    errorMessage: () => "Failed to delete export",
  })

  const columns: ColumnDef<ExportRow, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      size: 180,
      cell: ({ getValue }) => (
        <span className="font-medium text-foreground">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "scope",
      header: "Scope",
      size: 90,
      cell: ({ getValue }) => getValue() as string,
    },
    {
      accessorKey: "type",
      header: "Type",
      size: 90,
      cell: ({ getValue }) => getValue() as string,
    },
    {
      accessorKey: "fields",
      header: "Fields",
      size: 450,
      cell: ({ getValue }) => (getValue() as string[]).join(", "),
    },
    {
      id: "actions",
      header: "",
      size: 60,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <EditDrawer row={row.original} />
          <IconButton
            aria-label={`Delete ${row.original.name}`}
            onClick={() => scheduleDelete(row.original)}
            className="hover:text-destructive"
          >
            <Trash2Icon />
          </IconButton>
        </div>
      ),
    },
  ]

  const filtered = data.filter((row) => {
    if (pendingDeleteIds.has(row.id)) return false
    if (scopeFilter !== "ALL" && row.scope !== scopeFilter) return false
    if (typeFilter !== "ALL" && row.type !== typeFilter) return false
    return true
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-body font-normal text-muted-foreground">
          Scope
          <Select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="Players">Players</option>
            <option value="Parks">Parks</option>
            <option value="Teams">Teams</option>
            <option value="Leagues">Leagues</option>
            <option value="Platform">Platform</option>
          </Select>
        </label>

        <label className="flex items-center gap-1.5 text-body font-normal text-muted-foreground">
          Type
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="Standard">Standard</option>
            <option value="Splits">Splits</option>
            <option value="Profiles">Profiles</option>
          </Select>
        </label>

        <div className="ml-auto">
          <Drawer open={createOpen} onClose={() => setCreateOpen(false)}>
            <DrawerTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCreateOpen(true)}
              >
                <PlusIcon size={14} />
                Add Export
              </Button>
            </DrawerTrigger>
            {createOpen && (
              <ExportForm
                mode="create"
                initial={EMPTY_FORM}
                onClose={() => setCreateOpen(false)}
                onDone={() => {
                  setCreateOpen(false)
                  router.refresh()
                }}
              />
            )}
          </Drawer>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        defaultPageSize={20}
        defaultSorting={[{ id: "name", desc: false }]}
      />
    </div>
  )
}
