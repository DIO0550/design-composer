import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditHistory } from "../index";

/** artboard 1 枚だけのドキュメント。`name` で世代を見分ける。 */
function documentNamed(name: string): DesignDocument {
  return DesignDocument.create({
    artboards: [{ name, width: 375, height: 812, children: [] }],
  });
}

function artboardNames(history: EditHistory): readonly string[] {
  return history.present.artboards.map((artboard) => artboard.name);
}

test("編集を積むと積んだドキュメントが今のドキュメントになる", () => {
  const history = EditHistory.create(documentNamed("first"));

  const recorded = EditHistory.record(history, documentNamed("second"));

  expect(artboardNames(recorded)).toEqual(["second"]);
});

test("編集を積んでから戻すと積む前のドキュメントに戻る", () => {
  const history = EditHistory.record(
    EditHistory.create(documentNamed("first")),
    documentNamed("second"),
  );

  const undone = Option.unwrap(EditHistory.undo(history));

  expect(artboardNames(undone)).toEqual(["first"]);
});

test("戻したあとにやり直すと戻す前のドキュメントに進む", () => {
  const history = EditHistory.record(
    EditHistory.create(documentNamed("first")),
    documentNamed("second"),
  );
  const undone = Option.unwrap(EditHistory.undo(history));

  const redone = Option.unwrap(EditHistory.redo(undone));

  expect(artboardNames(redone)).toEqual(["second"]);
});

test("複数の編集は積んだ順と逆に戻る", () => {
  const history = EditHistory.record(
    EditHistory.record(
      EditHistory.create(documentNamed("first")),
      documentNamed("second"),
    ),
    documentNamed("third"),
  );

  const twiceUndone = Option.unwrap(
    Option.flatMap(EditHistory.undo(history), EditHistory.undo),
  );

  expect(artboardNames(twiceUndone)).toEqual(["first"]);
});

test("戻したあとに別の編集をするとやり直す先は無くなる", () => {
  const history = EditHistory.record(
    EditHistory.create(documentNamed("first")),
    documentNamed("second"),
  );
  const undone = Option.unwrap(EditHistory.undo(history));

  const branched = EditHistory.record(undone, documentNamed("another"));

  expect(EditHistory.redo(branched)).toEqual(Option.none);
});

test("戻したあとに別の編集をしても戻る先は残る", () => {
  const history = EditHistory.record(
    EditHistory.create(documentNamed("first")),
    documentNamed("second"),
  );
  const undone = Option.unwrap(EditHistory.undo(history));

  const branched = EditHistory.record(undone, documentNamed("another"));

  expect(artboardNames(Option.unwrap(EditHistory.undo(branched)))).toEqual([
    "first",
  ]);
});
