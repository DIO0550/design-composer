import { screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { wheel } from "@/features/canvas/__tests__/canvas-gesture";
import {
  carryNode,
  dragNode,
  dragNodeOnto,
  drawn,
  injectedStyles,
  previewRule,
  renderCanvas,
} from "./setup";
import { drawnApart, setupSiblings } from "./snap-siblings";

test("兄弟の辺の近くまで運んで離すと、その辺が揃う座標が書かれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  // 左辺が `marker` の左辺の 3px 手前まで来る量。寄せが無ければ x は 153 になる
  dragNode("badge", { x: 113, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 150, y: 12 },
  });
});

test("親の縁の近くまで運んで離すと、縁に揃う座標が書かれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  // 左辺が `home` の左の縁を 4px 越えた位置。寄せが無ければ x は -4 になる
  dragNode("badge", { x: -44, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 0, y: 12 },
  });
});

test("運んでいるノード自身は揃える先にならない", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  /*
   * 自分を外し忘れると、自分の辺との距離が常に最小（＝運んだ量そのもの）になり、
   * 閾値の内側で運んでいる間は**どこへ運んでも寄せ量が打ち消して動かなくなる**。
   * そのとき届く座標は掴んだ時点の (40, 24) のままになる。
   */
  dragNode("badge", { x: 3, y: 4 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 43, y: 28 },
  });
});

test("どの辺からも遠ければ、運んだ量そのままの座標が書かれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  dragNode("badge", { x: 30, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 70, y: 12 },
  });
});

test("運んでいる間の見た目のずらし量も、吸い付いた行き先と一致する", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // 寄せを畳まずに渡すと、見た目だけが運んだ量そのまま（113）になって離した位置とずれる
  carryNode("badge", { x: 113, y: -12 });

  expect(injectedStyles()).toContain(previewRule("badge", { x: 110, y: -12 }));
});

test("倍率を上げても、画面上で同じだけ近づけば辺に吸い付く", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();
  wheel(screen.getByTestId("canvas-surface"), { x: 0, y: -100 }, "ctrl");

  /*
   * 1.2 倍で見ているとき、`badge` の左辺は画面上の 148 にいる。105 運ぶと 253 で、
   * `marker` の左辺（250）の 3px 手前 — 等倍のときと同じ画面上の距離で吸い付く。
   * 寄せた画面上の量 102 はドキュメント上では 85 になる。
   *
   * 実測は差し替えたまま（等倍のときの値）なので、実ブラウザなら `marker` は 280 に
   * 来るはずの配置になっている。ここで見たいのは閾値が倍率で変わらないことと、
   * 画面上とドキュメント上の変換を取り違えていないことなので、そこは揃えていない。
   */
  dragNode("badge", { x: 105, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 125, y: 14 },
  });
});

test("孫の辺は揃える先にならない", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  /*
   * 左辺が `card` の孫である `label` の左辺（260）の 3px 手前まで来る量。
   * 直下の子だけでなく孫まで集めると 160 へ吸い付く（docs/06-ui.md「孫は含めない」）。
   */
  dragNode("badge", { x: 123, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 163, y: 12 },
  });
});

test("別の artboard へ運んでも、その artboard の中の辺へ揃う", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  /*
   * 寄せの原点は**今の親**（`home`）で、書かれる座標だけが落とし先（`settings`）の
   * 基準へ直る。原点を落とし先にすり替えると、行き先の矩形が親の位置ぶん飛んで
   * `slot` の辺に届かなくなる（x が 63 になる）。
   */
  dragNodeOnto("badge", drawn("settings"), { x: 423, y: 30 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "settings",
    placement: { mode: "absolute", x: 60, y: 14 },
  });
});

test("運んでいるものの右辺が決め手のときは、実測した大きさのぶん左へ寄る", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  /*
   * 右辺が `card` の右辺（320）の 3px 先まで行く量。左辺（303）はどの辺からも遠いので、
   * 実測した幅（20）を通して初めて右辺が決め手になる。行き先の矩形に運んでいるものの
   * 大きさを使わないと、右辺がどこにも届かず 203 のままになる。
   */
  dragNode("badge", { x: 163, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 200, y: 12 },
  });
});
