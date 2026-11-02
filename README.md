# branchname

Naming a branch sounds trivial until every contributor does
it differently: `fix-login`, `123-login-bug`, `johns-branch`,
and a dozen variants of the same issue, none of them greppable
in the same way. branchname takes the other approach — you
hand it the issue, and it hands back one name, built the
repo's way every time.

The title is slugified by a fixed, pinned recipe: lowercase
it, replace every maximal run of characters outside
`[a-z0-9]` with a single `-`, and strip leading and trailing
`-`. Punctuation clusters collapse instead of multiplying,
digits survive, and characters outside ASCII — accents,
dashes, emoji — count as separators like any other
punctuation. A title with nothing slugifiable in it at all
is an error ("title produces an empty slug"), not a branch
named `-`.

When the slug runs long, it is truncated: cut to exactly
`max_slug_length` characters (40 by default, never below 8),
then strip any trailing `-` the cut left behind, so a branch
never ends mid-word on a dangling hyphen.

The slug is then composed in one of four conventions:

- **`type-issue-slug`** (the default) —
  `<type>/<issue_number>-<slug>`, for example
  `fix/123-login-redirect-loop`. Requires both `type` and
  `issue_number`.
- **`type-slug`** — `<type>/<slug>`, for example
  `docs/update-install-guide`. Requires `type`.
- **`issue-slug`** — `<issue_number>-<slug>`, for example
  `42-login-redirect-loop`. Requires `issue_number`.
- **`slug`** — just `<slug>`, for example
  `login-redirect-loop`. Requires neither.

`type` is one of `feat`, `fix`, `chore`, `docs`, `refactor`,
or `test`. Asking a convention for a component you did not
supply is an error naming that component, and malformed
input — a missing, empty, or non-string `title`, an
`issue_number` that is not an integer of at least 1, a
`type` or `convention` outside its enum, or a
`max_slug_length` that is not an integer of at least 8 — is
a validation error naming the offending path, with no
partial result. The computation is pure and local: no
network, no configuration, and no repository is read or
touched — branchname only builds the name.

## CLI

```bash
npx @reneturcios/branchname make --input args.json
npx @reneturcios/branchname --version
```

`args.json` contains the full arguments object:

```json
{
  "title": "Fix login redirect loop",
  "issue_number": 123,
  "type": "fix"
}
```

`convention` defaults to `"type-issue-slug"` and
`max_slug_length` defaults to `40`. The result is printed
as JSON:

```json
{
  "branch": "fix/123-fix-login-redirect-loop",
  "slug": "fix-login-redirect-loop",
  "convention": "type-issue-slug"
}
```

Exit codes: `0` on success, `1` on a runtime error (including
an unreadable or invalid input file, or invalid input), `2`
on a usage error.

## MCP server

```bash
npx -y @reneturcios/branchname mcp
```

MCP client config:

```json
{
  "mcpServers": {
    "branchname": {
      "command": "npx",
      "args": ["-y", "@reneturcios/branchname", "mcp"]
    }
  }
}
```

### Tools

- `make_branch_name` — Build a branch name from an issue
  title.
  - `title` (string, required, non-empty) — the issue title
    to slugify
  - `issue_number` (integer, optional, at least 1) — the
    issue number
  - `type` (string, optional) — change type prefix, one of
    `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
  - `convention` (string, optional, default
    `"type-issue-slug"`) — one of `type-issue-slug`,
    `type-slug`, `issue-slug`, `slug`
  - `max_slug_length` (integer, optional, default 40, at
    least 8) — maximum slug length before truncation

  Returns `{branch, slug, convention}`, where `slug` is the
  final (possibly truncated) slug and `convention` echoes
  the resolved convention.

## Docker

```bash
docker run -i ghcr.io/cloudcorprecords/branchname
docker run --rm -v "$PWD:/w" ghcr.io/cloudcorprecords/branchname make --input /w/args.json
```

## Development

```bash
npm install
npm run build   # tsc -> dist/
npm test        # tsx --test test/*.test.ts (pure local, no network)
npm run dev     # run the CLI from source
```

## License

MIT — Copyright (c) 2026 Rene Turcios
