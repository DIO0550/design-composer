import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { AppStateIpcFake } from "../fake";

test("書き出した中身がそのまま読み戻せる", async () => {
  const fake = AppStateIpcFake.create();

  await fake.ipc.save('{"recentPaths":["/work/login.dcmp"]}');

  expect(Result.unwrap(await fake.ipc.load())).toStrictEqual(
    Option.some('{"recentPaths":["/work/login.dcmp"]}'),
  );
});

test("書き出すと前の中身が置き換わる", async () => {
  const fake = AppStateIpcFake.create('{"recentPaths":[]}');

  await fake.ipc.save('{"recentPaths":["/work/login.dcmp"]}');

  expect(fake.storedContent()).toStrictEqual(
    Option.some('{"recentPaths":["/work/login.dcmp"]}'),
  );
});

test("まだ一度も書き出していなければ中身は無い", async () => {
  const fake = AppStateIpcFake.create();

  expect(Result.unwrap(await fake.ipc.load())).toStrictEqual(Option.none);
});
