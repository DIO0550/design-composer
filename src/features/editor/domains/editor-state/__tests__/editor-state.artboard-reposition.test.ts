import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/** 座標を持たない artboard を 1 枚持つ状態（1.1 以前のファイルを開いた形）。 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [{ name: "badge", type: "Text" }],
        },
      ],
    }),
  );
}

/**
 * その状態での `home` のキャンバス上の位置。
 *
 * @param state 引き先の編集状態
 * @returns `home` の位置。持っていなければ `undefined`
 */
function homePosition(state: EditorState) {
  return Option.unwrap(
    DesignDocument.findArtboard(EditorState.document(state), "home"),
  ).canvasPosition;
}

test("座標を持たなかった artboard を置き直すと座標が付く", () => {
  const moved = Option.unwrap(
    EditorState.repositionArtboard(setupState(), "home", { x: 900, y: 300 }),
  );

  expect(homePosition(moved)).toEqual({ x: 900, y: 300 });
});

test("置き直したあと 1 回戻すと座標を持たない状態に戻る", () => {
  const moved = Option.unwrap(
    EditorState.repositionArtboard(setupState(), "home", { x: 900, y: 300 }),
  );

  const undone = Option.unwrap(EditorState.undo(moved));

  expect(homePosition(undone)).toBeUndefined();
});

test("置き直す前は戻せない（履歴が 1 件増えたことの裏返し）", () => {
  expect(EditorState.undo(setupState())).toEqual(Option.none);
});

test("ノードの名前を指すと置き直しは存在しない", () => {
  // キャンバス上の位置を持つのは artboard だけ（ノードの座標は親からの相対）
  expect(
    EditorState.repositionArtboard(setupState(), "badge", { x: 900, y: 300 }),
  ).toEqual(Option.none);
});

test("ドキュメントに無い名前を指すと置き直しは存在しない", () => {
  expect(
    EditorState.repositionArtboard(setupState(), "居ない", { x: 900, y: 300 }),
  ).toEqual(Option.none);
});
