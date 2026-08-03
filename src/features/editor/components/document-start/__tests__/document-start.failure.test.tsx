import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { DocumentIpcErrorKind } from "@/libs/document-ipc";
import { DocumentStart } from "../index";

/** 読み書きに失敗した状態。失敗の種類ごとに言い方が変わる。 */
function ioFailure(kind: DocumentIpcErrorKind) {
  return {
    kind: "failed",
    failure: {
      kind: "io",
      error: { kind, message: "/work/login.dcmp" },
    },
  } as const;
}

test("ファイルが無いときは、見つからないことが伝わる", () => {
  render(<DocumentStart session={ioFailure("notFound")} />);

  expect(screen.getByText("ファイルが見つかりません")).toBeDefined();
});

test("読み書きが許されていないときは、権限の問題だと伝わる", () => {
  render(<DocumentStart session={ioFailure("permissionDenied")} />);

  expect(
    screen.getByText("ファイルを読み書きする権限がありません"),
  ).toBeDefined();
});

test("パスとして扱えない指定のときは、パスの問題だと伝わる", () => {
  render(<DocumentStart session={ioFailure("invalidPath")} />);

  expect(screen.getByText("パスが正しくありません")).toBeDefined();
});

test("UTF-8 として読めないファイルのときは、文字コードの問題だと伝わる", () => {
  render(<DocumentStart session={ioFailure("invalidUtf8")} />);

  expect(screen.getByText("UTF-8 のテキストとして読めません")).toBeDefined();
});

test("読み書き自体が失敗したときは、その旨が伝わる", () => {
  render(<DocumentStart session={ioFailure("io")} />);

  expect(screen.getByText("ファイルの読み書きに失敗しました")).toBeDefined();
});

test("コマンドを呼べなかったときは、アプリ内部の問題だと伝わる", () => {
  render(<DocumentStart session={ioFailure("ipcFailed")} />);

  expect(screen.getByText("アプリ内部の呼び出しに失敗しました")).toBeDefined();
});

test("読み書きに失敗したときは、診断用のメッセージも添えられる", () => {
  render(<DocumentStart session={ioFailure("notFound")} />);

  expect(screen.getByText("/work/login.dcmp")).toBeDefined();
});

test("ダイアログを出せなかったときは、ファイルの選択に失敗したと伝わる", () => {
  render(
    <DocumentStart
      session={{
        kind: "failed",
        failure: { kind: "dialog", error: { message: "not allowed" } },
      }}
    />,
  );

  expect(screen.getByText("ファイルの選択に失敗しました")).toBeDefined();
});

test("内容が不正なファイルのときは、エラーの一覧が並ぶ", () => {
  render(
    <DocumentStart
      session={{
        kind: "failed",
        failure: {
          kind: "invalid",
          errors: [
            {
              kind: "dangling-ref",
              message: 'unknown component "missing-button"',
              location: { kind: "node", nodeName: "home-login" },
            },
          ],
        },
      }}
    />,
  );

  expect(screen.getByText('unknown component "missing-button"')).toBeDefined();
});

test("読み込んでいる間は、その最中であることが分かる", () => {
  render(<DocumentStart session={{ kind: "opening" }} />);

  expect(screen.getByText("ファイルを読み込んでいます…")).toBeDefined();
});
