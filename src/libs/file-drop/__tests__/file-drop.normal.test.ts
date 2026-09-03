import { expect, test } from "vitest";
import { FileDropFake } from "@/libs/file-drop/fake";
import { Result } from "@/utils/Result";

const Path = "/work/login.dcmp";
const OtherPath = "/work/settings.dcmp";

/**
 * 購読を張り、届いたパスの並びを溜める。
 *
 * @returns ドロップを起こす代役と、これまでに届いた並び
 */
async function subscribeDrop(): Promise<
  Readonly<{ fake: FileDropFake; received: (readonly string[])[] }>
> {
  const fake = FileDropFake.create();
  const received: (readonly string[])[] = [];
  Result.unwrap(
    await fake.drop.subscribeDropped((paths) => {
      received.push(paths);
    }),
  );
  return { fake, received };
}

test("ファイルが落とされると、そのパスが届く", async () => {
  const { fake, received } = await subscribeDrop();

  fake.dropFiles([Path]);

  expect(received).toStrictEqual([[Path]]);
});

test("複数のファイルが落とされると、並びのまま届く", async () => {
  const { fake, received } = await subscribeDrop();

  fake.dropFiles([Path, OtherPath]);

  expect(received).toStrictEqual([[Path, OtherPath]]);
});

test("購読を解除すると、その後に落とされても届かない", async () => {
  const fake = FileDropFake.create();
  const received: (readonly string[])[] = [];
  const unsubscribe = Result.unwrap(
    await fake.drop.subscribeDropped((paths) => {
      received.push(paths);
    }),
  );
  // 解除の前に 1 件届けておく。解除の後だけを見ると、そもそも届いていない実装でも通る。
  fake.dropFiles([Path]);

  unsubscribe();
  fake.dropFiles([OtherPath]);

  expect(received).toStrictEqual([[Path]]);
});
