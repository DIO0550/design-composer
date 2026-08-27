import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { injectedStyles, renderCanvas } from "./setup";

/**
 * 複数選んでいるときのキャンバス（docs/06-ui.md「選択」）。
 *
 * 枠は選んだぶんだけ出すが、リサイズハンドルは 1 つだけ選んでいるときにしか出さない。
 * artboard を 2 枚置くのは、まとめた選択が 1 枚に閉じないことを確かめるため
 * （ツリーは 1 枚しか映さないので、またいだぶんはキャンバスにしか出ない）。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "home-login", ref: "primary-button" }],
      },
      {
        name: "settings",
        width: 360,
        height: 240,
        children: [{ name: "settings-login", ref: "primary-button" }],
      },
    ],
  });
}

/**
 * 2 枚の artboard にまたがる 2 つのインスタンスを選んだ対。
 *
 * 名前を並べて作るのは、この 2 つが「同じ部品のインスタンス」であることを決めるのが
 * 編集画面側（まとめて選択）で、キャンバスは渡された名前の並びしか見ないため
 * （まとめ方そのものは `editor-state.instance-selection.test.ts` が固定している）。
 */
function setupMultiSelected(): DocumentSelection {
  return DocumentSelection.fromNames(setupDocument(), [
    "home-login",
    "settings-login",
  ]);
}

test("複数選んでいると選んだものすべてに枠が出る", () => {
  renderCanvas({ selection: setupMultiSelected() });

  const styles = injectedStyles();

  expect(styles).toContain('[data-name="home-login"]{outline:2px solid');
  expect(styles).toContain('[data-name="settings-login"]{outline:2px solid');
});

/*
 * リサイズハンドルは確かめない。まとめて選べるのはインスタンスだけで、
 * インスタンスにはもともとハンドルが出ない（`artboard-canvas.resize.test.tsx`
 * 「部品インスタンスを選んでもハンドルは描かれない」）。「複数選択では出ない」を
 * 書いても、実装をどう壊しても通るテストになる（rules/testing.md「その assert は
 * 落ちうるか」）。複数選択でリサイズが成立しないことは
 * `editor-state.multi-selection.test.ts` が `EditorState.resize` で見ている。
 */

test("1つだけ選んでいるとき、選んでいないものには枠が出ない", () => {
  renderCanvas({
    selection: DocumentSelection.fromNames(setupDocument(), ["home-login"]),
  });

  expect(injectedStyles()).not.toContain(
    '[data-name="settings-login"]{outline:2px solid',
  );
});
