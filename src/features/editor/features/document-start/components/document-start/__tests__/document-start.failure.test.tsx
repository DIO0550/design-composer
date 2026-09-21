import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { DocumentAccessFailureReason } from "@/domains/session/document-access-failure";
import type { DocumentError } from "@/domains/session/document-error";
import { OpenAttempt } from "@/features/editor/features/document-start/domains/document-session";
import { renderDocumentStart } from "./setup";

/** 読み書きに失敗して開けなかった状態。 */
function ioFailure(reason: DocumentAccessFailureReason): OpenAttempt {
  return OpenAttempt.failed({
    kind: "io",
    error: { reason, message: "/work/login.dcmp" },
  });
}

/**
 * 渡されたエラーに依らず必ず何かを描くスタブ。
 * 「一覧を出すかどうか」だけを見るテストで使う。エラーが 0 件でも描くので、
 * 出す条件（解釈できなかったファイルのときだけ）を壊すと必ず落ちる。
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
  renderDocumentStart({
    attempt: ioFailure("missing"),
    renderErrors: renderPlaceholder,
  });

  expect(screen.getByText("ファイルが見つかりません")).toBeDefined();
});

test("読み書きが許されていないときは、権限の問題だと伝わる", () => {
  renderDocumentStart({
    attempt: ioFailure("notPermitted"),
    renderErrors: renderPlaceholder,
  });

  expect(
    screen.getByText("ファイルを読み書きする権限がありません"),
  ).toBeDefined();
});

test("パスとして扱えない指定のときは、パスの問題だと伝わる", () => {
  renderDocumentStart({
    attempt: ioFailure("unusablePath"),
    renderErrors: renderPlaceholder,
  });

  expect(screen.getByText("パスが正しくありません")).toBeDefined();
});

test("UTF-8 として読めないファイルのときは、文字コードの問題だと伝わる", () => {
  renderDocumentStart({
    attempt: ioFailure("undecodableText"),
    renderErrors: renderPlaceholder,
  });

  expect(screen.getByText("UTF-8 のテキストとして読めません")).toBeDefined();
});

test("読み書き自体が失敗したときは、その旨が伝わる", () => {
  renderDocumentStart({
    attempt: ioFailure("storageFailed"),
    renderErrors: renderPlaceholder,
  });

  expect(screen.getByText("ファイルの読み書きに失敗しました")).toBeDefined();
});

test("コマンドを呼べなかったときは、アプリ内部の問題だと伝わる", () => {
  renderDocumentStart({
    attempt: ioFailure("undelivered"),
    renderErrors: renderPlaceholder,
  });

  expect(screen.getByText("アプリ内部の呼び出しに失敗しました")).toBeDefined();
});

test("読み書きに失敗したときは、診断用のメッセージも添えられる", () => {
  renderDocumentStart({
    attempt: ioFailure("missing"),
    renderErrors: renderPlaceholder,
  });

  expect(screen.getByText("/work/login.dcmp")).toBeDefined();
});

test("読み書きに失敗したときは、エラーの一覧を出さない", () => {
  renderDocumentStart({
    attempt: ioFailure("missing"),
    renderErrors: renderPlaceholder,
  });

  expect(screen.queryByText("一覧の代役")).toBeNull();
});

test("ダイアログを出せなかったときは、ファイルの選択に失敗したと伝わる", () => {
  renderDocumentStart({
    attempt: OpenAttempt.failed({
      kind: "dialog",
      error: { message: "not allowed" },
    }),
    renderErrors: renderPlaceholder,
  });

  expect(screen.getByText("ファイルの選択に失敗しました")).toBeDefined();
});

test("解釈できなかったファイルのときは、そのエラーが一覧に渡される", () => {
  renderDocumentStart({
    attempt: OpenAttempt.failed({
      kind: "unparsable",
      errors: [
        {
          kind: "syntax-error",
          message: "unexpected end of JSON input",
          location: { kind: "text-position", position: 19 },
        },
      ],
    }),
    renderErrors: renderMessages,
  });

  expect(screen.getByText("unexpected end of JSON input")).toBeDefined();
});

test("読み込んでいる間は、その最中であることが分かる", () => {
  renderDocumentStart({
    attempt: OpenAttempt.Opening,
    renderErrors: renderPlaceholder,
  });

  expect(screen.getByText("ファイルを読み込んでいます…")).toBeDefined();
});
