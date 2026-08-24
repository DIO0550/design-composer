import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditHistory } from "../index";
import { documentOfWidth } from "./setup";

test("開いた直後は戻る先が無い", () => {
  const history = EditHistory.create(documentOfWidth(375));

  expect(EditHistory.undo(history).some).toBe(false);
});

test("開いた直後はやり直す先が無い", () => {
  const history = EditHistory.create(documentOfWidth(375));

  expect(EditHistory.redo(history).some).toBe(false);
});

test("戻れるところまで戻ったらそれ以上は戻れない", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );

  const undone = Option.unwrap(EditHistory.undo(edited));

  expect(EditHistory.undo(undone).some).toBe(false);
});

test("戻していないときはやり直せない", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );

  expect(EditHistory.redo(edited).some).toBe(false);
});

test("やり直しきったらそれ以上はやり直せない", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const undone = Option.unwrap(EditHistory.undo(edited));

  const redone = Option.unwrap(EditHistory.redo(undone));

  expect(EditHistory.redo(redone).some).toBe(false);
});
