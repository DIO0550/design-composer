import { act } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import {
  clearDrawn,
  drawNamed,
} from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { Option } from "@/utils/Option";
import { setup, TitleBounds } from "./setup";

afterEach(clearDrawn);

test("選択中の Text から外れた位置を指しても編集は始まらない", () => {
  drawNamed("title", TitleBounds);
  const { control } = setup();

  act(() => control().start(["card", "home"]));

  expect(control().edit).toEqual(Option.none);
});

test("選択中の Text がまだ描かれていなければ編集は始まらない", () => {
  const { control } = setup();

  act(() => control().start(["title", "home"]));

  expect(control().edit).toEqual(Option.none);
});

test("編集していないときに確定しても、何も渡らない", () => {
  const { control, onEditProp } = setup();

  act(() => control().commit());

  expect(onEditProp).not.toHaveBeenCalled();
});
