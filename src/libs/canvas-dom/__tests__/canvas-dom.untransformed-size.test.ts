import { expect, test } from "vitest";
import { stubBounds, stubLayoutSize } from "@/libs/__tests__/element-measure";
import { Option } from "@/utils/Option";
import { CanvasDom } from "../index";

test("HTML の要素は、外接矩形ではなく変形を効かせる前のレイアウトの幅と高さで測れる", () => {
  const element = globalThis.document.createElement("div");
  stubBounds(element, { left: 10, top: 20, width: 150, height: 130 });
  stubLayoutSize(element, { width: 100, height: 60 });

  expect(CanvasDom.layoutSizeOf(element)).toEqual(
    Option.some({ width: 100, height: 60 }),
  );
});

test("HTML の要素でない SVG はレイアウトの大きさを測れない", () => {
  const element = globalThis.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );

  expect(CanvasDom.layoutSizeOf(element)).toEqual(Option.none);
});
