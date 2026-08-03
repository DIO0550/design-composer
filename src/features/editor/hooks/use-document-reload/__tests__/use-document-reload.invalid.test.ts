import { expect, test } from "vitest";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { Option } from "@/utils/Option";
import {
  artboardContent,
  changeExternally,
  PATH,
  renderDocumentReload,
} from "./setup";

test("外部エディタが不正な JSON を保存すると、エラー一覧として届く", async () => {
  const fake = DocumentIpcFake.create({ [PATH]: artboardContent("home") });
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
  const fake = DocumentIpcFake.create({ [PATH]: artboardContent("home") });
  const observer = await renderDocumentReload(fake.ipc);

  await changeExternally(fake, '{ "formatVersion": ');
  await changeExternally(fake, artboardContent("settings"));

  expect(observer.reloads.map((reload) => reload.kind)).toStrictEqual([
    "rejected",
    "reloaded",
  ]);
});

test("存在しないファイルは監視できず、その失敗が返る", async () => {
  const fake = DocumentIpcFake.create({});

  const observer = await renderDocumentReload(fake.ipc, "/work/missing.dcmp");

  expect(observer.failure()).toStrictEqual(
    Option.some({
      kind: "notFound",
      message: "/work/missing.dcmp: ファイルが存在しない",
    }),
  );
});
