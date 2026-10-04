import { act } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { PropEdit } from "@/domains/dcmp/node";
import {
  clearDrawn,
  drawNamed,
} from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { Option } from "@/utils/Option";
import { setup, TitleBounds } from "./setup";

afterEach(clearDrawn);

test("選択中の Text を指して始めると、今の文言が下書きになる", () => {
  drawNamed("title", TitleBounds);
  const { control } = setup();

  act(() => control().start(["title", "home"]));

  expect(Option.map(control().edit, (edit) => edit.draft)).toEqual(
    Option.some("ホーム"),
  );
});

test("始めた編集は、その Text が描かれている矩形に重なる", () => {
  drawNamed("title", TitleBounds);
  const { control } = setup();

  act(() => control().start(["title", "home"]));

  expect(Option.map(control().edit, (edit) => edit.bounds)).toEqual(
    Option.some(TitleBounds),
  );
});

test("書き換えると、下書きが入力した文言になる", () => {
  drawNamed("title", TitleBounds);
  const { control } = setup();

  act(() => control().start(["title", "home"]));
  act(() => control().change("トップ"));

  expect(Option.map(control().edit, (edit) => edit.draft)).toEqual(
    Option.some("トップ"),
  );
});

test("確定すると、下書きが content の編集として渡る", () => {
  drawNamed("title", TitleBounds);
  const { control, onEditProp } = setup();

  act(() => control().start(["title", "home"]));
  act(() => control().change("トップ"));
  act(() => control().commit());

  expect(onEditProp.mock.calls).toEqual([
    [PropEdit.set(["content"], "トップ")],
  ]);
});

test("確定すると編集が終わる", () => {
  drawNamed("title", TitleBounds);
  const { control } = setup();

  act(() => control().start(["title", "home"]));
  act(() => control().commit());

  expect(control().edit).toEqual(Option.none);
});

test("取り消すと編集が終わる", () => {
  drawNamed("title", TitleBounds);
  const { control } = setup();

  act(() => control().start(["title", "home"]));
  act(() => control().cancel());

  expect(control().edit).toEqual(Option.none);
});

test("書き換えてから取り消すと、編集はどこへも渡らない", () => {
  drawNamed("title", TitleBounds);
  const { control, onEditProp } = setup();

  act(() => control().start(["title", "home"]));
  act(() => control().change("トップ"));
  act(() => control().cancel());

  expect(onEditProp).not.toHaveBeenCalled();
});
