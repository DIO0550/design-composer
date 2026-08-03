import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DocumentSyncFailureList } from "../index";

const NOT_FOUND = { kind: "notFound", message: "/work/login.dcmp" } as const;
const PERMISSION_DENIED = {
  kind: "permissionDenied",
  message: "/work/login.dcmp",
} as const;

test("同期が失敗していないときは何も出さない", () => {
  render(
    <DocumentSyncFailureList autoSave={Option.none} watch={Option.none} />,
  );

  expect(screen.queryByRole("alert")).toBeNull();
});

test("自動保存が失敗すると、書き出せていないことが伝わる", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.some(PERMISSION_DENIED)}
      watch={Option.none}
    />,
  );

  expect(screen.getByText("自動保存に失敗しました")).toBeDefined();
});

test("監視が失敗すると、外部の変更を追えていないことが伝わる", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.none}
      watch={Option.some(NOT_FOUND)}
    />,
  );

  expect(screen.getByText("外部変更の監視に失敗しました")).toBeDefined();
});

test("両方が失敗すると、2 つとも並んで出る", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.some(PERMISSION_DENIED)}
      watch={Option.some(NOT_FOUND)}
    />,
  );

  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

test("失敗の原因が分かるよう、診断用のメッセージも添えられる", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.some(PERMISSION_DENIED)}
      watch={Option.none}
    />,
  );

  expect(screen.getByText("/work/login.dcmp")).toBeDefined();
});
