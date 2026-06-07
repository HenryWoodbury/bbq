"use client"

import { Undo2Icon } from "lucide-react"
import { type ReactNode, useRef } from "react"
import { Field } from "@/components/ui/field"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

const NICKNAMES = [
  "Mr. Smile",
  "The Penguin",
  "Scrabble",
  "The Password",
  "The Human Rain Delay",
  "Joey Bats",
  "Oil Can",
  "The Big Hurt",
  "The Big Unit",
  "Kung Fu Panda",
  "Turkey",
  "The Say Hey Kid",
  "The Splendid Splinter",
  "Mr. October",
  "The Wizard",
  "Big Papi",
  "PTBNL",
  "Pickles",
  "Boomstick",
  "Sweet Lettuce",
  "Porterhouse",
  "Tokki 1",
  "Tokki 2",
  "Three Finger",
  "Tungsten Arm",
  "Wagon Tongue",
  "Junebug",
  "Big Salt",
  "El Pulpo",
  "Matatán",
  "Polar Bear",
  "Mr. Jello",
  "Mr. Duck",
  "Saturn Nuts",
  "Big Train",
  "Terremoto",
  "The Earl of Snohomish",
  "Baggy",
  "Barnicles",
  "Pooch",
  "El Gallo",
  "Bunions",
  "Cool Papa",
  "Tito",
  "El Koja",
  "El Pikante",
  "Bananas",
  "Fat Elvis",
  "Birdman",
  "Preacher",
  "Gray Flamingo",
  "Duke",
  "Bear",
  "Professor",
  "Deacon",
  "Boardwalk",
  "Downtown",
  "Diesel",
  "Smoky",
] as const

export type OverrideFields = {
  displayName: string
  firstName: string
  lastName: string
  nickname: string
  birthday: string
  team: string
  mlbLevel: string
  league: string
  active: boolean | null
  bats: string
  throws: string
  positions: string
}

type UndoControls = {
  isDirty: (
    key: Exclude<keyof OverrideFields, "nickname" | "active" | "positions">,
  ) => boolean
  isDirtyActive: () => boolean
  isDirtyPositions: () => boolean
  clearField: (key: keyof OverrideFields) => void
  hasNickname: boolean
}

export type PlayerFormGridProps = {
  fields: OverrideFields
  onChange: <K extends keyof OverrideFields>(
    key: K,
    val: OverrideFields[K],
  ) => void
  undo?: UndoControls
  autoFocusDisplayName?: boolean
  includeNullActive?: boolean
}

function FieldWithUndo({
  dirty,
  onUndo,
  label,
  children,
}: {
  dirty: boolean
  onUndo: () => void
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-1">
      {children}
      {dirty && (
        <IconButton onClick={onUndo} aria-label={`Clear ${label} override`}>
          <Undo2Icon />
        </IconButton>
      )}
    </div>
  )
}

