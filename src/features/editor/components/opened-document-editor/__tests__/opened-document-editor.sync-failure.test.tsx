import { act, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { createClockFake } from "@/libs/clock/fake";
import { createDocumentIpcFake } from "@/libs/document-ipc/fake";
import { OpenedDocumentEditor } from "../index";
import { canvasPane, Path } from "./setup";

test("開いているファイルを監視できないと、その失敗が画面に出る", async () => {
  // 監視の開始は現在の内容の読み込みを伴うため、実体の無いパスでは張れない。
  const fake = createDocumentIpcFake({});

  render(
    <OpenedDocumentEditor
      clock={createClockFake().clock}
      ipc={fake.ipc}
      opened={{ path: Path, document: SampleDocument }}
    />,
  );
  await act(async () => {});

  expect(screen.getByText("外部変更の監視に失敗しました")).toBeDefined();
});

test("監視できないファイルでも、開いているドキュメントは表示され続ける", async () => {
  const fake = createDocumentIpcFake({});

  render(
    <OpenedDocumentEditor
      clock={createClockFake().clock}
      ipc={fake.ipc}
      opened={{ path: Path, document: SampleDocument }}
    />,
  );
  await act(async () => {});

  expect(canvasPane()).toBeDefined();
});
