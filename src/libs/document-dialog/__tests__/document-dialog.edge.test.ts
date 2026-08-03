import { expect, test } from "vitest";
import { DialogChoice, DocumentDialogFake } from "../fake";

test("ダイアログを出せなかったときは失敗として返り、例外にはならない", async () => {
  const fake = DocumentDialogFake.create({
    open: DialogChoice.failed("dialog.open not allowed"),
    save: DialogChoice.CANCELED,
  });

  const chosen = await fake.dialog.chooseOpenPath();

  expect(chosen.ok).toBe(false);
});

test("ダイアログを出せなかった理由がメッセージに残る", async () => {
  const fake = DocumentDialogFake.create({
    open: DialogChoice.CANCELED,
    save: DialogChoice.failed("dialog.save not allowed"),
  });

  const chosen = await fake.dialog.chooseSavePath();

  expect(chosen.ok ? "" : chosen.error.message).toContain(
    "dialog.save not allowed",
  );
});
