import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { DialogChoice, DocumentDialogFake } from "../fake";

test("ダイアログを出せなかったときは失敗として返り、例外にはならない", async () => {
  const fake = DocumentDialogFake.create({
    open: DialogChoice.failed("dialog.open not allowed"),
    save: DialogChoice.Canceled,
  });

  const chosen = await fake.dialog.chooseOpenPath();

  expect(Result.isOk(chosen)).toBe(false);
});

test("ダイアログを出せなかった理由がメッセージに残る", async () => {
  const fake = DocumentDialogFake.create({
    open: DialogChoice.Canceled,
    save: DialogChoice.failed("dialog.save not allowed"),
  });

  const chosen = await fake.dialog.chooseSavePath();

  expect(Result.isOk(chosen) ? "" : chosen.error.message).toContain(
    "dialog.save not allowed",
  );
});
