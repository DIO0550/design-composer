import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DialogChoice, DocumentDialogFake } from "../fake";

test("開くファイルを選ぶと、そのパスが返る", async () => {
  const fake = DocumentDialogFake.create({
    open: DialogChoice.chosen("/work/login.dcmp"),
    save: DialogChoice.CANCELED,
  });

  const chosen = await fake.dialog.chooseOpenPath();

  expect(Result.unwrap(chosen)).toStrictEqual(Option.some("/work/login.dcmp"));
});

test("保存先を選ぶと、そのパスが返る", async () => {
  const fake = DocumentDialogFake.create({
    open: DialogChoice.CANCELED,
    save: DialogChoice.chosen("/work/untitled.dcmp"),
  });

  const chosen = await fake.dialog.chooseSavePath();

  expect(Result.unwrap(chosen)).toStrictEqual(
    Option.some("/work/untitled.dcmp"),
  );
});

test("ファイルを選ばずに閉じると、選ばれたパスは無い", async () => {
  const fake = DocumentDialogFake.create({
    open: DialogChoice.CANCELED,
    save: DialogChoice.CANCELED,
  });

  const chosen = await fake.dialog.chooseOpenPath();

  expect(Result.unwrap(chosen)).toStrictEqual(Option.none);
});
