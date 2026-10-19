import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { SideSnap } from "@/features/editor/features/canvas/domains/side-snap";
import { Option } from "@/utils/Option";
import { NodeResize } from "../index";
import { grabbedAt, grabbedWithSnap, setupResizable, setupView } from "./setup";

/*
 * 掴んだ辺が揃ったときのガイド線（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
 * 掴む要素は `setupBounds` の矩形（左 100 / 右 300 / 上 50 / 下 150）に描かれている。
 */

/** 右辺が 340 にある、幅 300 の揃え先（上下の辺は 400 / 420 で遠い）。 */
const RightAt340: CanvasBounds = { left: 40, top: 400, width: 300, height: 20 };

test("右辺を掴んで揃え先の右辺の近くまで運ぶと、揃え先の右辺に縦のガイド線が出る", () => {
  const resize = grabbedWithSnap({ x: 1, y: 0.5 }, { x: 300, y: 100 }, [
    RightAt340,
  ]);

  const tracked = NodeResize.trackedAt(resize, { x: 337, y: 100 }, setupView());

  expect(
    Option.flatMap(tracked, ({ guides }) =>
      Option.map(guides.horizontal, (guide) => ({
        left: guide.guideLine.left,
        width: guide.guideLine.width,
      })),
    ),
  ).toEqual(Option.some({ left: 339, width: 2 }));
});

test("左辺を掴んで揃え先の左辺の近くまで運ぶと、揃え先の左辺に縦のガイド線が出る", () => {
  // 左辺が 130 にある揃え先（右辺は 630 で遠い）
  const leftAt130: CanvasBounds = {
    left: 130,
    top: 400,
    width: 500,
    height: 20,
  };
  const resize = grabbedWithSnap({ x: 0, y: 0.5 }, { x: 100, y: 100 }, [
    leftAt130,
  ]);

  const tracked = NodeResize.trackedAt(resize, { x: 133, y: 100 }, setupView());

  expect(
    Option.flatMap(tracked, ({ guides }) =>
      Option.map(guides.horizontal, (guide) => ({
        left: guide.guideLine.left,
        width: guide.guideLine.width,
      })),
    ),
  ).toEqual(Option.some({ left: 129, width: 2 }));
});

test("右辺を掴んだままポインタが縦にもずれても、ガイド線は描かれている上辺・下辺と揃え先をまたぐ", () => {
  const resize = grabbedWithSnap({ x: 1, y: 0.5 }, { x: 300, y: 100 }, [
    RightAt340,
  ]);

  // 縦に 30 ずれても幅しか変わらないので、上辺 50 から揃え先の下辺 420 まで
  const tracked = NodeResize.trackedAt(resize, { x: 337, y: 130 }, setupView());

  expect(
    Option.flatMap(tracked, ({ guides }) =>
      Option.map(guides.horizontal, (guide) => ({
        top: guide.guideLine.top,
        height: guide.guideLine.height,
      })),
    ),
  ).toEqual(Option.some({ top: 50, height: 370 }));
});

test("揃え先の辺の近くまで運んでいなければ、ガイド線は出ない", () => {
  const resize = grabbedWithSnap({ x: 1, y: 0.5 }, { x: 300, y: 100 }, [
    RightAt340,
  ]);

  // 右辺は 320 で、揃え先の右辺 340 から 20 離れている
  const tracked = NodeResize.trackedAt(resize, { x: 320, y: 100 }, setupView());

  expect(Option.map(tracked, ({ guides }) => guides)).toEqual(
    Option.some(SideSnap.NoGuides),
  );
});

test("辺のスナップの組を載せていない掴みでは、揃え先の近くでもガイド線は出ない", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
  );

  const tracked = NodeResize.trackedAt(resize, { x: 337, y: 100 }, setupView());

  expect(Option.map(tracked, ({ guides }) => guides)).toEqual(
    Option.some(SideSnap.NoGuides),
  );
});

test("揃え先を外した掴みでは、揃え先の近くまで運んでもガイド線は出ない", () => {
  const resize = NodeResize.withoutSnapTargets(
    grabbedWithSnap({ x: 1, y: 0.5 }, { x: 300, y: 100 }, [RightAt340]),
  );

  const tracked = NodeResize.trackedAt(resize, { x: 337, y: 100 }, setupView());

  expect(Option.map(tracked, ({ guides }) => guides)).toEqual(
    Option.some(SideSnap.NoGuides),
  );
});

test("右下の角を掴んで幅と高さの両方が揃うと、縦と横のガイド線が 1 本ずつ出る", () => {
  // 下辺が 180 にある揃え先（左右の辺は 600 / 640 で遠い）
  const bottomAt180: CanvasBounds = {
    left: 600,
    top: 80,
    width: 40,
    height: 100,
  };
  const resize = grabbedWithSnap({ x: 1, y: 1 }, { x: 300, y: 150 }, [
    RightAt340,
    bottomAt180,
  ]);

  const tracked = NodeResize.trackedAt(resize, { x: 337, y: 176 }, setupView());

  expect(
    Option.map(tracked, ({ guides }) => ({
      horizontal: Option.isSome(guides.horizontal),
      vertical: Option.isSome(guides.vertical),
    })),
  ).toEqual(Option.some({ horizontal: true, vertical: true }));
});

test("掴んでいる状態に載せた揃った線が、今出すガイド線として返る", () => {
  const resize = grabbedWithSnap({ x: 1, y: 0.5 }, { x: 300, y: 100 }, [
    RightAt340,
  ]);
  const tracked = Option.unwrap(
    NodeResize.trackedAt(resize, { x: 337, y: 100 }, setupView()),
  );

  expect(
    NodeResize.snapGuides(NodeResize.withSnapGuides(resize, tracked.guides)),
  ).toEqual(tracked.guides);
});
