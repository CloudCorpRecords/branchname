# branchname — Build Report

MCP Rebuild 1000, Batch 16. Original program build from the
packages-100 plan (cluster H #91), built from the spec in
`~/workspace/mcp-rebuild-100/specs-batch16/branchname.md`
(read first). There is no external original; the tool surface
is the program's defined spec. Local build only — nothing
pushed or published.

Identity: repo `branchname`, npm `@reneturcios/branchname`,
MCP name `io.github.CloudCorpRecords/branchname`, version
`0.1.0`, bin `branchname` → `dist/cli.js`.

## Files created (19/19 per TEMPLATE.md checklist)

- `package.json`, `server.json` (description "Build a branch
  name from an issue title and number, in the repo's naming
  convention." — 84 chars, verified by count; npm entry
  carries `version: 0.1.0`; OCI entry
  `ghcr.io/cloudcorprecords/branchname:0.1.0` carries **no**
  `version` field), `Dockerfile` (node:20-alpine two-stage,
  label
  `io.modelcontextprotocol.server.name="io.github.CloudCorpRecords/branchname"`),
  `tsconfig.json`, `.gitignore`, `LICENSE` (MIT, Copyright
  (c) 2026 Rene Turcios), `README.md` (fresh text),
  `CHANGELOG.md` (single 0.1.0 entry, 2026-10-27),
  `package-lock.json` (Route 3, see below)
- `src/index.ts`, `src/cli.ts` (`make --input <args.json>`
  where the file holds the full arguments object, `mcp`,
  `--version`; exit 2 usage / 1 runtime error, argument
  validation before any file read), `src/mcp.ts`,
  `src/types.ts`, `src/branchname.ts` (core,
  `VERSION = "0.1.0"`, also exporting the pinned `slugify`)
- `test/branchname.test.ts`
- `.github/workflows/{ci,publish,publish-container,registry-publish}.yml`
  (publish-container `IMAGE = ghcr.io/cloudcorprecords/branchname`,
  smoke-test server-name assertion `branchname`)

Plus the parity fixture at
`harness/fixtures/branchname-tools-original.json`, labelled
as a program spec from the packages-100 plan cluster H #91.

## Tools implemented (1)

- `make_branch_name` — arguments: `title` (string, required,
  non-empty), `issue_number` (integer, optional, >= 1),
  `type` (string, optional, enum ["feat", "fix", "chore",
  "docs", "refactor", "test"]), `convention` (string,
  optional, default "type-issue-slug", enum
  ["type-issue-slug", "type-slug", "issue-slug", "slug"]),
  and `max_slug_length` (integer, optional, default 40,
  >= 8). The schema literal carries both enums exactly.

  Slugify is pinned: lowercase the title; replace every
  maximal run of characters outside [a-z0-9] with a single
  "-"; strip leading and trailing "-". Non-ASCII characters
  are outside [a-z0-9], so they act as separators, and
  digits are kept. An empty result is the error
  "title produces an empty slug". Truncation is pinned:
  a slug longer than `max_slug_length` is cut to exactly
  `max_slug_length` characters, then any trailing "-" left
  by the cut is stripped (the first character is
  alphanumeric, so a truncated slug is never empty).

  Composition is pinned, and a missing required component
  is an error naming that component's path:
  "type-issue-slug" requires `type` and `issue_number` →
  `<type>/<issue_number>-<slug>`; "type-slug" requires
  `type` → `<type>/<slug>`; "issue-slug" requires
  `issue_number` → `<issue_number>-<slug>`; "slug" →
  `<slug>`. Returns `{branch, slug, convention}`: `slug`
  is the final (possibly truncated) slug and `convention`
  echoes the resolved convention.

  The fixture literal
  (`harness/fixtures/branchname-tools-original.json`) and
  the `src/mcp.ts` literal are identical, with no `$schema`
  and no `additionalProperties` — confirmed by the parity
  run below.

## Implementation notes

- `src/mcp.ts` uses the SDK's low-level `Server` with an
  explicit inputSchema literal exactly matching the
  fixture, per the standing fleet rule (no McpServer/zod
  schema conversion). Every `tools/call` is validated by
  the core itself, so the MCP and CLI paths share one
  validation implementation; the core takes the full
  arguments object (`{title, issue_number?, type?,
  convention?, max_slug_length?}`).
- Validation is path-naming and total: a missing, empty,
  or non-string `title`; an `issue_number` present but not
  an integer >= 1; a `type` or `convention` present but
  outside its enum (the error lists the enum values); or a
  `max_slug_length` present but not an integer >= 8 throws
  an Error naming the offending path and produces no
  partial result (MCP: `isError`; CLI: exit 1). Field
  validation runs before the missing-component checks, so
  a malformed component is reported as malformed rather
  than as missing. Missing-component order within
  "type-issue-slug" (a pinned judgement call, see Gaps):
  `type` is checked before `issue_number`.

## Verification (foreground, this session)

- `npm test` (`tsx --test test/*.test.ts`): **39 tests,
  39 pass, 0 fail** — slugify pins (lowercasing, runs of
  separators collapsing including mixed punctuation,
  leading/trailing strip, non-ASCII characters treated as
  separators, digits kept, separator-only titles
  slugifying to empty); truncation (no cut at exactly the
  default maximum, exact-length cut at the default and at
  a custom maximum, trailing hyphen strip after a cut, a
  cut not landing on a hyphen keeping the full length, a
  slug at exactly a custom maximum left alone, the minimum
  maximum of 8, truncation applied before composition);
  all four conventions with exact result objects, the
  default convention, every `type` enum value, and an
  unused `issue_number` accepted under "slug";
  missing-component errors per convention naming the
  component (`type` before `issue_number` under the
  default convention); the empty-slug error for
  punctuation-only, non-ASCII-only, and whitespace-only
  titles; and every validation path (missing/empty/
  non-string `title`, `issue_number` 0 / negative /
  fractional / string / boolean / null plus 1 valid,
  `type` and `convention` enum errors with the exact
  messages, `max_slug_length` 7 / 0 / negative /
  fractional / string / boolean / null, unknown extra
  fields ignored, and no partial result on invalid input).
- `npx tsc --noEmit` → exit 0; `npm run build` produced
  `dist/` with all 15 outputs.
- `dist/cli.js --version` → `0.1.0`; unknown command exits
  2 with usage; `make` with no `--input` exits 2;
  `make --input <missing file>` exits 1 naming the file;
  `make --input <valid file>` exits 0 and prints
  `{"branch": "fix/123-fix-login-redirect-loop", "slug":
  "fix-login-redirect-loop", "convention":
  "type-issue-slug"}` for the hand-checked input
  `{"title": "Fix login redirect loop", "issue_number":
  123, "type": "fix"}`; `make --input <invalid file>`
  (type but no issue number, default convention) exits 1
  with `issue_number is required for convention
  "type-issue-slug"`.
- Parity: `harness/parity.py` vs
  `harness/fixtures/branchname-tools-original.json` →
  **PASS, parity 100.0, identical_tools 1/1** (run with
  the rebuild path as an absolute path; the harness does
  not expand a `~` inside the quoted stdio command
  string). Report saved under `parity-out/`.

## Lockfile status

`package-lock.json` generated clean via Route 3 (in the
build directory with no `node_modules` present, offline
`npm install --package-lock-only --ignore-scripts
--offline`), verified: parses, name
`@reneturcios/branchname`, **128 package entries**.
Resolved versions match the sibling reference tree
(`@modelcontextprotocol/sdk` 1.32.2, `zod` 3.25.76,
`tsx` 4.23.15, `typescript` 5.9.3, `@types/node`
20.19.43, `qs` 6.17.0). The subsequent offline
`npm install --ignore-scripts --offline`, build, tests,
and parity all ran against this lockfile's tree.

## Gaps / honest notes

- **Pinned judgement calls** (each with a dedicated
  test where applicable): (1) missing-component order —
  under "type-issue-slug" with both components missing,
  `type` is reported before `issue_number` (the spec
  names both as required but does not order them);
  (2) unknown extra fields are ignored rather than
  rejected (the spec does not forbid them); (3) a
  non-object top-level arguments value is treated as an
  empty object, so it fails as `title is required`;
  (4) components supplied but unused by the chosen
  convention (e.g. `issue_number` under "slug") are
  accepted and ignored, after passing their own
  validation — validation of a present field does not
  depend on the convention; (5) error-message wording
  other than the pinned "title produces an empty slug"
  follows the fleet's path-naming pattern (e.g.
  `issue_number must be an integer >= 1`,
  `type is required for convention "type-slug"`).
  No other spec ambiguity was found in the core
  behaviour.
- Container build not exercised locally; the
  publish-container workflow smoke-tests the image at
  publish time.
- Nothing pushed or published; this is a local build only.
