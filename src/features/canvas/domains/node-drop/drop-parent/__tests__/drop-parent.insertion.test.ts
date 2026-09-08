import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { InsertionParent } from "../index";
import {
  moving,
  placingBox,
  setupDocument,
  setupFreeArtboardDocument,
} from "./setup";

test("layout を指定していない Box は縦に子が並ぶものとして扱われる", () => {
  const parent = InsertionParent.innermost(setupDocument(), moving("moved"), [
    "body",
  ]);

  expect(Option.unwrap(parent).direction).toBe("column");
});

test("layout が row の Box は横に子が並ぶものとして扱われる", () => {
  const parent = InsertionParent.innermost(setupDocument(), moving("moved"), [
    "row",
  ]);

  expect(Option.unwrap(parent).direction).toBe("row");
});

test("子を並べない Box は並びへ挿す先にならず外側の親が選ばれる", () => {
  const parent = InsertionParent.innermost(setupDocument(), moving("moved"), [
    "free",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("子を並べない artboard は並びへ挿す先にならない", () => {
  const parent = InsertionParent.innermost(
    setupFreeArtboardDocument(),
    moving("moved"),
    ["home"],
  );

  expect(parent.some).toBe(false);
});

/*
 * 次の2件は座標の受け入れ先（`drop-parent.reposition`）にも同じ観点があるが、
 * 受け入れられない候補を外す走査を共有するのをやめても挿入経路が無防備にならないよう、
 * こちら側にも置く。この2つだけ重ねるのは、外さないと実害が出るのがこの2つだから
 * （子を持てない親への挿入・自分の子孫への移動）。
 */

test("子を持てない Text の上へ運ぶと外側の Box が挿す先になる", () => {
  const parent = InsertionParent.innermost(setupDocument(), moving("moved"), [
    "title",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("運んでいるノードの子孫は並びへ挿す先にならない", () => {
  // 外さないと `EditorState.moveNode` が `move-into-descendant` で落ち、離しても何も起きない
  const parent = InsertionParent.innermost(setupDocument(), moving("body"), [
    "card",
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("雛形を運んでいるときは、最も内側の Box が挿す先になる", () => {
  const parent = InsertionParent.innermost(setupDocument(), placingBox, [
    "card",
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("card");
});

test("雛形を運んでいるときは、木のどのノードも候補から外れない", () => {
  // 既存ノードなら自分自身は外れる（`drop-parent.reposition` の「運んでいるノード自身」）。
  // 雛形は何も占めていないので、同じ `body` がそのまま挿す先になる
  const parent = InsertionParent.innermost(setupDocument(), placingBox, [
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("body");
});

test("ドキュメントに無いノードを運んでいるときは挿す先が決まらない", () => {
  const parent = InsertionParent.innermost(setupDocument(), moving("unknown"), [
    "home",
  ]);

  expect(parent.some).toBe(false);
});
