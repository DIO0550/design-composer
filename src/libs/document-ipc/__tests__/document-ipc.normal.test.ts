import { expect, test } from "vitest";
import { filePath } from "@/domains/__tests__/file-paths";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { createDocumentIpcFake } from "../fake";
import type { DocumentChanged } from "../index";

const Path = filePath("/work/login.dcmp");
/** `Path` を指す別の綴り。 */
const LinkPath = filePath("/link/login.dcmp");

test("ファイルを読み込むとその中身が返る", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{ "formatVersion": "1.0" }` });

  const loaded = await fake.ipc.load(Path);

  expect(Result.unwrap(loaded)).toBe(`{ "formatVersion": "1.0" }`);
});

test("保存した内容が次の読み込みで返る", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{ "formatVersion": "1.0" }` });

  Result.unwrap(await fake.ipc.save(Path, `{ "formatVersion": "1.1" }`));

  expect(Result.unwrap(await fake.ipc.load(Path))).toBe(
    `{ "formatVersion": "1.1" }`,
  );
});

test("まだ無いパスへ保存するとファイルが作られる", async () => {
  const fake = createDocumentIpcFake();

  Result.unwrap(await fake.ipc.save(Path, `{}`));

  expect(fake.contentOf(Path)).toStrictEqual(Option.some(`{}`));
});

test("監視中のファイルが外部から書き換わると、パスと中身が届く", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(Path));

  fake.changeExternally(Path, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([
    { path: Path, content: `{ "formatVersion": "1.0" }` },
  ]);
});

test("自アプリの保存は外部変更として届かない", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(Path));

  Result.unwrap(await fake.ipc.save(Path, `{ "formatVersion": "1.0" }`));

  expect(received).toStrictEqual([]);
});

test("監視していないファイルの外部変更は届かない", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );

  fake.changeExternally(Path, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([]);
});

test("監視を止めると外部変更が届かなくなる", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(Path));

  Result.unwrap(await fake.ipc.unwatch(Path));
  fake.changeExternally(Path, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([]);
});

test("購読を解除すると外部変更が届かなくなる", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  const received: DocumentChanged[] = [];
  const unsubscribe = Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(Path));

  unsubscribe();
  fake.changeExternally(Path, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([]);
});

test("別の綴りを寄せると、実体の綴りになる", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  fake.linkPath({ link: LinkPath, target: Path });

  const canonical = await fake.ipc.canonicalize(LinkPath);

  expect(canonical).toStrictEqual(Result.ok(Path));
});

test("別の綴りを持たないパスは、寄せても綴りが変わらない", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  fake.linkPath({ link: LinkPath, target: Path });

  const canonical = await fake.ipc.canonicalize(Path);

  expect(canonical).toStrictEqual(Result.ok(Path));
});

test("別の綴りで読むと、実体の中身が返る", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{ "formatVersion": "1.0" }` });
  fake.linkPath({ link: LinkPath, target: Path });

  const loaded = await fake.ipc.load(LinkPath);

  expect(Result.unwrap(loaded)).toBe(`{ "formatVersion": "1.0" }`);
});

test("別の綴りで書くと、実体の中身が変わる", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  fake.linkPath({ link: LinkPath, target: Path });

  Result.unwrap(await fake.ipc.save(LinkPath, `{ "formatVersion": "1.1" }`));

  expect(Result.unwrap(await fake.ipc.load(Path))).toBe(
    `{ "formatVersion": "1.1" }`,
  );
});

test("別の綴りで外部から書き換えると、実体を監視している綴りで届く", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  fake.linkPath({ link: LinkPath, target: Path });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(Path));

  fake.changeExternally(LinkPath, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([
    { path: Path, content: `{ "formatVersion": "1.0" }` },
  ]);
});

test("別の綴りで監視すると、実体の外部変更がその綴りで届く", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  fake.linkPath({ link: LinkPath, target: Path });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(LinkPath));

  fake.changeExternally(Path, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([
    { path: LinkPath, content: `{ "formatVersion": "1.0" }` },
  ]);
});

test("後から別の綴りで監視し直すと、前の綴りには外部変更が届かない", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  fake.linkPath({ link: LinkPath, target: Path });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(Path));
  Result.unwrap(await fake.ipc.watch(LinkPath));

  fake.changeExternally(Path, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([
    { path: LinkPath, content: `{ "formatVersion": "1.0" }` },
  ]);
});

test("別の綴りで監視を止めると、実体の外部変更が届かなくなる", async () => {
  const fake = createDocumentIpcFake({ [Path]: `{}` });
  fake.linkPath({ link: LinkPath, target: Path });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(Path));

  Result.unwrap(await fake.ipc.unwatch(LinkPath));
  fake.changeExternally(Path, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([]);
});
