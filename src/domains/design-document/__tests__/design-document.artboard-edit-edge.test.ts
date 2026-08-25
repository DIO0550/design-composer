import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      Artboard.create({
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "home-title", type: "Text" }],
      }),
    ],
  });
}

/*
 * `remove` は artboard で無ければノードとして扱うので、どちらにも無い名前は
 * ノード側の失敗になる。kind まで見るのは、artboard 側の失敗
 * （`artboard-not-found`）と入れ替わっても `ok` だけでは気づけないため。
 */
test("どこにも無い名前を指すとノードが見つからない失敗になる", () => {
  const removed = DesignDocument.remove(setupDocument(), "居ない");

  expect(removed).toEqual({
    ok: false,
    error: { kind: "node-not-found", name: "居ない" },
  });
});
