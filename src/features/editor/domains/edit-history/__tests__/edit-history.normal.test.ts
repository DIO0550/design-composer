import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditHistory } from "../index";
import { documentOfWidth } from "./setup";

test("編集を積むと積んだドキュメントが現在地になる", () => {
  const history = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );

  expect(history.present).toEqual(documentOfWidth(414));
});

test("編集を積んだあとに戻すと 1 つ前のドキュメントが現在地になる", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );

  const undone = Option.unwrap(EditHistory.undo(edited));

  expect(undone.present).toEqual(documentOfWidth(375));
});

test("2 回編集して 2 回戻すと最初のドキュメントに戻る", () => {
  const twice = EditHistory.record(
    EditHistory.record(
      EditHistory.create(documentOfWidth(375)),
      documentOfWidth(414),
    ),
    documentOfWidth(768),
  );

  const undone = Option.unwrap(
    EditHistory.undo(Option.unwrap(EditHistory.undo(twice))),
  );

  expect(undone.present).toEqual(documentOfWidth(375));
});

test("戻したあとにやり直すと戻す前のドキュメントに戻る", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const undone = Option.unwrap(EditHistory.undo(edited));

  const redone = Option.unwrap(EditHistory.redo(undone));

  expect(redone.present).toEqual(documentOfWidth(414));
});

test("戻したあとに別の編集をするとやり直す先は無くなる", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const undone = Option.unwrap(EditHistory.undo(edited));

  const branched = EditHistory.record(undone, documentOfWidth(768));

  expect(EditHistory.redo(branched).some).toBe(false);
});

test("戻したあと別の編集をしても、その 1 つ前へは戻れる", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const undone = Option.unwrap(EditHistory.undo(edited));
  const branched = EditHistory.record(undone, documentOfWidth(768));

  const undoneAgain = Option.unwrap(EditHistory.undo(branched));

  expect(undoneAgain.present).toEqual(documentOfWidth(375));
});
