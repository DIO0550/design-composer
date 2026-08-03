import { expect, test } from "vitest";
import { artboardDocument } from "@/features/editor/__tests__/sample-document";
import { Option } from "@/utils/Option";
import { DocumentSession } from "../index";

const PATH = "/work/login.dcmp";

test("何も開いていない間は、開いているファイルが無い", () => {
  expect(DocumentSession.openedPath(DocumentSession.CLOSED)).toStrictEqual(
    Option.none,
  );
});

test("ドキュメントを開くと、そのファイルのパスを答える", () => {
  const session = DocumentSession.opened({
    path: PATH,
    document: artboardDocument("home"),
  });

  expect(DocumentSession.openedPath(session)).toStrictEqual(Option.some(PATH));
});

test("開く操作の最中は、次の操作を受け付けない状態になる", () => {
  expect(DocumentSession.isOpening(DocumentSession.OPENING)).toBe(true);
});

test("開けずに終わった後は、次の操作を受け付ける状態に戻る", () => {
  const session = DocumentSession.failed({
    kind: "dialog",
    error: { message: "dialog.open not allowed" },
  });

  expect(DocumentSession.isOpening(session)).toBe(false);
});
