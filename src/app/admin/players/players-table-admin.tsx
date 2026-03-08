"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ChevronLeft } from "lucide-react";
import type { UniverseSearchResult } from "@/app/api/admin/players/universe-search/route";
import { PlayersTable, type PlayerRow } from "@/components/players-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ── Shared field types ────────────────────────────────────────────────────────

type OverrideFields = {
  displayName: string;
  firstName: string;
  lastName: string;
  nickname: string;
  birthday: string;
  team: string;
  mlbLevel: string;
  active: boolean | null;
  bats: string;
  throws: string;
};

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
    active: null,
    bats: "",
    throws: "",
  };
}

function rowToOverride(row: PlayerRow): OverrideFields {
  return {
    displayName: row.fgSpecialChar ?? row.playerName ?? "",
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    nickname: "",
    birthday: row.birthday ?? "",
    team: row.team ?? "",
    mlbLevel: row.mlbLevel ?? "",
    active: row.active,
    bats: row.bats ?? "",
    throws: row.throws ?? "",
  };
}

function nullify(s: string): string | null {
  return s.trim() || null;
}

// ── Edit Override Modal ───────────────────────────────────────────────────────

function EditOverrideModal({
  row,
  onClose,
}: {
  row: PlayerRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [fields, setFields] = useState<OverrideFields>(rowToOverride(row));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  function set<K extends keyof OverrideFields>(key: K, val: OverrideFields[K]) {
    setFields((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setStatus("saving");
    setError("");
    try {
      const res = await fetch(`/api/admin/players/${row.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: nullify(fields.displayName),
          firstName:   nullify(fields.firstName),
          lastName:    nullify(fields.lastName),
          nickname:    nullify(fields.nickname),
          birthday:    nullify(fields.birthday),
          team:        nullify(fields.team),
          mlbLevel:    nullify(fields.mlbLevel),
          active:      fields.active,
          bats:        nullify(fields.bats),
          throws:      nullify(fields.throws),
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error: string };
        setError(d.error ?? "Save failed");
        setStatus("error");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Network error");
      setStatus("error");
    }
  }

  async function handleRemove() {
    if (!row.overrideId) return;
    setStatus("saving");
    setError("");
    try {
      const res = await fetch(`/api/admin/players/${row.id}/override`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json() as { error: string };
        setError(d.error ?? "Delete failed");
        setStatus("error");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Network error");
      setStatus("error");
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Player</DialogTitle>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {row.fgSpecialChar ?? row.playerName}
          {row.isManual && (
            <Badge variant="warning" className="ml-2">manual</Badge>
          )}
        </p>
      </DialogHeader>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Display Name">
          <Input
            value={fields.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder="Override display name"
          />
        </Field>
        <Field label="Nickname">
          <Input
            value={fields.nickname}
            onChange={(e) => set("nickname", e.target.value)}
            placeholder="e.g. Vladito"
          />
        </Field>
        <Field label="First Name">
          <Input
            value={fields.firstName}
            onChange={(e) => set("firstName", e.target.value)}
          />
        </Field>
        <Field label="Last Name">
          <Input
            value={fields.lastName}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </Field>
        <Field label="Birthday (YYYY-MM-DD)">
          <Input
            value={fields.birthday}
            onChange={(e) => set("birthday", e.target.value)}
            placeholder="YYYY-MM-DD"
          />
        </Field>
        <Field label="Team">
          <Input
            value={fields.team}
            onChange={(e) => set("team", e.target.value)}
            placeholder="e.g. LAD"
          />
        </Field>
        <Field label="League">
          <Select
            value={fields.mlbLevel}
            onChange={(e) => set("mlbLevel", e.target.value)}
          >
            <option value="">— not set —</option>
            <option value="AL">AL</option>
            <option value="NL">NL</option>
            <option value="N/A">N/A</option>
          </Select>
        </Field>
        <Field label="Active">
          <Select
            value={fields.active === null ? "" : String(fields.active)}
            onChange={(e) =>
              set("active", e.target.value === "" ? null : e.target.value === "true")
            }
          >
            <option value="">— inherit —</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </Field>
        <Field label="Bats">
          <Select
            value={fields.bats}
            onChange={(e) => set("bats", e.target.value)}
          >
            <option value="">— inherit —</option>
            <option value="R">R</option>
            <option value="L">L</option>
            <option value="S">S</option>
          </Select>
        </Field>
        <Field label="Throws">
          <Select
            value={fields.throws}
            onChange={(e) => set("throws", e.target.value)}
          >
            <option value="">— inherit —</option>
            <option value="R">R</option>
            <option value="L">L</option>
          </Select>
        </Field>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-5 flex items-center justify-between gap-2">
        <div>
          {row.overrideId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={status === "saving"}
            >
              Remove override
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ── Add Manual Player Modal (two-step: search → fill) ────────────────────────

function AddManualModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  // ── Step 1: Search ──────────────────────────────────────────────────────────
  const [nameQuery, setNameQuery] = useState("");
  const [idQuery, setIdQuery]     = useState("");
  const [results, setResults]     = useState<UniverseSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // ── Step 2: Fill ────────────────────────────────────────────────────────────
  const [selected, setSelected]   = useState<UniverseSearchResult | null>(null);
  const [fields, setFields]       = useState<OverrideFields>(emptyOverride());
  const [status, setStatus]       = useState<"idle" | "saving" | "error">("idle");
  const [error, setError]         = useState("");

  // Debounced universe search
  useEffect(() => {
    if (!nameQuery && !idQuery) { setResults([]); return; }
    setSearching(true);
    const params = new URLSearchParams();
    if (idQuery)       params.set("ottoneuId", idQuery);
    else if (nameQuery) params.set("q", nameQuery);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/players/universe-search?${params}`);
        setResults(await res.json() as UniverseSearchResult[]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [nameQuery, idQuery]);

  function selectPlayer(u: UniverseSearchResult) {
    setSelected(u);
    setFields({ ...emptyOverride(), displayName: u.playerName, birthday: u.birthday ?? "" });
  }

  function set<K extends keyof OverrideFields>(key: K, val: OverrideFields[K]) {
    setFields((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!selected) return;
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/admin/players/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: nullify(fields.displayName),
          firstName:   nullify(fields.firstName),
          lastName:    nullify(fields.lastName),
          nickname:    nullify(fields.nickname),
          birthday:    nullify(fields.birthday),
          team:        nullify(fields.team),
          mlbLevel:    nullify(fields.mlbLevel),
          active:      fields.active,
          bats:        nullify(fields.bats),
          throws:      nullify(fields.throws),
          fangraphsId: selected.fangraphsId,
          mlbamId:     selected.mlbamId,
          ottoneuId:   selected.ottoneuId,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error: string | { formErrors: string[] } };
        const msg = typeof d.error === "string"
          ? d.error
          : (d.error?.formErrors?.[0] ?? "Save failed");
        setError(msg);
        setStatus("error");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Network error");
      setStatus("error");
    }
  }

  // ── Step 1: Search UI ───────────────────────────────────────────────────────
  if (!selected) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Player</DialogTitle>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Search the Ottoneu Player Universe by name or ID
          </p>
        </DialogHeader>

        <div className="mt-4 flex gap-2">
          <Input
            autoFocus
            className="flex-1"
            placeholder="Player name"
            value={nameQuery}
            onChange={(e) => { setNameQuery(e.target.value); setIdQuery(""); }}
          />
          <Input
            className="w-24"
            placeholder="ID"
            value={idQuery}
            onChange={(e) => { setIdQuery(e.target.value); setNameQuery(""); }}
          />
        </div>

        {!searching && (nameQuery || idQuery) && (
          <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-700">
            {results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-zinc-400">No results</p>
            ) : 
            results.map((r) => (
              <button
                key={r.ottoneuId}
                disabled={r.alreadyTracked}
                onClick={() => selectPlayer(r)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                  "border-b border-zinc-100 last:border-0 dark:border-zinc-800",
                  r.alreadyTracked
                    ? "cursor-not-allowed text-zinc-300 dark:text-zinc-500"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800",
                )}
              >
                <span className="font-medium">
                  {r.playerName}
                </span>
                <span className="flex items-center gap-3 text-xs">
                  {r.positions.length > 0 && <span>{r.positions.join("/")}</span>}
                  <span>#{r.ottoneuId}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    );
  }

  // ── Step 2: Fill UI ─────────────────────────────────────────────────────────
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add Player</DialogTitle>
      </DialogHeader>

      {/* Read-only universe data */}
      <div className="mt-3 flex gap-4 rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/50">
        <span>
          <span className="text-zinc-400 dark:text-zinc-500">Ott</span>{" "}
          <span className="font-medium">{selected.ottoneuId}</span>
        </span>
        <span>
          <span className="text-zinc-400 dark:text-zinc-500">FG</span>{" "}
          <span className="font-medium">{selected.fangraphsId ?? "—"}</span>
        </span>
        {selected.positions.length > 0 && (
          <span>
            <span className="text-zinc-400 dark:text-zinc-500">Pos</span>{" "}
            <span className="font-medium">{selected.positions.join("/")}</span>
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Display Name">
          <Input
            autoFocus
            value={fields.displayName}
            onChange={(e) => set("displayName", e.target.value)}
          />
        </Field>
        <Field label="Nickname">
          <Input
            value={fields.nickname}
            onChange={(e) => set("nickname", e.target.value)}
          />
        </Field>
        <Field label="First Name">
          <Input
            value={fields.firstName}
            onChange={(e) => set("firstName", e.target.value)}
          />
        </Field>
        <Field label="Last Name">
          <Input
            value={fields.lastName}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </Field>
        <Field label="Birthday">
          <Input
            value={fields.birthday}
            onChange={(e) => set("birthday", e.target.value)}
            placeholder="YYYY-MM-DD"
          />
        </Field>
        <Field label="Team">
          <Input
            value={fields.team}
            onChange={(e) => set("team", e.target.value)}
            placeholder="e.g. LAD"
          />
        </Field>
        <Field label="League">
          <Select
            value={fields.mlbLevel}
            onChange={(e) => set("mlbLevel", e.target.value)}
          >
            <option value="">— not set —</option>
            <option value="AL">AL</option>
            <option value="NL">NL</option>
            <option value="N/A">N/A</option>
          </Select>
        </Field>
        <Field label="Active">
          <Select
            value={fields.active === null ? "" : String(fields.active)}
            onChange={(e) =>
              set("active", e.target.value === "" ? null : e.target.value === "true")
            }
          >
            <option value="">— not set —</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </Field>
        <Field label="Bats">
          <Select
            value={fields.bats}
            onChange={(e) => set("bats", e.target.value)}
          >
            <option value="">—</option>
            <option value="R">R</option>
            <option value="L">L</option>
            <option value="S">S</option>
          </Select>
        </Field>
        <Field label="Throws">
          <Select
            value={fields.throws}
            onChange={(e) => set("throws", e.target.value)}
          >
            <option value="">—</option>
            <option value="R">R</option>
            <option value="L">L</option>
          </Select>
        </Field>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-5 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelected(null)}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Add Player"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PlayersTableAdmin({ data }: { data: PlayerRow[] }) {
  const [editingRow, setEditingRow] = useState<PlayerRow | null>(null);
  const [addingManual, setAddingManual] = useState(false);

  const addButton = (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setAddingManual(true)}
      className="font-medium"
    >
      <UserPlus className="h-4 w-4" />
      Add Player
    </Button>
  );

  return (
    <>
      <PlayersTable data={data} onEdit={setEditingRow} action={addButton} />

      <Dialog open={!!editingRow} onOpenChange={(open) => { if (!open) setEditingRow(null); }}>
        {editingRow && (
          <EditOverrideModal row={editingRow} onClose={() => setEditingRow(null)} />
        )}
      </Dialog>

      <Dialog open={addingManual} onOpenChange={setAddingManual}>
        {addingManual && <AddManualModal onClose={() => setAddingManual(false)} />}
      </Dialog>
    </>
  );
}
