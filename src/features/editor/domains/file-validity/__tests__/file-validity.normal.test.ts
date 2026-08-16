import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Instant } from "@/domains/instant";
import { DocumentSyntaxError } from "@/features/editor/__tests__/document-errors";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { Option } from "@/utils/Option";
import { FileValidity } from "../index";

/** 拒む理由が 1 度目と 2 度目で変わったことを見るための、もう 1 つのエラー。 */
const DanglingTokenError: DocumentError = {
  kind: "dangling-ref",
  message: "typography 'heading' は存在しない",
  location: { kind: "node", nodeName: "home-title", prop: "typography" },
};

/** 取り込めた内容。中身はこの観点に関係しないので空のドキュメントで足りる。 */
const Reloaded = {
  kind: "reloaded",
  document: DesignDocument.create({ artboards: [] }),
} as const;

const FirstAt = Instant.create(1_700_000_000_000);
const SecondAt = Instant.create(1_700_000_030_000);

test("取り込めた内容を反映すると妥当な状態になる", () => {
  const validity = FileValidity.withReload(
    FileValidity.valid,
    Reloaded,
    FirstAt,
  );

  expect(validity.kind).toBe("valid");
});

test("拒んだ内容を反映すると、その理由がエラー一覧になる", () => {
  const validity = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [DocumentSyntaxError] },
    FirstAt,
  );

  expect(validity).toStrictEqual({
    kind: "invalid",
    errors: [DocumentSyntaxError],
    since: FirstAt,
  });
});

test("拒んだ内容を反映すると、受け取った時刻が食い違いの起点になる", () => {
  const validity = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [DocumentSyntaxError] },
    FirstAt,
  );

  expect(FileValidity.since(validity)).toStrictEqual(Option.some(FirstAt));
});

test("不正なまま別の理由で拒み直しても、食い違いの起点は最初のままになる", () => {
  const first = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [DocumentSyntaxError] },
    FirstAt,
  );

  const second = FileValidity.withReload(
    first,
    { kind: "rejected", errors: [DanglingTokenError] },
    SecondAt,
  );

  expect(FileValidity.since(second)).toStrictEqual(Option.some(FirstAt));
});

test("不正なまま拒み直すと、エラー一覧は新しい理由に入れ替わる", () => {
  const first = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [DocumentSyntaxError] },
    FirstAt,
  );

  const second = FileValidity.withReload(
    first,
    { kind: "rejected", errors: [DanglingTokenError] },
    SecondAt,
  );

  expect(second).toStrictEqual({
    kind: "invalid",
    errors: [DanglingTokenError],
    since: FirstAt,
  });
});

test("不正な状態から取り込めた内容を反映すると食い違いの起点は消える", () => {
  const rejected = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [DocumentSyntaxError] },
    FirstAt,
  );

  const validity = FileValidity.withReload(rejected, Reloaded, SecondAt);

  expect(FileValidity.since(validity).some).toBe(false);
});

test("一度直ってから再び壊れると、食い違いの起点は新しい時刻になる", () => {
  const rejected = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [DocumentSyntaxError] },
    FirstAt,
  );
  const fixed = FileValidity.withReload(rejected, Reloaded, SecondAt);

  const brokenAgain = FileValidity.withReload(
    fixed,
    { kind: "rejected", errors: [DocumentSyntaxError] },
    SecondAt,
  );

  expect(FileValidity.since(brokenAgain)).toStrictEqual(Option.some(SecondAt));
});

test("妥当な状態は拒んだ理由も起点も持たない", () => {
  expect(FileValidity.valid).toStrictEqual({ kind: "valid" });
});
