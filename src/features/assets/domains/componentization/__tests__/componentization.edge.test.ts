import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { Componentization } from "../index";

/**
 * スキーマに無い `type` のノードが残っているドキュメント。
 * 不正なドキュメントも画面には残る（docs/03-schema.md「不正ファイル時の挙動」）ので、
 * この状態のノードも選択されうる。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "home-unknown", type: "Unknown" }],
      },
    ],
  });
}

test("スキーマに無い型のノードを選んでいてもそれを元に部品を作れる", () => {
  expect(
    Componentization.forSelection(setupDocument(), Option.some("home-unknown")),
  ).toEqual({
    kind: "ready",
    sourceName: "home-unknown",
  });
});

/*
 * 対照として、同じドキュメントに実在する artboard（`home`）が `artboard` を返すことを
 * 隣のテストで固定してある（componentization.normal）。両方を見ることで、
 * 「ノードで無ければ artboard」と決め打つ実装でも、artboard の判定を丸ごと消した実装でも落ちる。
 */
test("ドキュメントに無い名前を指していると何も選んでいない扱いになる", () => {
  expect(
    Componentization.forSelection(setupDocument(), Option.some("home-removed")),
  ).toEqual({ kind: "unselected" });
});
