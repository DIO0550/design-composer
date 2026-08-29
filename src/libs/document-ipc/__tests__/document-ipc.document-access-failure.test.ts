import { expect, expectTypeOf, test } from "vitest";
import type {
  DocumentAccessFailure,
  DocumentAccessFailureReason,
} from "@/domains/session/document-access-failure";
import {
  type DocumentIpcError,
  type DocumentIpcErrorKind,
  toDocumentAccessFailure,
} from "@/libs/document-ipc";

/**
 * 外の語彙と、寄せ先のドメインの語彙の対応。
 *
 * 両辺とも定数を参照せず綴りをそのまま書くのは、**どちらの綴りも固定するため**。
 * 定数で書くと両辺が一緒に動くので、ドメインの語彙を外の綴りへ戻しても落ちない
 * （それはこの差分が却下した案そのもの）。入力側に定数が無いのは、`DocumentIpcErrorKind`
 * が型だけで値の並びを持たないため。
 */
const Correspondences: readonly (readonly [
  DocumentIpcErrorKind,
  DocumentAccessFailureReason,
])[] = [
  ["notFound", "missing"],
  ["permissionDenied", "notPermitted"],
  ["invalidPath", "unusablePath"],
  ["invalidUtf8", "undecodableText"],
  ["io", "storageFailed"],
  ["ipcFailed", "undelivered"],
];

test.for(
  Correspondences,
)("外の失敗 %s は、ドメインの語彙 %s として読み直される", ([kind, reason]) => {
  expect(
    toDocumentAccessFailure({ kind, message: "/work/login.dcmp" }),
  ).toEqual({
    reason,
    message: "/work/login.dcmp",
  });
});

test("診断用の原文は、詰め替えても書き換えられずに残る", () => {
  const failure = toDocumentAccessFailure({
    kind: "io",
    message: "/work/login.dcmp: 書き込みに失敗した",
  });

  expect(failure.message).toBe("/work/login.dcmp: 書き込みに失敗した");
});

test("外の失敗は、そのままではドメインの失敗として渡せない", () => {
  // 詰め替えを飛ばして渡せてしまうと境界が成立しないので、型で弾かれることを固定する
  // （フィールド名まで `kind` へ戻すと、ここが落ちる。値の綴りだけを戻した場合に
  // 落ちるのは上の対応表のほう）。
  expectTypeOf<DocumentIpcError>().not.toExtend<DocumentAccessFailure>();
  expectTypeOf<DocumentAccessFailure>().not.toExtend<DocumentIpcError>();
});
