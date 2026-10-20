import { afterEach, expect, test } from "vitest";
import {
  clearElementsAt,
  stubElementsAt,
} from "@/libs/__tests__/elements-at-point";
import { Option } from "@/utils/Option";
import { CanvasDom } from "../index";

afterEach(clearElementsAt);

test("重ねた層の中のものを飛ばし、層の外でいちばん手前の要素を返す", () => {
  const layer = globalThis.document.createElement("div");
  const handle = globalThis.document.createElement("div");
  layer.append(handle);
  const node = globalThis.document.createElement("div");
  const surface = globalThis.document.createElement("div");
  stubElementsAt([handle, layer, node, surface]);

  const beneath = CanvasDom.elementBeneath(layer, { x: 10, y: 20 });

  expect(Option.contains(beneath, node)).toBe(true);
});

test("その点で層の外に何も無ければ none を返す", () => {
  const layer = globalThis.document.createElement("div");
  const handle = globalThis.document.createElement("div");
  layer.append(handle);
  stubElementsAt([handle, layer]);

  const beneath = CanvasDom.elementBeneath(layer, { x: 10, y: 20 });

  expect(Option.isSome(beneath)).toBe(false);
});
