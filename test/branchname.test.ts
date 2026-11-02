import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { makeBranchName, slugify } from "../src/branchname.js";

/**
 * All tests are pure local computation over inline titles:
 * no filesystem and no network. The slugify pins (separator
 * runs collapsing, leading/trailing strip, non-ASCII as
 * separators, digits kept), the truncation pins (exact-length
 * cut, trailing hyphen strip after the cut), all four
 * conventions, the missing-component error per convention,
 * the empty-slug error, and every enum/range validation path
 * are each pinned.
 */

const slugOnly = (title: string, extra: Record<string, unknown> = {}) =>
  makeBranchName({ title, convention: "slug", ...extra });

describe("slugify — pinned rules", () => {
  it("lowercases the title", () => {
    assert.equal(slugify("Fix The LOGIN Bug"), "fix-the-login-bug");
  });

  it("runs of separators collapse into a single hyphen", () => {
    assert.equal(slugify("a   b"), "a-b");
    assert.equal(slugify("a -_- b"), "a-b");
    assert.equal(slugify("one... two!!!three"), "one-two-three");
    assert.equal(slugOnly("Add -- weird __ spacing").slug, "add-weird-spacing");
  });

  it("leading and trailing separators are stripped", () => {
    assert.equal(slugify("---hello world---"), "hello-world");
    assert.equal(slugify("  padded title  "), "padded-title");
    assert.equal(slugify("!bang start and end!"), "bang-start-and-end");
  });

  it("non-ASCII characters are treated as separators", () => {
    assert.equal(slugify("café menu"), "caf-menu");
    assert.equal(slugify("naïve—approach"), "na-ve-approach");
    assert.equal(slugify("über fix"), "ber-fix");
    assert.equal(slugOnly("Résumé parser").slug, "r-sum-parser");
  });

  it("digits are kept", () => {
    assert.equal(slugify("HTTP 404 on v2 API"), "http-404-on-v2-api");
    assert.equal(slugify("123 go"), "123-go");
  });

  it("a title of only separators slugifies to the empty string", () => {
    assert.equal(slugify("--- !!! ---"), "");
    assert.equal(slugify("éèê"), "");
  });
});

describe("makeBranchName — truncation", () => {
  it("a slug at exactly the default maximum is not truncated", () => {
    const title = "a".repeat(40);
    const out = slugOnly(title);
    assert.equal(out.slug, "a".repeat(40));
    assert.equal(out.branch, "a".repeat(40));
  });

  it("a slug longer than the maximum is cut to exactly max_slug_length characters", () => {
    const out = slugOnly("a".repeat(50));
    assert.equal(out.slug, "a".repeat(40));
    assert.equal(out.slug.length, 40);
  });

  it("a custom max_slug_length cuts to exactly that length", () => {
    const out = slugOnly("abcdefghij klmnop", { max_slug_length: 8 });
    // slug is "abcdefghij-klmnop"; cut to 8 -> "abcdefgh".
    assert.equal(out.slug, "abcdefgh");
    assert.equal(out.slug.length, 8);
  });

  it("a trailing hyphen left by the cut is stripped", () => {
    // slug is "abcdefg-hij"; cut to 8 -> "abcdefg-" -> strip -> "abcdefg".
    const out = slugOnly("abcdefg hij", { max_slug_length: 8 });
    assert.equal(out.slug, "abcdefg");
  });

  it("a cut that does not land on a hyphen keeps the full cut length", () => {
    // slug is "abcd-efghij"; cut to 8 -> "abcd-efg" (no trailing hyphen).
    const out = slugOnly("abcd efghij", { max_slug_length: 8 });
    assert.equal(out.slug, "abcd-efg");
    assert.equal(out.slug.length, 8);
  });

  it("a slug at exactly a custom maximum is left alone", () => {
    const out = slugOnly("abcd efgh", { max_slug_length: 9 });
    assert.equal(out.slug, "abcd-efgh");
  });

  it("the minimum max_slug_length of 8 is accepted", () => {
    const out = slugOnly("short one here", { max_slug_length: 8 });
    assert.equal(out.slug, "short-on");
  });

  it("truncation applies before composition, so the branch carries the truncated slug", () => {
    const out = makeBranchName({
      title: "a".repeat(50),
      type: "feat",
      issue_number: 7,
    });
    assert.equal(out.branch, `feat/7-${"a".repeat(40)}`);
    assert.equal(out.slug, "a".repeat(40));
  });
});

describe("makeBranchName — the four conventions", () => {
  const title = "Fix login redirect loop";

  it("type-issue-slug composes '<type>/<issue_number>-<slug>'", () => {
    const out = makeBranchName({
      title,
      type: "fix",
      issue_number: 123,
      convention: "type-issue-slug",
    });
    assert.deepEqual(out, {
      branch: "fix/123-fix-login-redirect-loop",
      slug: "fix-login-redirect-loop",
      convention: "type-issue-slug",
    });
  });

  it("type-issue-slug is the default convention", () => {
    const out = makeBranchName({ title, type: "feat", issue_number: 42 });
    assert.deepEqual(out, {
      branch: "feat/42-fix-login-redirect-loop",
      slug: "fix-login-redirect-loop",
      convention: "type-issue-slug",
    });
  });

  it("type-slug composes '<type>/<slug>' and needs no issue number", () => {
    const out = makeBranchName({ title, type: "docs", convention: "type-slug" });
    assert.deepEqual(out, {
      branch: "docs/fix-login-redirect-loop",
      slug: "fix-login-redirect-loop",
      convention: "type-slug",
    });
  });

  it("issue-slug composes '<issue_number>-<slug>' and needs no type", () => {
    const out = makeBranchName({ title, issue_number: 9, convention: "issue-slug" });
    assert.deepEqual(out, {
      branch: "9-fix-login-redirect-loop",
      slug: "fix-login-redirect-loop",
      convention: "issue-slug",
    });
  });

  it("slug composes just '<slug>' and needs neither type nor issue number", () => {
    const out = makeBranchName({ title, convention: "slug" });
    assert.deepEqual(out, {
      branch: "fix-login-redirect-loop",
      slug: "fix-login-redirect-loop",
      convention: "slug",
    });
  });

  it("every type enum value composes in the type positions", () => {
    for (const type of ["feat", "fix", "chore", "docs", "refactor", "test"]) {
      const out = makeBranchName({ title: "Tidy up", type, convention: "type-slug" });
      assert.equal(out.branch, `${type}/tidy-up`);
    }
  });

  it("an issue number supplied under slug or type-slug is accepted but unused", () => {
    const out = makeBranchName({
      title: "Tidy up",
      issue_number: 5,
      convention: "slug",
    });
    assert.equal(out.branch, "tidy-up");
  });
});

