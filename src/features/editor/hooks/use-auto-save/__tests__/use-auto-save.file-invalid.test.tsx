import { afterEach, expect, test, vi } from "vitest";
import { SampleSyntaxError } from "@/features/editor/__tests__/document-errors";
import { ReceivedAt } from "@/features/editor/__tests__/instants";
import { artboardDocument } from "@/features/editor/__tests__/sample-document";
import { FileValidity } from "@/features/editor/domains/file-validity";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";
import { AutoSaveDebounceMs } from "../index";
import { Path, renderAutoSave, waitDebounce } from "./setup";

/*
 * 外部編集でファイルが不正になっている間は書き出さないこと（#155）。
 *
 * 映っているのは最後に正常だった表示なので、書き出すと**より新しい外部の書き込みを
 * 古い内容で潰す**（docs/05-architecture.md「競合の解決」の last-write-wins から外れる）。
 */

afterEach(() => {
  vi.useRealTimers();
});

/** 外部変更を拒んだ状態の妥当性。 */
const Invalid: FileValidity = {
  kind: "invalid",
  errors: [SampleSyntaxError],
  since: ReceivedAt,
};

test("ファイルが不正な間は、編集してもファイルへ書き出さない", async () => {
  vi.useFakeTimers();
  const broken = "{ 壊れた";
  const fake = DocumentIpcFake.create({ [Path]: broken });
  const { rerender } = renderAutoSave({
    ipc: fake.ipc,
    document: artboardDocument("home"),
    fileValidity: Invalid,
  });

  rerender({
    ipc: fake.ipc,
    document: artboardDocument("settings"),
    fileValidity: Invalid,
  });
  await waitDebounce();

  expect(fake.contentOf(Path)).toStrictEqual(Option.some(broken));
});

test("編集の直後にファイルが不正になると、デバウンス中だった書き込みは行われない", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const broken = "{ 壊れた";
  const fake = DocumentIpcFake.create({
    [Path]: DocumentJson.serialize(opened),
  });
  const { rerender } = renderAutoSave({ ipc: fake.ipc, document: opened });

  // 編集してデバウンスを走らせ、書き出される前に外部がファイルを壊す
  rerender({ ipc: fake.ipc, document: artboardDocument("settings") });
  await waitDebounce(AutoSaveDebounceMs - 1);
  fake.changeExternally(Path, broken);
  rerender({
    ipc: fake.ipc,
    document: artboardDocument("settings"),
    fileValidity: Invalid,
  });
  await waitDebounce();

  expect(fake.contentOf(Path)).toStrictEqual(Option.some(broken));
});

test("ファイルが直ると、その後の編集はファイルへ書き出される", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const edited = artboardDocument("settings");
  const fake = DocumentIpcFake.create({
    [Path]: DocumentJson.serialize(opened),
  });
  const { rerender } = renderAutoSave({
    ipc: fake.ipc,
    document: opened,
    fileValidity: Invalid,
  });

  rerender({
    ipc: fake.ipc,
    document: edited,
    fileValidity: FileValidity.valid,
  });
  await waitDebounce();

  expect(fake.contentOf(Path)).toStrictEqual(
    Option.some(DocumentJson.serialize(edited)),
  );
});
