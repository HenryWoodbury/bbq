<!--
TASK-STRUCTURED SPEC TEMPLATE
Copy this file to author a new spec. Delete this comment block.

Goal of this template: every spec reads as a GUIDE TO AN OUTCOME (generative),
not a narration of the code (descriptive). Two audiences at once:
  • an AI agent can parse the structure and act on it
  • an expert engineer can read the prose and rebuild from it

The test: a competent engineer/agent given ONLY this spec (not the code) should
arrive at a functionally equivalent system. If a section only makes sense with
the code open, rewrite it as intent + acceptance.
-->

# <Spec Name>

> **Type:** reference · spec · plan &nbsp;|&nbsp; **Status:** as-built · partial · planned &nbsp;|&nbsp; **Last reconciled:** YYYY-MM-DD

## Goal
One or two sentences: the capability this delivers and **why it exists** — the
outcome, in user/system terms, not the mechanism. Imperative/goal voice
("A commissioner can…", "The system must…"), never past tense ("We built…").

## Invariants & constraints
Rules that must always hold and the constraints that shaped the design. These
are the *stable* part of the spec — they survive refactors. Examples: "every
query filters `deletedAt: null`", "one league = one Clerk org", "stat keys vary
by source, so they are stored as JSONB".

## Capabilities (tasks)
Each capability is a task with acceptance criteria, ordered so it could drive a
build. Lead with intent; put concrete realization last.

### <Capability name>
- **Goal:** what a user/system can do.
- **Acceptance:** observable criteria that prove it works (a test or a manual check).
- **Realization:** the files/models/routes that implement it today — clearly
  labeled as the *contingent* detail (renames here don't invalidate the goal above).

## Current realization (map)
A compact map from this spec to the code: the models, routes, and modules that
implement it. This is the only section allowed to be code-shaped; everything
above is intent-first.

## Next / Open questions
The forward edge that keeps this a roadmap, not a changelog: what is not yet
built, what is deferred to which stage, and where rationale is unknown
(write "Rationale: TBD" rather than inventing one).
