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

  // 中身の変わらない 1 件目を `record` が積まずに弾く実装を落とす（理由は `EditHistory.record` の doc）
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

/**
 * 1 回編集してから戻した履歴。現在地が編集前（幅 375）で、進む先に編集後（幅 414）がある。
 *
 * @returns 幅 375 を現在地にし、幅 414 を進む先に持つ履歴
 */
function undoneOnce(): EditHistory {
  const edited = EditHistory.record(
    EditHistory.create(documentOfWidth(375)),
    documentOfWidth(414),
  );
  return Option.unwrap(EditHistory.undo(edited));
}

test("戻したあとに中身の変わらない編集を積んでも、やり直せば戻す前の中身へ進む", () => {
  const unchanged = EditHistory.record(undoneOnce(), documentOfWidth(375));

  const redone = Option.unwrap(EditHistory.redo(unchanged));
  expect(redone.present).toEqual(documentOfWidth(414));
});

test("戻したあとに中身の変わらない編集を 2 回続けて積んでも、やり直せば戻す前の中身へ進む", () => {
  const unchangedTwice = EditHistory.record(
    EditHistory.record(undoneOnce(), documentOfWidth(375)),
    documentOfWidth(375),
  );

  const redone = Option.unwrap(EditHistory.redo(unchangedTwice));
  expect(redone.present).toEqual(documentOfWidth(414));
});

test("戻したあと、中身の変わらない 1 件目に中身の変わる続きが届くと、やり直せない", () => {
  const unchanged = EditHistory.record(undoneOnce(), documentOfWidth(375));

  const continued = EditHistory.amend(unchanged, documentOfWidth(768));

  expect(Option.isSome(EditHistory.redo(continued))).toBe(false);
});

test("戻したあと、中身の変わらない 1 件目に中身の変わらない続きが届いても、やり直せる", () => {
  const unchanged = EditHistory.record(undoneOnce(), documentOfWidth(375));

  const continued = EditHistory.amend(unchanged, documentOfWidth(375));

  const redone = Option.unwrap(EditHistory.redo(continued));
  expect(redone.present).toEqual(documentOfWidth(414));
});

test("戻したあと、続きで一度中身が変わってから元の中身へ戻っても、やり直せない", () => {
  const unchanged = EditHistory.record(undoneOnce(), documentOfWidth(375));
  const changed = EditHistory.amend(unchanged, documentOfWidth(768));

  const returned = EditHistory.amend(changed, documentOfWidth(375));

  expect(Option.isSome(EditHistory.redo(returned))).toBe(false);
});

test("戻したあと中身の変わらない編集を積み、やり直してから戻すと、1 回で戻す前の版へ戻り、それ以上は戻れない", () => {
  const unchanged = EditHistory.record(undoneOnce(), documentOfWidth(375));
  const redone = Option.unwrap(EditHistory.redo(unchanged));

  const undone = Option.unwrap(EditHistory.undo(redone));

  expect([undone.present, Option.isSome(EditHistory.undo(undone))]).toEqual([
    documentOfWidth(375),
    false,
  ]);
});

test("2 回編集して 1 回戻し、中身の変わらない編集を積んでから戻すと、2 回のやり直しで元の 2 つの編集を順に辿れ、それ以上は進めない", () => {
  const editedTwice = EditHistory.record(
    EditHistory.record(
      EditHistory.create(documentOfWidth(375)),
      documentOfWidth(414),
    ),
    documentOfWidth(768),
  );
  const undone = Option.unwrap(EditHistory.undo(editedTwice));
  const unchanged = EditHistory.record(undone, documentOfWidth(414));
  const undoneAgain = Option.unwrap(EditHistory.undo(unchanged));

  const redone = Option.unwrap(EditHistory.redo(undoneAgain));
  const redoneTwice = Option.unwrap(EditHistory.redo(redone));

  expect([
    redone.present,
    redoneTwice.present,
    Option.isSome(EditHistory.redo(redoneTwice)),
  ]).toEqual([documentOfWidth(414), documentOfWidth(768), false]);
});

test("戻したあと、中身の変わらない続きだけが届いても（1 件目の `record` 無し）、やり直せる", () => {
  const continued = EditHistory.amend(undoneOnce(), documentOfWidth(375));

  const redone = Option.unwrap(EditHistory.redo(continued));
  expect(redone.present).toEqual(documentOfWidth(414));
});
