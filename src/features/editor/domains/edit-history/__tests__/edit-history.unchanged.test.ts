import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditHistory } from "../index";
import { documentOfWidth } from "./setup";

/*
 * 中身の変わらない編集は、毎回 `documentOfWidth` で作り直した別の参照で積む。同じ参照を
 * 渡すと、中身ではなく参照を比べる実装でも通ってしまう。
 */

test("中身の変わらない編集を積んでも、1 回戻れば直前の編集の前へ戻る", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );

  const unchanged = EditHistory.record(edited, documentOfWidth(414));

  const undone = Option.unwrap(EditHistory.undo(unchanged));
  expect(undone.present).toEqual(documentOfWidth(375));
});

test("中身の変わらない 1 件目に続きが届いても、1 回戻ればまとまりの前へ戻る", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const unchanged = EditHistory.record(edited, documentOfWidth(414));

  const continued = EditHistory.amend(unchanged, documentOfWidth(768));

  // 1 件目を積まずに弾くと、続きが 414 を上書きして 375 まで戻ってしまう
  const undone = Option.unwrap(EditHistory.undo(continued));
  expect(undone.present).toEqual(documentOfWidth(414));
});

test("中身の変わらない編集のあとに別の編集を積んでも、2 回戻れば 2 つ前へ戻る", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const unchanged = EditHistory.record(edited, documentOfWidth(414));

  const separated = EditHistory.record(unchanged, documentOfWidth(768));

  const undone = Option.unwrap(EditHistory.undo(separated));
  const twice = Option.unwrap(EditHistory.undo(undone));
  expect([undone.present, twice.present]).toEqual([
    documentOfWidth(414),
    documentOfWidth(375),
  ]);
});

test("開いた直後に中身の変わらない編集を積んでも、戻る先は無い", () => {
  const opened = EditHistory.create(documentOfWidth(375));

  const unchanged = EditHistory.record(opened, documentOfWidth(375));

  expect(Option.isSome(EditHistory.undo(unchanged))).toBe(false);
});

test("続きで元の中身へ戻ったまとまりは、戻すときに飛ばされる", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const started = EditHistory.record(edited, documentOfWidth(768));

  const returned = EditHistory.amend(started, documentOfWidth(414));

  const undone = Option.unwrap(EditHistory.undo(returned));
  expect(undone.present).toEqual(documentOfWidth(375));
});

/*
 * `undo` の入口だけで 1 件落とす実装では落ちる。`record` の入口でも落としていることを守る。
 */
test("中身の変わらない編集を 2 回続けて積んでも、1 回戻れば直前の編集の前へ戻る", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );

  const unchangedTwice = EditHistory.record(
    EditHistory.record(edited, documentOfWidth(414)),
    documentOfWidth(414),
  );

  const undone = Option.unwrap(EditHistory.undo(unchangedTwice));
  expect(undone.present).toEqual(documentOfWidth(375));
});

test("中身の変わらない編集のあと戻してからやり直すと、1 回で戻す前の中身へ進み、それ以上は進めない", () => {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  const unchanged = EditHistory.record(edited, documentOfWidth(414));
  const undone = Option.unwrap(EditHistory.undo(unchanged));

  const redone = Option.unwrap(EditHistory.redo(undone));

  expect([redone.present, Option.isSome(EditHistory.redo(redone))]).toEqual([
    documentOfWidth(414),
    false,
  ]);
});
