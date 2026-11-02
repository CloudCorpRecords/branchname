/**
 * branchname types.
 *
 * branchname turns an issue title into a git branch name.
 * The caller supplies the title, optionally the issue number
 * and a change-type prefix, the naming convention to compose
 * with, and optionally a maximum slug length. From that data
 * alone, as pure local computation, branchname reports:
 *
 *   - the composed branch name
 *   - the final slug (after slugifying and any truncation)
 *   - the convention that was applied
 *
 * The slug rules are pinned: the title is lowercased, every
 * maximal run of characters outside [a-z0-9] becomes a
 * single "-", and leading and trailing "-" are stripped.
 * A slug longer than the maximum is cut to exactly that
 * many characters, with any trailing "-" left by the cut
 * stripped as well.
 */

/** Change-type prefixes a branch name may carry. */
export type BranchType = "feat" | "fix" | "chore" | "docs" | "refactor" | "test";

/** Naming conventions a branch name may follow. */
export type BranchConvention =
  | "type-issue-slug"
  | "type-slug"
  | "issue-slug"
  | "slug";

/** The arguments accepted by makeBranchName, after validation. */
export interface BranchNameInput {
  /** Issue title to slugify; non-empty. */
  title: string;
  /** Issue number; an integer of at least 1 when present. */
  issue_number?: number;
  /** Change type prefix when present. */
  type?: BranchType;
  /** Naming convention to compose; defaults to "type-issue-slug". */
  convention: BranchConvention;
  /** Maximum slug length before truncation; defaults to 40, at least 8. */
  max_slug_length: number;
}

/** The branch name built from an issue. */
export interface BranchNameResult {
  /** The composed branch name. */
  branch: string;
  /** The final slug, after slugifying and any truncation. */
  slug: string;
  /** The convention that was applied. */
  convention: BranchConvention;
}
