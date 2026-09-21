import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import {
  DocumentAccessFailure,
  DocumentAccessFailureReasons,
} from "@/domains/session/document-access-failure";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { Option } from "@/utils/Option";
import { changeExternally, Path, renderDocumentReload } from "./setup";

test("外部エディタが不正な JSON を保存すると、エラー一覧として届く", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  const observer = await renderDocumentReload(fake.ipc);

  await changeExternally(fake, '{ "formatVersion": ');

  expect(observer.reloads).toStrictEqual([
    {
      kind: "rejected",
      errors: [
        {
          kind: "syntax-error",
          message: expect.any(String),
          location: { kind: "text-position", position: expect.any(Number) },
        },
      ],
    },
  ]);
});

test("不正な JSON を直して保存すると、そのドキュメントが取り込まれる", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  const observer = await renderDocumentReload(fake.ipc);

  await changeExternally(fake, '{ "formatVersion": ');
  await changeExternally(fake, artboardContent("settings"));

  expect(observer.reloads.map((reload) => reload.kind)).toStrictEqual([
    "rejected",
    "reloaded",
  ]);
});

test("外部変更の購読を張れないときは、その失敗がドメインの語彙で返る", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  fake.denySubscribe();

  const observer = await renderDocumentReload(fake.ipc);

  // Tauri 自身が失敗すると文字列で reject されるので、IPC の語彙では `ipcFailed`。
  // 境界を通っていれば `undelivered` になる。
  expect(observer.failure()).toStrictEqual(
    Option.some(
      DocumentAccessFailure.create(
        DocumentAccessFailureReasons.Undelivered,
        "document-changed: 購読を開始できない",
      ),
    ),
  );
});

test("存在しないファイルは監視できず、その失敗が返る", async () => {
  const fake = DocumentIpcFake.create({});

  const observer = await renderDocumentReload(fake.ipc, "/work/missing.dcmp");

  expect(observer.failure()).toStrictEqual(
    Option.some(
      DocumentAccessFailure.create(
        DocumentAccessFailureReasons.Missing,
        "/work/missing.dcmp: ファイルが存在しない",
      ),
    ),
  );
});
