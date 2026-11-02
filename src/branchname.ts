/**
 * branchname core: build a branch name from an issue title.
 *
 *   makeBranchName(args) -> { branch, slug, convention }
 *
 * Slugify (pinned): lowercase the title; replace every
 * maximal run of characters outside [a-z0-9] with a single
 * "-"; strip leading and trailing "-". Non-ASCII characters
 * are outside [a-z0-9], so they act as separators, and
 * digits are kept. When the result is empty the title
 * produces an empty slug, which is an error.
 *
 * Truncation (pinned): when the slug is longer than
 * max_slug_length, cut it to exactly max_slug_length
 * characters, then strip any trailing "-". The first
 * character of a slug is alphanumeric, so a truncated slug
 * is never empty.
 *
 * Composition (pinned), where a missing required component
 * is an error naming that component's path:
 *
 *   "type-issue-slug"  requires type and issue_number
 *                      -> "<type>/<issue_number>-<slug>"
 *   "type-slug"        requires type -> "<type>/<slug>"
 *   "issue-slug"       requires issue_number
 *                      -> "<issue_number>-<slug>"
 *   "slug"             -> "<slug>"
 *
 * Defaults: convention defaults to "type-issue-slug" and
 * max_slug_length defaults to 40.
 *
 * Validation is strict and path-naming: any malformed input
 * throws an Error naming the offending path (for example
 * "issue_number must be an integer >= 1") and no partial
 * result is produced.
 */
import type {
  BranchConvention,
  BranchNameResult,
  BranchType,
} from "./types.js";

export const VERSION = "0.1.0";

const TYPES: readonly BranchType[] = [
  "feat",
  "fix",
  "chore",
  "docs",
  "refactor",
  "test",
];

const CONVENTIONS: readonly BranchConvention[] = [
  "type-issue-slug",
  "type-slug",
  "issue-slug",
  "slug",
];

const DEFAULT_CONVENTION: BranchConvention = "type-issue-slug";
const DEFAULT_MAX_SLUG_LENGTH = 40;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Slugify a title by the pinned rules: lowercase, collapse
 * every maximal run of characters outside [a-z0-9] into a
 * single "-", and strip leading and trailing "-".
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/** Truncate a slug to the maximum length, per the pinned rule. */
function truncateSlug(slug: string, maxSlugLength: number): string {
  if (slug.length <= maxSlugLength) return slug;
  return slug.slice(0, maxSlugLength).replace(/-+$/, "");
}

/**
 * Validate the raw arguments object and return the
 * normalised input, with defaults resolved.
 */
function validateArgs(args: unknown): {
  title: string;
  issueNumber?: number;
  type?: BranchType;
  convention: BranchConvention;
  maxSlugLength: number;
} {
  const raw: Record<string, unknown> = isRecord(args) ? args : {};

  if (raw.title === undefined) throw new Error("title is required");
  if (typeof raw.title !== "string" || raw.title.length === 0) {
    throw new Error("title must be a non-empty string");
  }

  let issueNumber: number | undefined;
  if (raw.issue_number !== undefined) {
    if (
      typeof raw.issue_number !== "number" ||
      !Number.isInteger(raw.issue_number) ||
      raw.issue_number < 1
    ) {
      throw new Error("issue_number must be an integer >= 1");
    }
    issueNumber = raw.issue_number;
  }

  let type: BranchType | undefined;
  if (raw.type !== undefined) {
    if (typeof raw.type !== "string" || !TYPES.includes(raw.type as BranchType)) {
      throw new Error(`type must be one of ${TYPES.map((t) => `"${t}"`).join(", ")}`);
    }
    type = raw.type as BranchType;
  }

  let convention: BranchConvention = DEFAULT_CONVENTION;
  if (raw.convention !== undefined) {
    if (
      typeof raw.convention !== "string" ||
      !CONVENTIONS.includes(raw.convention as BranchConvention)
    ) {
      throw new Error(
        `convention must be one of ${CONVENTIONS.map((c) => `"${c}"`).join(", ")}`,
      );
    }
    convention = raw.convention as BranchConvention;
  }

  let maxSlugLength = DEFAULT_MAX_SLUG_LENGTH;
  if (raw.max_slug_length !== undefined) {
    if (
      typeof raw.max_slug_length !== "number" ||
      !Number.isInteger(raw.max_slug_length) ||
      raw.max_slug_length < 8
    ) {
      throw new Error("max_slug_length must be an integer >= 8");
    }
    maxSlugLength = raw.max_slug_length;
  }

  return { title: raw.title, issueNumber, type, convention, maxSlugLength };
}

/** Build a branch name from an issue title. */
export function makeBranchName(args: unknown): BranchNameResult {
  const { title, issueNumber, type, convention, maxSlugLength } = validateArgs(args);

  const fullSlug = slugify(title);
  if (fullSlug.length === 0) {
    throw new Error("title produces an empty slug");
  }
  const slug = truncateSlug(fullSlug, maxSlugLength);

  let branch: string;
  switch (convention) {
    case "type-issue-slug": {
      if (type === undefined) {
        throw new Error(`type is required for convention "type-issue-slug"`);
      }
      if (issueNumber === undefined) {
        throw new Error(`issue_number is required for convention "type-issue-slug"`);
      }
      branch = `${type}/${issueNumber}-${slug}`;
      break;
    }
    case "type-slug": {
      if (type === undefined) {
        throw new Error(`type is required for convention "type-slug"`);
      }
      branch = `${type}/${slug}`;
      break;
    }
    case "issue-slug": {
      if (issueNumber === undefined) {
        throw new Error(`issue_number is required for convention "issue-slug"`);
      }
      branch = `${issueNumber}-${slug}`;
      break;
    }
    case "slug": {
      branch = slug;
      break;
    }
  }

  return { branch, slug, convention };
}

/** Render a payload as the JSON text block MCP clients show. */
export function formatPayload(payload: unknown): string {
  return typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
}
