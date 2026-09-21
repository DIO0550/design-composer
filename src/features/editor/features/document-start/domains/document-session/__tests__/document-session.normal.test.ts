import { expect, test } from "vitest";
import { openedAt } from "@/domains/__tests__/sample-document";
import { Option } from "@/utils/Option";
import { DocumentSession } from "../index";

const Path = "/work/login.dcmp";
const OtherPath = "/work/settings.dcmp";

/** ダイアログを出せなかったことにする理由。中身はこのテストでは問わない。 */
const DialogFailure = {
  kind: "dialog",
  error: { message: "dialog.open not allowed" },
} as const;

/**
 * 読めたドキュメントだけを渡す結末。
 *
 * @param paths 読めたファイルのパス
 * @returns 失敗を伴わない結末
 */
function opened(...paths: readonly string[]) {
  return { documents: paths.map(openedAt), failure: Option.none };
}

test("何も開いていない間は、見ているドキュメントが無い", () => {
  expect(DocumentSession.activePath(DocumentSession.Closed)).toStrictEqual(
    Option.none,
  );
});

test("ドキュメントを開くと、そのファイルを見ている状態になる", () => {
  const session = DocumentSession.finishOpening(
    DocumentSession.Closed,
    opened(Path),
  );

  expect(DocumentSession.activePath(session)).toStrictEqual(Option.some(Path));
});

test("一度に複数を開くと、すべて開いて最後のものを見る", () => {
  const session = DocumentSession.finishOpening(
    DocumentSession.Closed,
    opened(Path, OtherPath),
  );

  expect(DocumentSession.activePath(session)).toStrictEqual(
    Option.some(OtherPath),
  );
});

test("開く操作の最中は、次の操作を受け付けない状態になる", () => {
  expect(
    DocumentSession.isOpening(
      DocumentSession.beginOpening(DocumentSession.Closed),
    ),
  ).toBe(true);
});

test("開けずに終わった後は、次の操作を受け付ける状態に戻る", () => {
  const session = DocumentSession.finishOpening(
    DocumentSession.beginOpening(DocumentSession.Closed),
    { documents: [], failure: Option.some(DialogFailure) },
  );

  expect(DocumentSession.isOpening(session)).toBe(false);
  expect(DocumentSession.failure(session)).toStrictEqual(
    Option.some(DialogFailure),
  );
});

test("開けなかったときも、既に開いているドキュメントは閉じない", () => {
  const opening = DocumentSession.beginOpening(
    DocumentSession.finishOpening(DocumentSession.Closed, opened(Path)),
  );

  const session = DocumentSession.finishOpening(opening, {
    documents: [],
    failure: Option.some(DialogFailure),
  });

  expect(DocumentSession.activePath(session)).toStrictEqual(Option.some(Path));
});

test("一部だけ読めたときは、読めた分を開いてその失敗も残す", () => {
  const session = DocumentSession.finishOpening(DocumentSession.Closed, {
    documents: [openedAt(Path)],
    failure: Option.some(DialogFailure),
  });

  expect(DocumentSession.activePath(session)).toStrictEqual(Option.some(Path));
  expect(DocumentSession.failure(session)).toStrictEqual(
    Option.some(DialogFailure),
  );
});

test("何も開かずに終わると、直前の失敗も消える", () => {
  const failed = DocumentSession.finishOpening(DocumentSession.Closed, {
    documents: [],
    failure: Option.some(DialogFailure),
  });

  const session = DocumentSession.finishOpening(failed, {
    documents: [],
    failure: Option.none,
  });

  expect(DocumentSession.failure(session)).toStrictEqual(Option.none);
});

test("最後のドキュメントを閉じると、何も開いていない状態へ戻る", () => {
  const session = DocumentSession.finishOpening(
    DocumentSession.Closed,
    opened(Path),
  );

  expect(
    DocumentSession.activePath(DocumentSession.close(session, Path)),
  ).toStrictEqual(Option.none);
});

test("見ている先を別の開いているドキュメントへ移せる", () => {
  const session = DocumentSession.finishOpening(
    DocumentSession.Closed,
    opened(Path, OtherPath),
  );

  expect(
    DocumentSession.activePath(DocumentSession.activate(session, Path)),
  ).toStrictEqual(Option.some(Path));
});

test("開けなかった後に開けると、直前の失敗は消える", () => {
  const failed = DocumentSession.finishOpening(DocumentSession.Closed, {
    documents: [],
    failure: Option.some(DialogFailure),
  });

  const session = DocumentSession.finishOpening(failed, opened(Path));

  expect(DocumentSession.failure(session)).toStrictEqual(Option.none);
});

test("何も開いていない間は、まだ何も起きていない状態になる", () => {
  expect(DocumentSession.isClosed(DocumentSession.Closed)).toBe(true);
});

test("開く操作を始めた後は、まだ何も起きていない状態ではなくなる", () => {
  const session = DocumentSession.beginOpening(DocumentSession.Closed);

  expect(DocumentSession.isClosed(session)).toBe(false);
});

test("開けずに終わった後は、まだ何も起きていない状態ではなくなる", () => {
  const session = DocumentSession.finishOpening(DocumentSession.Closed, {
    documents: [],
    failure: Option.some(DialogFailure),
  });

  expect(DocumentSession.isClosed(session)).toBe(false);
});

test("ドキュメントを開いた後は、まだ何も起きていない状態ではなくなる", () => {
  const session = DocumentSession.finishOpening(
    DocumentSession.Closed,
    opened(Path),
  );

  expect(DocumentSession.isClosed(session)).toBe(false);
});