export function PlayerFormGrid({
  fields,
  onChange,
  undo,
  autoFocusDisplayName,
  includeNullActive,
}: PlayerFormGridProps) {
  const nicknamePlaceholder = useRef(
    `e.g. ${NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)]}`,
  ).current

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Display Name">
        <FieldWithUndo dirty={!!undo?.isDirty("displayName")} onUndo={() => undo?.clearField("displayName")} label="display name">
          <Input
            autoFocus={autoFocusDisplayName}
            value={fields.displayName}
            onChange={(e) => onChange("displayName", e.target.value)}
            placeholder="Override display name"
            className="flex-1"
          />
        </FieldWithUndo>
      </Field>

      <div className="flex gap-4">
        <Field label="Level">
          <FieldWithUndo dirty={!!undo?.isDirty("mlbLevel")} onUndo={() => undo?.clearField("mlbLevel")} label="level">
            <Select value={fields.mlbLevel} onChange={(e) => onChange("mlbLevel", e.target.value)} className="flex-1">
              <option value="">—</option>
              <option value="MLB">MLB</option>
              <option value="MiLB">MiLB</option>
            </Select>
          </FieldWithUndo>
        </Field>
        <Field label="League">
          <FieldWithUndo dirty={!!undo?.isDirty("league")} onUndo={() => undo?.clearField("league")} label="league">
            <Select value={fields.league} onChange={(e) => onChange("league", e.target.value)} className="flex-1">
              <option value="">—</option>
              <option value="AL">AL</option>
              <option value="NL">NL</option>
            </Select>
          </FieldWithUndo>
        </Field>
      </div>

      <Field label="First Name">
        <FieldWithUndo dirty={!!undo?.isDirty("firstName")} onUndo={() => undo?.clearField("firstName")} label="first name">
          <Input value={fields.firstName} onChange={(e) => onChange("firstName", e.target.value)} className="flex-1" />
        </FieldWithUndo>
      </Field>

      <Field label="Team">
        <FieldWithUndo dirty={!!undo?.isDirty("team")} onUndo={() => undo?.clearField("team")} label="team">
          <Input value={fields.team} onChange={(e) => onChange("team", e.target.value)} placeholder="e.g. LAD" className="flex-1" />
        </FieldWithUndo>
      </Field>

      <Field label="Last Name">
        <FieldWithUndo dirty={!!undo?.isDirty("lastName")} onUndo={() => undo?.clearField("lastName")} label="last name">
          <Input value={fields.lastName} onChange={(e) => onChange("lastName", e.target.value)} className="flex-1" />
        </FieldWithUndo>
      </Field>

      <Field label="Active">
        <FieldWithUndo dirty={!!undo?.isDirtyActive()} onUndo={() => undo?.clearField("active")} label="active">
          <Select
            value={fields.active === null ? "" : String(fields.active)}
            onChange={(e) =>
              onChange("active", e.target.value === "" ? null : e.target.value === "true")
            }
            className="flex-1"
          >
            {(!undo || includeNullActive) && <option value="">—</option>}
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </FieldWithUndo>
      </Field>

      <Field label="Nickname">
        <FieldWithUndo dirty={!!undo?.hasNickname} onUndo={() => undo?.clearField("nickname")} label="nickname">
          <Input
            value={fields.nickname}
            onChange={(e) => onChange("nickname", e.target.value)}
            placeholder={nicknamePlaceholder}
            className="flex-1"
          />
        </FieldWithUndo>
      </Field>

      <div className="flex gap-4">
        <Field label="B">
          <FieldWithUndo dirty={!!undo?.isDirty("bats")} onUndo={() => undo?.clearField("bats")} label="bats">
            <Select value={fields.bats} onChange={(e) => onChange("bats", e.target.value)} className="flex-1">
              <option value="">—</option>
              <option value="R">R</option>
              <option value="L">L</option>
              <option value="S">S</option>
            </Select>
          </FieldWithUndo>
        </Field>
        <Field label="T">
          <FieldWithUndo dirty={!!undo?.isDirty("throws")} onUndo={() => undo?.clearField("throws")} label="throws">
            <Select value={fields.throws} onChange={(e) => onChange("throws", e.target.value)} className="flex-1">
              <option value="">—</option>
              <option value="R">R</option>
              <option value="L">L</option>
            </Select>
          </FieldWithUndo>
        </Field>
      </div>

      <Field label="Birthday (YYYY-MM-DD)">
        <FieldWithUndo dirty={!!undo?.isDirty("birthday")} onUndo={() => undo?.clearField("birthday")} label="birthday">
          <Input
            value={fields.birthday}
            onChange={(e) => onChange("birthday", e.target.value)}
            placeholder="YYYY-MM-DD"
            className="flex-1"
          />
        </FieldWithUndo>
      </Field>

      <Field label="Position">
        <FieldWithUndo dirty={!!undo?.isDirtyPositions()} onUndo={() => undo?.clearField("positions")} label="position">
          <Input
            value={fields.positions}
            onChange={(e) => onChange("positions", e.target.value)}
            placeholder="e.g. SP/RP"
            className="flex-1"
          />
        </FieldWithUndo>
      </Field>
    </div>
  )
}
