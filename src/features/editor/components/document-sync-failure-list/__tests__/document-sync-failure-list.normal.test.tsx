import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DocumentSyncFailureList } from "../index";

const NotFound = { kind: "notFound", message: "/work/login.dcmp" } as const;
const PermissionDenied = {
  kind: "permissionDenied",
  message: "/work/login.dcmp",
} as const;

test("同期が失敗していないときは何も出さない", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.none}
      watch={Option.none}
      revert={Option.none}
    />,
  );

  expect(screen.queryByRole("alert")).toBeNull();
});

test("自動保存が失敗すると、書き出せていないことが伝わる", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.some(PermissionDenied)}
      watch={Option.none}
      revert={Option.none}
    />,
  );

  expect(screen.getByText("自動保存に失敗しました")).toBeDefined();
});

test("監視が失敗すると、外部の変更を追えていないことが伝わる", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.none}
      watch={Option.some(NotFound)}
      revert={Option.none}
    />,
  );

  expect(screen.getByText("外部変更の監視に失敗しました")).toBeDefined();
});

test("両方が失敗すると、2 つとも並んで出る", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.some(PermissionDenied)}
      watch={Option.some(NotFound)}
      revert={Option.none}
    />,
  );

  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

test("ファイルへの書き戻しが失敗すると、戻せていないことが伝わる", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.none}
      watch={Option.none}
      revert={Option.some(PermissionDenied)}
    />,
  );

  expect(screen.getByText("ファイルへの書き戻しに失敗しました")).toBeDefined();
});

test("3 つの同期の失敗は、同期が起きる順に並ぶ", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.some(PermissionDenied)}
      watch={Option.some(NotFound)}
      revert={Option.some(PermissionDenied)}
    />,
  );

  expect(
    screen
      .getAllByRole("listitem")
      .map((item) => item.firstElementChild?.textContent),
  ).toStrictEqual([
    "自動保存に失敗しました",
    "外部変更の監視に失敗しました",
    "ファイルへの書き戻しに失敗しました",
  ]);
});

test("失敗の原因が分かるよう、診断用のメッセージも添えられる", () => {
  render(
    <DocumentSyncFailureList
      autoSave={Option.some(PermissionDenied)}
      watch={Option.none}
      revert={Option.none}
    />,
  );

  expect(screen.getByText("/work/login.dcmp")).toBeDefined();
});
