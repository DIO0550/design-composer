import { afterEach, expect, test } from "vitest";
import {
  clearElementsAt,
  stubElementsAt,
} from "@/libs/__tests__/elements-at-point";
import { Option } from "@/utils/Option";
import { CanvasDom } from "../index";

afterEach(clearElementsAt);

test("重ねた器（overlay）の中のものを飛ばし、器の外でいちばん手前の要素を返す", () => {
  const overlay = globalThis.document.createElement("div");
  const handle = globalThis.document.createElement("div");
  overlay.append(handle);
  const node = globalThis.document.createElement("div");
  const surface = globalThis.document.createElement("div");
  const at = { x: 10, y: 20 };
  stubElementsAt({ at, stack: [handle, overlay, node, surface] });

  const beneath = CanvasDom.elementBeneath(overlay, at);

  expect(Option.contains(beneath, node)).toBe(true);
});

test("その点で器の外に何も無ければ none を返す", () => {
  const overlay = globalThis.document.createElement("div");
  const handle = globalThis.document.createElement("div");
  overlay.append(handle);
  const at = { x: 10, y: 20 };
  stubElementsAt({ at, stack: [handle, overlay] });

  const beneath = CanvasDom.elementBeneath(overlay, at);

  expect(Option.isSome(beneath)).toBe(false);
});
