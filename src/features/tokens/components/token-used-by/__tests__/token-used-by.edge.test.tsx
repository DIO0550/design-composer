import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";
import { renderUsedBy } from "./render";

/**
 * 参照元の件数が上限（3 件）の前後にまたがるドキュメント。
 *
 * - `gray-900`: Text 5 件（上限を超える）
 * - `primary`: Box 3 件（ちょうど上限）
 * - `danger`: 参照なし
 */
const ReferringDocument = DesignDocument.create({
  tokens: {
    ...TokenSet.empty(),
    colors: {
      "gray-900": "#111827",
      primary: "#3b82f6",
      danger: "#ef4444",
    },
  },
  artboards: [
    {
      name: "login",
      width: 375,
      height: 812,
      children: [
        { name: "title", type: "Text", props: { color: "gray-900" } },
        { name: "subtitle", type: "Text", props: { color: "gray-900" } },
        { name: "caption", type: "Text", props: { color: "gray-900" } },
        { name: "note", type: "Text", props: { color: "gray-900" } },
        { name: "footer", type: "Text", props: { color: "gray-900" } },
        {
          name: "panel-a",
          type: "Box",
          props: { background: "primary" },
          children: [],
        },
        {
          name: "panel-b",
          type: "Box",
          props: { background: "primary" },
          children: [],
        },
        {
          name: "panel-c",
          type: "Box",
          props: { background: "primary" },
          children: [],
        },
      ],
    },
  ],
});

test("参照元が上限を超えても行は上限の件数までしか出ない", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "gray-900" });

  expect(screen.queryAllByRole("listitem")).toHaveLength(3);
});

test("上限より後ろの参照元は行に出ない", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "gray-900" });

  expect(screen.queryByText("note.color")).toBeNull();
});

test("参照元が上限を超えると残りの件数が「+ N more」として出る", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "gray-900" });

  expect(screen.getByText("+ 2 more")).toBeDefined();
});

test("参照元が上限を超えても件数は総数のまま出る", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "gray-900" });

  expect(screen.getByTestId("used-by-count").textContent).toBe("5");
});

test("参照元が上限とちょうど同じ件数のときは「+ N more」を出さない", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "primary" });

  expect(screen.queryByText(/more/)).toBeNull();
});

test("参照されていないトークンでは件数が 0 になる", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "danger" });

  expect(screen.getByTestId("used-by-count").textContent).toBe("0");
});

test("参照されていないトークンでは行の枠を出さない", () => {
  renderUsedBy(ReferringDocument, { kind: "colors", name: "danger" });

  /* 行が無いことではなく枠が無いことを見る（行が無いのは入力から自明で、
     枠を出しっぱなしにする実装でも「行が無い」は通ってしまう）。 */
  expect(screen.queryByRole("list")).toBeNull();
});
