import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { AppStateIpcFake } from "../fake";
import { AppStateIpc } from "../index";

test("読み込みが拒まれたら理由を持つ失敗になる", async () => {
  const fake = AppStateIpcFake.create('{"recentPaths":[]}');
  fake.denyLoad();

  const loaded = await fake.ipc.load();

  expect(loaded).toStrictEqual(
    Result.err({ message: "app-state.json: 読み込みが拒まれた" }),
  );
});

test("書き出しが拒まれたら理由を持つ失敗になる", async () => {
  const fake = AppStateIpcFake.create();
  fake.denySave();

  const saved = await fake.ipc.save('{"recentPaths":[]}');

  expect(saved).toStrictEqual(
    Result.err({ message: "app-state.json: 書き込みが拒まれた" }),
  );
});

test("書き出しが拒まれたら中身は変わらない", async () => {
  const fake = AppStateIpcFake.create('{"recentPaths":[]}');
  fake.denySave();

  await fake.ipc.save('{"recentPaths":["/work/login.dcmp"]}');

  expect(fake.storedContent()).toStrictEqual(Option.some('{"recentPaths":[]}'));
});

test("コマンドが無いときも理由を持つ失敗になる", async () => {
  const ipc = AppStateIpc.create({
    invoke: (command) => Promise.reject(`Command ${command} not found`),
    listen: (event) => Promise.reject(`Event ${event} not emitted`),
  });

  const loaded = await ipc.load();

  expect(loaded).toStrictEqual(
    Result.err({ message: "Command load_app_state not found" }),
  );
});

test("読み込みが文字列でも null でもない値を返したら失敗になる", async () => {
  const ipc = AppStateIpc.create({
    invoke: () => Promise.resolve(42),
    listen: (event) => Promise.reject(`Event ${event} not emitted`),
  });

  expect(Result.isOk(await ipc.load())).toBe(false);
});
