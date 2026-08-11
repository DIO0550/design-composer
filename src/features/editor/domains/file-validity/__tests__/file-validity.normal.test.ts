import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Instant } from "@/domains/instant";
import { SYNTAX_ERROR } from "@/features/editor/__tests__/document-errors";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { Option } from "@/utils/Option";
import { FileValidity } from "../index";

/** 拒む理由が 1 度目と 2 度目で変わったことを見るための、もう 1 つのエラー。 */
const DANGLING_TOKEN_ERROR: DocumentError = {
  kind: "dangling-ref",
  message: "typography 'heading' は存在しない",
  location: { kind: "node", nodeName: "home-title", prop: "typography" },
};

/** 取り込めた内容。中身はこの観点に関係しないので空のドキュメントで足りる。 */
const RELOADED = {
  kind: "reloaded",
  document: DesignDocument.create({ artboards: [] }),
} as const;

const FIRST_AT = Instant.create(1_700_000_000_000);
const SECOND_AT = Instant.create(1_700_000_030_000);

test("取り込めた内容を反映すると妥当な状態になる", () => {
  const validity = FileValidity.withReload(
    FileValidity.valid,
    RELOADED,
    FIRST_AT,
  );

  expect(validity.kind).toBe("valid");
});

test("拒んだ内容を反映すると、その理由がエラー一覧になる", () => {
  const validity = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    FIRST_AT,
  );

  expect(FileValidity.errors(validity)).toStrictEqual([SYNTAX_ERROR]);
});

test("拒んだ内容を反映すると、受け取った時刻が食い違いの起点になる", () => {
  const validity = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    FIRST_AT,
  );

  expect(FileValidity.since(validity)).toStrictEqual(Option.some(FIRST_AT));
});

test("不正なまま別の理由で拒み直しても、食い違いの起点は最初のままになる", () => {
  const first = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    FIRST_AT,
  );

  const second = FileValidity.withReload(
    first,
    { kind: "rejected", errors: [DANGLING_TOKEN_ERROR] },
    SECOND_AT,
  );

  expect(FileValidity.since(second)).toStrictEqual(Option.some(FIRST_AT));
});

test("不正なまま拒み直すと、エラー一覧は新しい理由に入れ替わる", () => {
  const first = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    FIRST_AT,
  );

  const second = FileValidity.withReload(
    first,
    { kind: "rejected", errors: [DANGLING_TOKEN_ERROR] },
    SECOND_AT,
  );

  expect(FileValidity.errors(second)).toStrictEqual([DANGLING_TOKEN_ERROR]);
});

test("不正な状態から取り込めた内容を反映すると食い違いの起点は消える", () => {
  const rejected = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    FIRST_AT,
  );

  const validity = FileValidity.withReload(rejected, RELOADED, SECOND_AT);

  expect(FileValidity.since(validity).some).toBe(false);
});

test("一度直ってから再び壊れると、食い違いの起点は新しい時刻になる", () => {
  const rejected = FileValidity.withReload(
    FileValidity.valid,
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    FIRST_AT,
  );
  const fixed = FileValidity.withReload(rejected, RELOADED, SECOND_AT);

  const brokenAgain = FileValidity.withReload(
    fixed,
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    SECOND_AT,
  );

  expect(FileValidity.since(brokenAgain)).toStrictEqual(Option.some(SECOND_AT));
});

test("妥当な状態ではエラー一覧は空になる", () => {
  expect(FileValidity.errors(FileValidity.valid)).toStrictEqual([]);
});
