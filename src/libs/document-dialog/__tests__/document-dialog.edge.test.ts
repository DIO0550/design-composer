import { expect, test } from "vitest";
import type { TauriIpc } from "@/libs/tauri-ipc";
import { ipcFailure } from "@/libs/tauri-ipc/fake";
import { Result } from "@/utils/Result";
import { createDocumentDialogFake, DialogChoice } from "../fake";
import { createDocumentDialog } from "../index";

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

test("選ばれたものを Rust が受け付けなかったときは、その理由の原文が失敗に残る", async () => {
  const fake = createDocumentDialogFake({
    open: DialogChoice.refused("/work/notes.txt: 拡張子が `.dcmp` ではない"),
    save: DialogChoice.Canceled,
  });

  const chosen = await fake.dialog.chooseOpenPath();

  expect(chosen).toStrictEqual(
    Result.err({ message: "/work/notes.txt: 拡張子が `.dcmp` ではない" }),
  );
});

test("ダイアログのコマンドが文字列でも null でもない値を返すと、その旨と受け取った値が失敗に残る", async () => {
  // 本物の Rust は返さない値なので、代役ではなく値を返すだけの IPC を組む。
  const tauriIpc: TauriIpc = {
    invoke() {
      return Promise.resolve(42);
    },
    listen(event) {
      return ipcFailure(`Event ${event} not emitted`);
    },
  };
  const dialog = createDocumentDialog(tauriIpc);

  const chosen = await dialog.chooseOpenPath();

  expect(chosen).toStrictEqual(
    Result.err({
      message: "choose_open_document_path が文字列以外を返した: 42",
    }),
  );
});
