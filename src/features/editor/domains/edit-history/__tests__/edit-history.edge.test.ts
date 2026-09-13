import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditHistory } from "../index";
import { documentOfWidth } from "./setup";

test("開いた直後は戻る先が無い", () => {
  const history = EditHistory.create(documentOfWidth(375));

  expect(Option.isSome(EditHistory.undo(history))).toBe(false);
});

test("開いた直後はやり直す先が無い", () => {
  const history = EditHistory.create(documentOfWidth(375));

  expect(Option.isSome(EditHistory.redo(history))).toBe(false);
});

test("戻れるところまで戻ったらそれ以上は戻れない", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );

  const undone = Option.unwrap(EditHistory.undo(edited));

  expect(Option.isSome(EditHistory.undo(undone))).toBe(false);
});

test("戻していないときはやり直せない", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );

  expect(Option.isSome(EditHistory.redo(edited))).toBe(false);
});

test("やり直しきったらそれ以上はやり直せない", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const undone = Option.unwrap(EditHistory.undo(edited));

  const redone = Option.unwrap(EditHistory.redo(undone));

  expect(Option.isSome(EditHistory.redo(redone))).toBe(false);
});
