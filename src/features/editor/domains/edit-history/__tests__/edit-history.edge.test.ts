import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditHistory } from "../index";

function documentNamed(name: string): DesignDocument {
  return DesignDocument.create({
    artboards: [{ name, width: 375, height: 812, children: [] }],
  });
}

test("編集していない履歴は戻せない", () => {
  const history = EditHistory.create(documentNamed("first"));

  expect(EditHistory.undo(history)).toEqual(Option.none);
});

test("編集していない履歴はやり直せない", () => {
  const history = EditHistory.create(documentNamed("first"));

  expect(EditHistory.redo(history)).toEqual(Option.none);
});

test("戻せるところまで戻したらそれ以上は戻せない", () => {
  const history = EditHistory.record(
    EditHistory.create(documentNamed("first")),
    documentNamed("second"),
  );
  const undone = Option.unwrap(EditHistory.undo(history));

  expect(EditHistory.undo(undone)).toEqual(Option.none);
});

test("やり直せるところまで進めたらそれ以上はやり直せない", () => {
  const history = EditHistory.record(
    EditHistory.create(documentNamed("first")),
    documentNamed("second"),
  );
  const redone = Option.unwrap(
    Option.flatMap(EditHistory.undo(history), EditHistory.redo),
  );

  expect(EditHistory.redo(redone)).toEqual(Option.none);
});
