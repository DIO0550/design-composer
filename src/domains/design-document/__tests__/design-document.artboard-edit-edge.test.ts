import { expect, test } from "vitest";
import { DesignDocument } from "../index";
import { documentWithOneArtboard } from "./artboard-edit-setup";

/*
 * `remove` は artboard で無ければノードとして扱うので、どちらにも無い名前は
 * ノード側の失敗になる。kind まで見るのは、artboard 側の失敗
 * （`artboard-not-found`）と入れ替わっても `ok` だけでは気づけないため。
 */
test("どこにも無い名前を指すとノードが見つからない失敗になる", () => {
  const removed = DesignDocument.remove(documentWithOneArtboard(), "居ない");

  expect(removed).toEqual({
    ok: false,
    error: { kind: "node-not-found", name: "居ない" },
  });
});
