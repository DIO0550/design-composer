import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/** artboard を 2 枚持つドキュメント。片方だけを動かしたことを見るため。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "badge", type: "Box", children: [] }],
      },
      { name: "settings", width: 360, height: 240, children: [] },
    ],
  });
}

/**
 * 置き直したあとの artboard を名前で引く。
 *
 * @param name 引く artboard の名前
 * @param document 引き先のドキュメント
 * @returns その artboard のキャンバス上の位置
 */
function canvasPositionOf(name: string, document: DesignDocument) {
  return Option.unwrap(DesignDocument.findArtboard(document, name))
    .canvasPosition;
}

test("artboard の名前を指すとキャンバス上の位置が書き換わる", () => {
  const moved = Result.unwrap(
    DesignDocument.repositionArtboard(setupDocument(), "home", {
      x: 900,
      y: 300,
    }),
  );

  expect(canvasPositionOf("home", moved)).toEqual({ x: 900, y: 300 });
});

test("1 枚を置き直しても他の artboard の位置は変わらない", () => {
  const moved = Result.unwrap(
    DesignDocument.repositionArtboard(setupDocument(), "home", {
      x: 900,
      y: 300,
    }),
  );

  expect(canvasPositionOf("settings", moved)).toBeUndefined();
});

test("ノードの名前を指すと node-not-found エラーになる", () => {
  // キャンバス上の位置を持つのは artboard だけ（ノードの座標は親からの相対）
  expect(
    DesignDocument.repositionArtboard(setupDocument(), "badge", {
      x: 900,
      y: 300,
    }),
  ).toEqual({ ok: false, error: { kind: "node-not-found", name: "badge" } });
});

test("存在しない名前を指すと node-not-found エラーになる", () => {
  expect(
    DesignDocument.repositionArtboard(setupDocument(), "居ない", {
      x: 900,
      y: 300,
    }),
  ).toEqual({ ok: false, error: { kind: "node-not-found", name: "居ない" } });
});
