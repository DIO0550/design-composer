import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { DocumentErrorList } from "../index";

/** 外部エディタが不正なファイルを保存したときに届くエラー。 */
const SYNTAX_ERROR: DocumentError = {
  kind: "syntax-error",
  message: "expected ',' or '}'",
  location: { kind: "text-position", position: 42 },
};

test("エラーが無いときは何も重ねない", () => {
  render(<DocumentErrorList errors={[]} />);

  expect(screen.queryByRole("alert")).toBeNull();
});

test("エラーが複数あると、件数とそれぞれの内容が一覧で出る", () => {
  render(
    <DocumentErrorList
      errors={[
        SYNTAX_ERROR,
        {
          kind: "dangling-ref",
          message: 'unknown component "missing-button"',
          location: { kind: "node", nodeName: "cta" },
        },
      ]}
    />,
  );

  const errorList = screen.getByRole("alert", { name: "エラー一覧" });

  expect(within(errorList).getByText("2 件のエラー")).toBeDefined();
  expect(within(errorList).getByText("expected ',' or '}'")).toBeDefined();
  expect(
    within(errorList).getByText('unknown component "missing-button"'),
  ).toBeDefined();
});

test("テキストの位置が分かるエラーには何文字目かが出る", () => {
  render(<DocumentErrorList errors={[SYNTAX_ERROR]} />);

  expect(screen.getByText("42 文字目")).toBeDefined();
});

test("ノードの prop で起きたエラーにはノード名と prop 名が出る", () => {
  render(
    <DocumentErrorList
      errors={[
        {
          kind: "unknown-prop",
          message: 'unknown prop "colour"',
          location: { kind: "node", nodeName: "home-title", prop: "colour" },
        },
      ]}
    />,
  );

  expect(screen.getByText("home-title.colour")).toBeDefined();
});

test("prop に紐づかないノードのエラーにはノード名だけが出る", () => {
  render(
    <DocumentErrorList
      errors={[
        {
          kind: "dangling-ref",
          message: 'unknown component "missing-button"',
          location: { kind: "node", nodeName: "cta" },
        },
      ]}
    />,
  );

  expect(screen.getByText("cta")).toBeDefined();
});

test("位置を持たないエラーはファイル全体の問題として出る", () => {
  render(
    <DocumentErrorList
      errors={[
        {
          kind: "unsupported-format-version",
          message: "file format version 99.0 is newer than this app (1.0)",
          location: { kind: "whole-document" },
        },
      ]}
    />,
  );

  expect(screen.getByText("ファイル全体")).toBeDefined();
});

test("ドキュメント内のパスが分かるエラーにはそのパスが出る", () => {
  render(
    <DocumentErrorList
      errors={[
        {
          kind: "invalid-type",
          message: "expected number but got string",
          location: { kind: "document-path", path: "artboards[0].width" },
        },
      ]}
    />,
  );

  expect(screen.getByText("artboards[0].width")).toBeDefined();
});
