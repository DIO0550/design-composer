import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { DocumentError } from "@/domains/session/document-error";
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

/**
 * 渡されたエラーに依らず必ず何かを描くスタブ。
 * 「一覧を出すかどうか」だけを見るテストで使う。エラーが 0 件でも描くので、
 * 出す条件（不正なファイルのときだけ）を壊すと必ず落ちる。
 */
function renderPlaceholder() {
  return <p>一覧の代役</p>;
}

/**
 * 渡されたエラーをそのまま描くスタブ。
 * 「何が渡ったか」を見るテストで使う（上のスタブは渡されたものを見ていない）。
 */
function renderMessages(errors: readonly DocumentError[]) {
  return errors.map((error) => <p key={error.message}>{error.message}</p>);
}

test("ファイルが無いときは、見つからないことが伝わる", () => {
  render(
    <DocumentStart
      session={ioFailure("notFound")}
      renderErrors={renderPlaceholder}
    />,
  );

  expect(screen.getByText("ファイルが見つかりません")).toBeDefined();
});

test("読み書きが許されていないときは、権限の問題だと伝わる", () => {
  render(
    <DocumentStart
      session={ioFailure("permissionDenied")}
      renderErrors={renderPlaceholder}
    />,
  );

  expect(
    screen.getByText("ファイルを読み書きする権限がありません"),
  ).toBeDefined();
});

test("パスとして扱えない指定のときは、パスの問題だと伝わる", () => {
  render(
    <DocumentStart
      session={ioFailure("invalidPath")}
      renderErrors={renderPlaceholder}
    />,
  );

  expect(screen.getByText("パスが正しくありません")).toBeDefined();
});

test("UTF-8 として読めないファイルのときは、文字コードの問題だと伝わる", () => {
  render(
    <DocumentStart
      session={ioFailure("invalidUtf8")}
      renderErrors={renderPlaceholder}
    />,
  );

  expect(screen.getByText("UTF-8 のテキストとして読めません")).toBeDefined();
});

test("読み書き自体が失敗したときは、その旨が伝わる", () => {
  render(
    <DocumentStart
      session={ioFailure("io")}
      renderErrors={renderPlaceholder}
    />,
  );

  expect(screen.getByText("ファイルの読み書きに失敗しました")).toBeDefined();
});

test("コマンドを呼べなかったときは、アプリ内部の問題だと伝わる", () => {
  render(
    <DocumentStart
      session={ioFailure("ipcFailed")}
      renderErrors={renderPlaceholder}
    />,
  );

  expect(screen.getByText("アプリ内部の呼び出しに失敗しました")).toBeDefined();
});

test("読み書きに失敗したときは、診断用のメッセージも添えられる", () => {
  render(
    <DocumentStart
      session={ioFailure("notFound")}
      renderErrors={renderPlaceholder}
    />,
  );

  expect(screen.getByText("/work/login.dcmp")).toBeDefined();
});

test("読み書きに失敗したときは、エラーの一覧を出さない", () => {
  render(
    <DocumentStart
      session={ioFailure("notFound")}
      renderErrors={renderPlaceholder}
    />,
  );

  expect(screen.queryByText("一覧の代役")).toBeNull();
});

test("ダイアログを出せなかったときは、ファイルの選択に失敗したと伝わる", () => {
  render(
    <DocumentStart
      session={{
        kind: "failed",
        failure: { kind: "dialog", error: { message: "not allowed" } },
      }}
      renderErrors={renderPlaceholder}
    />,
  );

  expect(screen.getByText("ファイルの選択に失敗しました")).toBeDefined();
});

test("内容が不正なファイルのときは、そのエラーが一覧に渡される", () => {
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
      renderErrors={renderMessages}
    />,
  );

  expect(screen.getByText('unknown component "missing-button"')).toBeDefined();
});

test("読み込んでいる間は、その最中であることが分かる", () => {
  render(
    <DocumentStart
      session={{ kind: "opening" }}
      renderErrors={renderPlaceholder}
    />,
  );

  expect(screen.getByText("ファイルを読み込んでいます…")).toBeDefined();
});
