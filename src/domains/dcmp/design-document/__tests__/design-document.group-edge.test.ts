import { expect, test } from "vitest";
import { DocumentTemplate } from "@/domains/dcmp/design-document";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/*
 * グループ化・グループ解除が成立しない相手（docs/06-ui.md「編集操作の一覧」）。
 * 失敗の理由まで見るのは、「対象が無い」と「子を持てない」で呼び出し側の扱いが分かれるため。
 */

/**
 * `screen` に Text の `title`、子を持つ Box の `panel`、部品インスタンスの `login` が並ぶ
 * ドキュメント。
 *
 * @returns そのドキュメント
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          {
            name: "panel",
            type: "Box",
            children: [{ name: "panel-label", type: "Text" }],
          },
          { name: "login", ref: "primary-button" },
        ],
      },
    ],
  });
}

test("ドキュメントに無い名前は包めない", () => {
  expect(
    DesignDocument.groupIntoBox(setupDocument(), "missing", "box"),
  ).toStrictEqual(Result.err({ kind: "node-not-found", name: "missing" }));
});

test("artboard は包めない", () => {
  expect(
    DesignDocument.groupIntoBox(setupDocument(), "screen", "box"),
  ).toStrictEqual(Result.err({ kind: "node-not-found", name: "screen" }));
});

test("既に使われている名前の Box では包めない", () => {
  expect(
    DesignDocument.groupIntoBox(setupDocument(), "title", "panel"),
  ).toStrictEqual(Result.err({ kind: "duplicate-name", name: "panel" }));
});

test("識別子の規則を満たさない名前の Box では包めない", () => {
  expect(
    DesignDocument.groupIntoBox(setupDocument(), "title", "Box 1"),
  ).toStrictEqual(Result.err({ kind: "invalid-name", name: "Box 1" }));
});

test("ドキュメントに無い名前は外せない", () => {
  expect(DesignDocument.ungroupBox(setupDocument(), "missing")).toStrictEqual(
    Result.err({ kind: "node-not-found", name: "missing" }),
  );
});

test("artboard は外せない", () => {
  expect(DesignDocument.ungroupBox(setupDocument(), "screen")).toStrictEqual(
    Result.err({ kind: "node-not-found", name: "screen" }),
  );
});

test("Text は外せない", () => {
  expect(DesignDocument.ungroupBox(setupDocument(), "title")).toStrictEqual(
    Result.err({ kind: "children-not-allowed", name: "title" }),
  );
});

test("部品インスタンスは外せない", () => {
  expect(DesignDocument.ungroupBox(setupDocument(), "login")).toStrictEqual(
    Result.err({ kind: "children-not-allowed", name: "login" }),
  );
});
