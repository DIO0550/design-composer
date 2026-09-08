import { DesignDocument } from "@/domains/dcmp/design-document";
import type { DraggedNode } from "@/features/canvas/domains/node-drop";

/**
 * 木にある既存ノードを運んでいる状態。
 *
 * @param name 運んでいるノードの名前
 * @returns その名前のノードを運んでいる状態
 */
export function moving(name: string): DraggedNode {
  return { kind: "existing", name };
}

/** パレットの雛形を運んでいる状態。まだ木に無いので何も占めていない。 */
export const placingBox: DraggedNode = {
  kind: "new",
  template: { kind: "primitive", type: "Box" },
};

/**
 * `home` の下に、子を持てる `body`（縦積み）と `row`（横並び）、子を並べない `free`、
 * 子を持てない `title`、部品インスタンスの `login` が並ぶドキュメント。
 *
 * @returns その並びを持つドキュメント
 */
export function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      "primary-button": {
        type: "Box",
        children: [{ name: "label", type: "Text" }],
      },
    },
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          {
            name: "body",
            type: "Box",
            children: [{ name: "card", type: "Box", children: [] }],
          },
          {
            name: "row",
            type: "Box",
            props: { layout: "row" },
            children: [],
          },
          {
            name: "free",
            type: "Box",
            props: { layout: "free" },
            children: [],
          },
          { name: "login", ref: "primary-button" },
          { name: "moved", type: "Text" },
        ],
      },
    ],
  });
}

/**
 * 子を並べない artboard 1 枚だけのドキュメント。
 * 外側にもう親が無いので、`free` の器がそのまま落とし先になるかを見られる。
 *
 * @returns `layout: free` の `home` に `moved` が 1 つ入ったドキュメント
 */
export function setupFreeArtboardDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        props: { layout: "free" },
        children: [{ name: "moved", type: "Text" }],
      },
    ],
  });
}
