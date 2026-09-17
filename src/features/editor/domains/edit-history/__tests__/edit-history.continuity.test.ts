import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditHistory } from "../index";
import { documentOfWidth } from "./setup";

test("続きとして記録すると、戻る先は増えずに現在地だけが変わる", () => {
  const recorded = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );

  const amended = EditHistory.amend(recorded, documentOfWidth(768));

  const undone = Option.unwrap(EditHistory.undo(amended));
  expect([amended.present, undone.present]).toEqual([
    documentOfWidth(768),
    documentOfWidth(375),
  ]);
});

test("続きを重ねても、1 回戻ればまとまりの前へ戻る", () => {
  const recorded = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const amended = EditHistory.amend(
    EditHistory.amend(recorded, documentOfWidth(768)),
    documentOfWidth(1024),
  );

  const undone = Option.unwrap(EditHistory.undo(amended));

  expect(undone.present).toEqual(documentOfWidth(375));
});

test("続きのあとに別のまとまりを記録すると、戻る先が 1 つ増える", () => {
  const recorded = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const amended = EditHistory.amend(recorded, documentOfWidth(768));

  const separated = EditHistory.record(amended, documentOfWidth(1024));

  const undone = Option.unwrap(EditHistory.undo(separated));
  const twice = Option.unwrap(EditHistory.undo(undone));
  expect([undone.present, twice.present]).toEqual([
    documentOfWidth(768),
    documentOfWidth(375),
  ]);
});

test("戻したあとに続きとして記録すると、やり直す先は無くなる", () => {
  // 進む先がある状態から始める。`future` が空だと、捨てない実装でも空のままで通る
  const recorded = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const undone = Option.unwrap(EditHistory.undo(recorded));

  const amended = EditHistory.amend(undone, documentOfWidth(768));

  expect(Option.isSome(EditHistory.redo(amended))).toBe(false);
});

test("戻る先が無いまま続きとして記録すると、それまでの現在地へは戻れない", () => {
  const opened = EditHistory.create(documentOfWidth(375));

  const amended = EditHistory.amend(opened, documentOfWidth(414));

  expect([amended.present, Option.isSome(EditHistory.undo(amended))]).toEqual([
    documentOfWidth(414),
    false,
  ]);
});
