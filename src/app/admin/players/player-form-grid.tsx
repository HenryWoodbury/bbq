"use client"

import { Undo2Icon } from "lucide-react"
import { useRef } from "react"
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
}

export function PlayerFormGrid({
  fields,
  onChange,
  undo,
  autoFocusDisplayName,
}: PlayerFormGridProps) {
  const nicknamePlaceholder = useRef(
    `e.g. ${NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)]}`,
  ).current

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Display Name">
        <div className="flex items-center gap-1">
          <Input
            autoFocus={autoFocusDisplayName}
            value={fields.displayName}
            onChange={(e) => onChange("displayName", e.target.value)}
            placeholder="Override display name"
            className="flex-1"
          />
          {undo?.isDirty("displayName") && (
            <IconButton
              onClick={() => undo.clearField("displayName")}
              aria-label="Clear display name override"
            >
              <Undo2Icon className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      </Field>
      <div className="flex gap-4">
        <Field label="Level">
          <div className="flex items-center gap-1">
            <Select
              value={fields.mlbLevel}
              onChange={(e) => onChange("mlbLevel", e.target.value)}
              className="flex-1"
            >
              <option value="">—</option>
              <option value="MLB">MLB</option>
              <option value="MiLB">MiLB</option>
            </Select>
            {undo?.isDirty("mlbLevel") && (
              <IconButton
                onClick={() => undo.clearField("mlbLevel")}
                aria-label="Clear level override"
              >
                <Undo2Icon className="h-3.5 w-3.5" />
              </IconButton>
            )}
          </div>
        </Field>
        <Field label="League">
          <div className="flex items-center gap-1">
            <Select
              value={fields.league}
              onChange={(e) => onChange("league", e.target.value)}
              className="flex-1"
            >
              <option value="">—</option>
              <option value="AL">AL</option>
              <option value="NL">NL</option>
            </Select>
            {undo?.isDirty("league") && (
              <IconButton
                onClick={() => undo.clearField("league")}
                aria-label="Clear league override"
              >
                <Undo2Icon className="h-3.5 w-3.5" />
              </IconButton>
            )}
          </div>
        </Field>
      </div>

      <Field label="First Name">
        <div className="flex items-center gap-1">
          <Input
            value={fields.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            className="flex-1"
          />
          {undo?.isDirty("firstName") && (
            <IconButton
              onClick={() => undo.clearField("firstName")}
              aria-label="Clear first name override"
            >
              <Undo2Icon className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      </Field>
      <Field label="Team">
        <div className="flex items-center gap-1">
          <Input
            value={fields.team}
            onChange={(e) => onChange("team", e.target.value)}
            placeholder="e.g. LAD"
            className="flex-1"
          />
          {undo?.isDirty("team") && (
            <IconButton
              onClick={() => undo.clearField("team")}
              aria-label="Clear team override"
            >
              <Undo2Icon className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      </Field>

      <Field label="Last Name">
        <div className="flex items-center gap-1">
          <Input
            value={fields.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            className="flex-1"
          />
          {undo?.isDirty("lastName") && (
            <IconButton
              onClick={() => undo.clearField("lastName")}
              aria-label="Clear last name override"
            >
              <Undo2Icon className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      </Field>
      <Field label="Active">
        <div className="flex items-center gap-1">
          <Select
            value={fields.active === null ? "" : String(fields.active)}
            onChange={(e) =>
              onChange(
                "active",
                e.target.value === "" ? null : e.target.value === "true",
              )
            }
            className="flex-1"
          >
            {!undo && <option value="">—</option>}
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
          {undo?.isDirtyActive() && (
            <IconButton
              onClick={() => undo.clearField("active")}
              aria-label="Clear active override"
            >
              <Undo2Icon className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      </Field>

      <Field label="Nickname">
        <div className="flex items-center gap-1">
          <Input
            value={fields.nickname}
            onChange={(e) => onChange("nickname", e.target.value)}
            placeholder={nicknamePlaceholder}
            className="flex-1"
          />
          {undo?.hasNickname && (
            <IconButton
              onClick={() => undo.clearField("nickname")}
              aria-label="Clear nickname"
            >
              <Undo2Icon className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      </Field>
      <div className="flex gap-4">
        <Field label="B">
          <div className="flex items-center gap-1">
            <Select
              value={fields.bats}
              onChange={(e) => onChange("bats", e.target.value)}
              className="flex-1"
            >
              <option value="">—</option>
              <option value="R">R</option>
              <option value="L">L</option>
              <option value="S">S</option>
            </Select>
            {undo?.isDirty("bats") && (
              <IconButton
                onClick={() => undo.clearField("bats")}
                aria-label="Clear bats override"
              >
                <Undo2Icon className="h-3.5 w-3.5" />
              </IconButton>
            )}
          </div>
        </Field>
        <Field label="T">
          <div className="flex items-center gap-1">
            <Select
              value={fields.throws}
              onChange={(e) => onChange("throws", e.target.value)}
              className="flex-1"
            >
              <option value="">—</option>
              <option value="R">R</option>
              <option value="L">L</option>
            </Select>
            {undo?.isDirty("throws") && (
              <IconButton
                onClick={() => undo.clearField("throws")}
                aria-label="Clear throws override"
              >
                <Undo2Icon className="h-3.5 w-3.5" />
              </IconButton>
            )}
          </div>
        </Field>
      </div>

      <Field label="Birthday (YYYY-MM-DD)">
        <div className="flex items-center gap-1">
          <Input
            value={fields.birthday}
            onChange={(e) => onChange("birthday", e.target.value)}
            placeholder="YYYY-MM-DD"
            className="flex-1"
          />
          {undo?.isDirty("birthday") && (
            <IconButton
              onClick={() => undo.clearField("birthday")}
              aria-label="Clear birthday override"
            >
              <Undo2Icon className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      </Field>
      <Field label="Position">
        <div className="flex items-center gap-1">
          <Input
            value={fields.positions}
            onChange={(e) => onChange("positions", e.target.value)}
            placeholder="e.g. SP/RP"
            className="flex-1"
          />
          {undo?.isDirtyPositions() && (
            <IconButton
              onClick={() => undo.clearField("positions")}
              aria-label="Clear position override"
            >
              <Undo2Icon className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      </Field>
    </div>
  )
}
