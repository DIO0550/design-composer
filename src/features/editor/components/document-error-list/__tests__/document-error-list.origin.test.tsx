import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { DocumentError } from "@/domains/session/document-error";
import { DocumentErrorList, DocumentErrorOrigins } from "../index";

/** 使用中トークンを消したときに出る、ドキュメント自身の不正。 */
const DanglingToken: DocumentError = {
  kind: "dangling-token",
  message: 'prop "typography" references unknown typography token "heading"',
  location: { kind: "node", nodeName: "home-title", prop: "typography" },
};

test("開いているファイル由来のエラーはファイルの不正として出る", () => {
  render(
    <DocumentErrorList
      errors={[DanglingToken]}
      origin={DocumentErrorOrigins.OpenedFile}
      onReveal={vi.fn()}
      onRevertFile={vi.fn()}
      isReverting={false}
    />,
  );

  expect(screen.getByText("ファイルに 1 件のエラー")).toBeDefined();
});

test("開けなかったファイル由来のエラーもファイルの不正として出る", () => {
  render(
    <DocumentErrorList
      errors={[DanglingToken]}
      origin={DocumentErrorOrigins.UnopenedFile}
    />,
  );

  expect(screen.getByText("ファイルに 1 件のエラー")).toBeDefined();
});

test("ドキュメント由来のエラーは編集中の不正として出る", () => {
  render(
    <DocumentErrorList
      errors={[DanglingToken]}
      origin={DocumentErrorOrigins.Document}
      onReveal={vi.fn()}
    />,
  );

  expect(screen.getByText("編集中のドキュメントに 1 件のエラー")).toBeDefined();
});

test("2 つの由来の一覧は読み上げ名で区別できる", () => {
  render(
    <>
      <DocumentErrorList
        errors={[DanglingToken]}
        origin={DocumentErrorOrigins.OpenedFile}
        onReveal={vi.fn()}
        onRevertFile={vi.fn()}
        isReverting={false}
      />
      <DocumentErrorList
        errors={[DanglingToken]}
        origin={DocumentErrorOrigins.Document}
        onReveal={vi.fn()}
      />
    </>,
  );

  expect(
    screen.getAllByRole("alert").map((list) => list.getAttribute("aria-label")),
  ).toStrictEqual(["エラー一覧", "ドキュメントのエラー一覧"]);
});
