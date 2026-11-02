# Changelog

## 0.1.0 (2026-10-27)

- Initial release: `make_branch_name` MCP tool and `make`
  CLI command building a branch name from an issue title,
  its number, and a change type.
- Pinned slugify: lowercase, every maximal run of
  characters outside [a-z0-9] collapsed to a single "-",
  leading and trailing "-" stripped, and an empty result
  reported as "title produces an empty slug".
- Pinned truncation: slugs longer than `max_slug_length`
  (default 40, minimum 8) are cut to exactly that length
  with any trailing "-" left by the cut stripped.
- Four composition conventions — `type-issue-slug`
  (default), `type-slug`, `issue-slug`, and `slug` — with
  a missing required component reported as an error naming
  that component's path.
- Path-naming validation errors for malformed input,
  including enum checks for `type` and `convention` and
  range checks for `issue_number` and `max_slug_length`.
