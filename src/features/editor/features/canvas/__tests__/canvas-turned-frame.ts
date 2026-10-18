import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import {
  drawnAt,
  drawnTurnedAt,
} from "@/features/editor/features/canvas/__tests__/canvas-measure";

/*
 * 回った Box の中のノードを運ぶテストのドキュメントと描き方。キャンバス単体
 * （`artboard-canvas.drag-rotated-parent`）と編集画面の通し（`opened-document-editor`）が
 * 同じ値で確かめるので、持ち主のこの feature に置き、テスト用の公開口から出す。
 */

/** 運ぶノードの形。 */
export type TurnedFrameCarried = Readonly<{
  /** 運ぶノードを回っていない Box `inset` で包むか。 */
  nested?: boolean;
  /** 運ぶノード自身の向き（`rotation`。度）。 */
  rotation?: number;
}>;

/**
 * 運ぶノードの名前。
 *
 * @param carried 運ぶノードの形
 * @returns `nested` なら `dot`、そうでなければ `chip`
 */
function carriedNameOf(carried: TurnedFrameCarried): string {
  return (carried.nested ?? false) ? "dot" : "chip";
}

/**
 * `home` の直下に `rotation` だけ回った Box `frame` と絶対配置の `pin` があり、`frame` の
 * 中に絶対配置の `chip` と、寄せ先の兄弟 `peg` が並ぶドキュメント。
 *
 * `nested` なら `chip` の代わりに `dot` を置き、`frame` との間に回っていない Box `inset`
 * を挟む（`inset` は `frame` と同じ位置・大きさ）。
 *
 * @param rotation `frame` の向き（度）
 * @param carried 運ぶノードの形
 * @returns そのドキュメント（トークンと部品は雛形のまま）
 */
export function turnedFrameDocument(
  rotation: number,
  carried: TurnedFrameCarried = {},
): DesignDocument {
  const carriedNode = {
    name: carriedNameOf(carried),
    type: "Text",
    props: {
      content: "c",
      placement: "absolute",
      x: 10,
      y: 10,
      rotation: carried.rotation ?? 0,
    },
  };
  const peg = {
    name: "peg",
    type: "Text",
    props: { content: "p", placement: "absolute", x: 150, y: 60 },
  };
  const inset = {
    name: "inset",
    type: "Box",
    props: { placement: "absolute", x: 0, y: 0, width: 200, height: 100 },
    children: [carriedNode],
  };
  const frameChildren =
    (carried.nested ?? false) ? [inset, peg] : [carriedNode, peg];
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "frame",
            type: "Box",
            props: {
              placement: "absolute",
              x: 100,
              y: 50,
              width: 200,
              height: 100,
              rotation,
            },
            children: frameChildren,
          },
          {
            name: "pin",
            type: "Text",
            props: { content: "x", placement: "absolute", x: 20, y: 150 },
          },
        ],
      },
    ],
  });
}

/**
 * `turnedFrameDocument` と同じドキュメントで、運ぶノードを選んだ対。
 *
 * @param rotation `frame` の向き（度）
 * @param carried 運ぶノードの形
 * @returns そのドキュメントと、運ぶノード（`chip` か `dot`）だけを選んだ対
 */
export function turnedFrameSelection(
  rotation: number,
  carried: TurnedFrameCarried = {},
): DocumentSelection {
  return DocumentSelection.fromNames(turnedFrameDocument(rotation, carried), [
    carriedNameOf(carried),
  ]);
}

/**
 * `turnedFrameDocument(90)` を等倍で描く。
 *
 * `frame` は回る前の (200, 110) 200x100 を中心 (300, 160) のまま縦に立てた矩形。`chip`
 * （`nested` なら `dot`）は回る前の (210, 120) 20x12 の中心を `frame` の中心まわりに回した
 * (334, 80) に縦に立ち、`peg` も同じ規則で中心 (284, 220) に立つ。
 *
 * @param nested `turnedFrameDocument` の `nested` と同じ
 */
export function drawnTurnedFrame(nested = false): void {
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  const frameDrawn = { left: 250, top: 60, width: 100, height: 200 };
  drawnTurnedAt("frame", frameDrawn, { width: 200, height: 100 });
  if (nested) {
    drawnTurnedAt("inset", frameDrawn, { width: 200, height: 100 });
  }
  drawnTurnedAt(
    nested ? "dot" : "chip",
    { left: 328, top: 70, width: 12, height: 20 },
    { width: 20, height: 12 },
  );
  drawnTurnedAt(
    "peg",
    { left: 278, top: 210, width: 12, height: 20 },
    { width: 20, height: 12 },
  );
  drawnAt("pin", { left: 120, top: 210, width: 20, height: 12 });
}
