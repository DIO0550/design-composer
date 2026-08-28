import { afterEach, expect, test, vi } from "vitest";
import {
  artboardContent,
  artboardDocument,
  danglingTokenContent,
  danglingTokenDocument,
} from "@/domains/__tests__/sample-document";
import { FileValidity } from "@/domains/session/file-validity";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { Option } from "@/utils/Option";
import { Path, renderAutoSave, waitDebounce } from "./setup";

/*
 * ドキュメント自身が不正でも書き出すこと（#158）。ファイルは常に画面と一致する、が
 * 保存モデルの前提（docs/05-architecture.md「保存モデル: 自動保存」）で、書かずに
 * 止めると「画面にあってファイルに無い」状態が生まれる。
 *
 * `useAutoSave` は `document` の中身を見ないので、いまの実装では落ちない。落ちるのは
 * 「不正なら書かない」ガードを足したときで、この 1 本はその回帰を止めるために置く。
 *
 * ファイル自身が不正で書き出しを止める側（外部変更を拒んでいる間）は
 * `use-auto-save.file-invalid.test.tsx`。対照が読めるよう、ここでは妥当な
 * `fileValidity` を明示的に渡す。
 */

afterEach(() => {
  vi.useRealTimers();
});

test("ドキュメント自身が不正でも、その内容がファイルへ書き出される", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const invalid = danglingTokenDocument("home");
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  const { rerender } = renderAutoSave({
    ipc: fake.ipc,
    document: opened,
    fileValidity: FileValidity.valid,
  });

  rerender({
    ipc: fake.ipc,
    document: invalid,
    fileValidity: FileValidity.valid,
  });
  await waitDebounce();

  expect(fake.contentOf(Path)).toStrictEqual(
    Option.some(danglingTokenContent("home")),
  );
});