describe("makeBranchName — missing required components per convention", () => {
  const title = "Fix login redirect loop";

  it("type-issue-slug without type names type", () => {
    assert.throws(() => makeBranchName({ title, issue_number: 1 }), {
      message: 'type is required for convention "type-issue-slug"',
    });
  });

  it("type-issue-slug without issue_number names issue_number", () => {
    assert.throws(() => makeBranchName({ title, type: "fix" }), {
      message: 'issue_number is required for convention "type-issue-slug"',
    });
  });

  it("the default convention without either component names type first", () => {
    assert.throws(() => makeBranchName({ title }), {
      message: 'type is required for convention "type-issue-slug"',
    });
  });

  it("type-slug without type names type", () => {
    assert.throws(() => makeBranchName({ title, convention: "type-slug" }), {
      message: 'type is required for convention "type-slug"',
    });
  });

  it("issue-slug without issue_number names issue_number", () => {
    assert.throws(() => makeBranchName({ title, convention: "issue-slug" }), {
      message: 'issue_number is required for convention "issue-slug"',
    });
  });

  it("slug never reports a missing component", () => {
    assert.equal(makeBranchName({ title, convention: "slug" }).branch, "fix-login-redirect-loop");
  });
});

describe("makeBranchName — empty slug", () => {
  it("a title with no [a-z0-9] characters produces the empty-slug error", () => {
    assert.throws(() => slugOnly("!!! --- ???"), {
      message: "title produces an empty slug",
    });
  });

  it("a title of only non-ASCII letters produces the empty-slug error", () => {
    assert.throws(() => slugOnly("éèê"), {
      message: "title produces an empty slug",
    });
  });

  it("a whitespace-only title is non-empty but produces the empty-slug error", () => {
    assert.throws(() => slugOnly("   "), {
      message: "title produces an empty slug",
    });
  });
});

describe("makeBranchName — validation", () => {
  const throws = (args: unknown, message: string) =>
    assert.throws(() => makeBranchName(args), { message });

  it("title missing is an error naming title", () => {
    throws({}, "title is required");
    throws(null, "title is required");
    throws([], "title is required");
    throws({ type: "fix", issue_number: 1 }, "title is required");
  });

  it("title empty or non-string names title", () => {
    throws({ title: "" }, "title must be a non-empty string");
    throws({ title: 42 }, "title must be a non-empty string");
    throws({ title: null }, "title must be a non-empty string");
    throws({ title: ["x"] }, "title must be a non-empty string");
  });

  it("issue_number must be an integer >= 1 when present", () => {
    for (const bad of [0, -2, 1.5, "12", true, null]) {
      throws(
        { title: "Fix it", issue_number: bad, convention: "slug" },
        "issue_number must be an integer >= 1",
      );
    }
  });

  it("issue_number of 1 is valid", () => {
    const out = makeBranchName({ title: "Fix it", issue_number: 1, convention: "issue-slug" });
    assert.equal(out.branch, "1-fix-it");
  });

  it("type outside the enum names type, with the enum listed", () => {
    const message = 'type must be one of "feat", "fix", "chore", "docs", "refactor", "test"';
    throws({ title: "Fix it", type: "feature", convention: "slug" }, message);
    throws({ title: "Fix it", type: "FEAT", convention: "slug" }, message);
    throws({ title: "Fix it", type: 3, convention: "slug" }, message);
    throws({ title: "Fix it", type: null, convention: "slug" }, message);
  });

  it("convention outside the enum names convention, with the enum listed", () => {
    const message =
      'convention must be one of "type-issue-slug", "type-slug", "issue-slug", "slug"';
    throws({ title: "Fix it", convention: "issue-type-slug" }, message);
    throws({ title: "Fix it", convention: "SLUG" }, message);
    throws({ title: "Fix it", convention: 1 }, message);
    throws({ title: "Fix it", convention: null }, message);
  });

  it("max_slug_length must be an integer >= 8 when present", () => {
    for (const bad of [7, 0, -8, 8.5, "40", true, null]) {
      throws(
        { title: "Fix it", convention: "slug", max_slug_length: bad },
        "max_slug_length must be an integer >= 8",
      );
    }
  });

  it("unknown extra fields are ignored (pinned judgement call)", () => {
    const out = makeBranchName({
      title: "Fix it",
      convention: "slug",
      labels: ["bug"],
    });
    assert.equal(out.branch, "fix-it");
  });

  it("no partial result is produced on invalid input", () => {
    assert.throws(() =>
      makeBranchName({ title: "Fix it", type: "fix", issue_number: 0 }),
    );
  });
});
