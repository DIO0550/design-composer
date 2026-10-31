import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { createDocumentDialogFake, DialogChoice } from "../fake";

test("ダイアログを出せなかったときは失敗として返り、例外にはならない", async () => {
  const fake = createDocumentDialogFake({
    open: DialogChoice.failed("dialog.open not allowed"),
    save: DialogChoice.Canceled,
  });

  const chosen = await fake.dialog.chooseOpenPath();

  expect(Result.isOk(chosen)).toBe(false);
});

test("ダイアログを出せなかった理由がメッセージに残る", async () => {
  const fake = createDocumentDialogFake({
    open: DialogChoice.Canceled,
    save: DialogChoice.failed("dialog.save not allowed"),
  });

  const chosen = await fake.dialog.chooseSavePath();

  expect(Result.isOk(chosen) ? "" : chosen.error.message).toContain(
    "dialog.save not allowed",
  );
});

test("開くダイアログがファイル名の要素を持たないパスを返すと失敗になる", async () => {
  const fake = createDocumentDialogFake({
    open: DialogChoice.chosen("/"),
    save: DialogChoice.Canceled,
  });

  const chosen = await fake.dialog.chooseOpenPath();

  expect(Result.isOk(chosen)).toBe(false);
});

test("保存のダイアログがファイル名の要素を持たないパスを返すと、その旨と受け取ったパスが失敗に残る", async () => {
  const fake = createDocumentDialogFake({
    open: DialogChoice.Canceled,
    save: DialogChoice.chosen("\\"),
  });

  const chosen = await fake.dialog.chooseSavePath();

  expect(chosen).toStrictEqual(
    Result.err({ message: "選ばれたパスがファイル名を持たない: \\" }),
  );
});
