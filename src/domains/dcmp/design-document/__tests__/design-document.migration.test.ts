import { expect, test } from "vitest";
import { DesignDocument } from "../index";

/**
 * major がアプリと食い違うドキュメントは型として作れなくなったため
 * （`DesignDocumentV1` の major は 1 に固定）、ここで確かめられるのは minor の差だけ。
 * major の食い違いの判定自体は `format-version.edge.test.ts` が担当する。
 */

test("現在の版のドキュメントは compatible と判定される", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 1, minor: 0 },
  });

  expect(DesignDocument.compatibility(document)).toBe("compatible");
});

test("アプリより新しい minor を名乗るドキュメントは unsupported と判定される", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 1, minor: 9 },
  });

  expect(DesignDocument.compatibility(document)).toBe("unsupported");
});
