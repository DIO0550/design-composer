import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { PropDefinitionRecord } from "../index";

const Schema: PropDefinitionRecord = {
  background: { domain: "token", tokenKind: "colors", group: "appearance" },
};

test("constructor という prop は、スキーマに無い prop として報告される", () => {
  const errors = PropDefinitionRecord.collectErrors(
    Schema,
    { constructor: "x" },
    TokenSet.empty(),
  );

  expect(errors).toContainEqual(
    expect.objectContaining({ kind: "unknown-prop", prop: "constructor" }),
  );
});

test("定義していない constructor という色への参照は、dangling-token として報告される", () => {
  const errors = PropDefinitionRecord.collectErrors(
    Schema,
    { background: "constructor" },
    TokenSet.empty(),
  );

  expect(errors).toContainEqual(
    expect.objectContaining({ kind: "dangling-token", prop: "background" }),
  );
});
