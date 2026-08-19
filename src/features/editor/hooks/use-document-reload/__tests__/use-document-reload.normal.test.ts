import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "@/domains/design-document";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { changeExternally, Path, renderDocumentReload } from "./setup";

test("外部エディタがファイルを書き換えると、その内容が取り込まれる", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  const observer = await renderDocumentReload(fake.ipc);

  await changeExternally(fake, artboardContent("settings"));

  // JSON を経由すると省略可能なキーが落ちるため、キーの有無ではなく値で比べる。
  expect(observer.reloads).toEqual([
    {
      kind: "reloaded",
      document: DesignDocument.create({
        artboards: [
          Artboard.create({ name: "settings", width: 360, height: 240 }),
        ],
      }),
    },
  ]);
});

test("開いていない別のファイルが書き換わっても取り込まない", async () => {
  const otherPath = "/work/settings.dcmp";
  const fake = DocumentIpcFake.create({
    [Path]: artboardContent("home"),
    [otherPath]: artboardContent("settings"),
  });
  const opened = await renderDocumentReload(fake.ipc);
  // 別のファイルも監視されている状態を作る（`document-changed` はアプリ全体へ配られる）。
  await renderDocumentReload(fake.ipc, otherPath);

  await changeExternally(fake, artboardContent("profile"), otherPath);

  expect(opened.reloads).toStrictEqual([]);
});

test("画面を閉じた後の外部変更は取り込まれない", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  const observer = await renderDocumentReload(fake.ipc);

  observer.unmount();
  await changeExternally(fake, artboardContent("settings"));

  expect(observer.reloads).toStrictEqual([]);
});
