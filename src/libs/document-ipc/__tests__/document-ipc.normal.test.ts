import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DocumentIpcFake } from "../fake";
import type { DocumentChanged } from "../index";

const PATH = "/work/login.dcmp";

test("ファイルを読み込むとその中身が返る", async () => {
  const fake = DocumentIpcFake.create({ [PATH]: `{ "formatVersion": "1.0" }` });

  const loaded = await fake.ipc.load(PATH);

  expect(Result.unwrap(loaded)).toBe(`{ "formatVersion": "1.0" }`);
});

test("保存した内容が次の読み込みで返る", async () => {
  const fake = DocumentIpcFake.create({ [PATH]: `{ "formatVersion": "1.0" }` });

  Result.unwrap(await fake.ipc.save(PATH, `{ "formatVersion": "1.1" }`));

  expect(Result.unwrap(await fake.ipc.load(PATH))).toBe(
    `{ "formatVersion": "1.1" }`,
  );
});

test("まだ無いパスへ保存するとファイルが作られる", async () => {
  const fake = DocumentIpcFake.create();

  Result.unwrap(await fake.ipc.save(PATH, `{}`));

  expect(fake.contentOf(PATH)).toStrictEqual(Option.some(`{}`));
});

test("監視中のファイルが外部から書き換わると、パスと中身が届く", async () => {
  const fake = DocumentIpcFake.create({ [PATH]: `{}` });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(PATH));

  fake.changeExternally(PATH, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([
    { path: PATH, content: `{ "formatVersion": "1.0" }` },
  ]);
});

test("自アプリの保存は外部変更として届かない", async () => {
  const fake = DocumentIpcFake.create({ [PATH]: `{}` });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(PATH));

  Result.unwrap(await fake.ipc.save(PATH, `{ "formatVersion": "1.0" }`));

  expect(received).toStrictEqual([]);
});

test("監視していないファイルの外部変更は届かない", async () => {
  const fake = DocumentIpcFake.create({ [PATH]: `{}` });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );

  fake.changeExternally(PATH, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([]);
});

test("監視を止めると外部変更が届かなくなる", async () => {
  const fake = DocumentIpcFake.create({ [PATH]: `{}` });
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(PATH));

  Result.unwrap(await fake.ipc.unwatch(PATH));
  fake.changeExternally(PATH, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([]);
});

test("購読を解除すると外部変更が届かなくなる", async () => {
  const fake = DocumentIpcFake.create({ [PATH]: `{}` });
  const received: DocumentChanged[] = [];
  const unsubscribe = Result.unwrap(
    await fake.ipc.subscribeChanged((changed) => received.push(changed)),
  );
  Result.unwrap(await fake.ipc.watch(PATH));

  unsubscribe();
  fake.changeExternally(PATH, `{ "formatVersion": "1.0" }`);

  expect(received).toStrictEqual([]);
});
