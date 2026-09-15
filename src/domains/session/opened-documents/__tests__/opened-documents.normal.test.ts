import { expect, test } from "vitest";
import { openedAt } from "@/domains/__tests__/sample-document";
import { OpenedDocuments } from "@/domains/session/opened-documents";
import { Option } from "@/utils/Option";
import {
  FirstPath,
  SecondPath,
  ThirdPath,
  threeOpenedWithMiddleActive,
} from "./setup";

test("1 つだけ開いた並びは、そのドキュメントを見ている状態になる", () => {
  const opened = OpenedDocuments.create(openedAt(FirstPath));

  expect(opened).toStrictEqual({
    before: [],
    active: openedAt(FirstPath),
    after: [],
  });
});

test("開いたドキュメントは並びの末尾に付き、それを見ている状態になる", () => {
  const opened = OpenedDocuments.open(
    OpenedDocuments.create(openedAt(FirstPath)),
    openedAt(SecondPath),
  );

  expect(opened).toStrictEqual({
    before: [openedAt(FirstPath)],
    active: openedAt(SecondPath),
    after: [],
  });
});

test("並びは開いた順に読める", () => {
  const opened = threeOpenedWithMiddleActive();

  expect(OpenedDocuments.documents(opened)).toStrictEqual([
    openedAt(FirstPath),
    openedAt(SecondPath),
    openedAt(ThirdPath),
  ]);
});

test("既に開いているパスを開き直すと、並びは増えずにそちらへ移る", () => {
  const opened = OpenedDocuments.open(
    OpenedDocuments.open(
      OpenedDocuments.create(openedAt(FirstPath)),
      openedAt(SecondPath),
    ),
    openedAt(FirstPath),
  );

  expect(OpenedDocuments.documents(opened)).toHaveLength(2);
  expect(OpenedDocuments.activePath(opened)).toBe(FirstPath);
});

test("開いているパスかどうかを答える", () => {
  const opened = OpenedDocuments.create(openedAt(FirstPath));

  expect(OpenedDocuments.has(opened, FirstPath)).toBe(true);
  expect(OpenedDocuments.has(opened, SecondPath)).toBe(false);
});

test("前に並んでいるドキュメントへ移せる", () => {
  const opened = threeOpenedWithMiddleActive();

  expect(OpenedDocuments.activate(opened, FirstPath)).toStrictEqual({
    before: [],
    active: openedAt(FirstPath),
    after: [openedAt(SecondPath), openedAt(ThirdPath)],
  });
});

test("後ろに並んでいるドキュメントへ移せる", () => {
  const opened = threeOpenedWithMiddleActive();

  expect(OpenedDocuments.activate(opened, ThirdPath)).toStrictEqual({
    before: [openedAt(FirstPath), openedAt(SecondPath)],
    active: openedAt(ThirdPath),
    after: [],
  });
});

test("前に並んでいるドキュメントを閉じても、見ている先は変わらない", () => {
  const opened = threeOpenedWithMiddleActive();

  expect(Option.unwrap(OpenedDocuments.close(opened, FirstPath))).toStrictEqual(
    {
      before: [],
      active: openedAt(SecondPath),
      after: [openedAt(ThirdPath)],
    },
  );
});

test("後ろに並んでいるドキュメントを閉じても、見ている先は変わらない", () => {
  const opened = threeOpenedWithMiddleActive();

  expect(Option.unwrap(OpenedDocuments.close(opened, ThirdPath))).toStrictEqual(
    {
      before: [openedAt(FirstPath)],
      active: openedAt(SecondPath),
      after: [],
    },
  );
});

test("見ているドキュメントへ移しても、並びは変わらない", () => {
  const opened = threeOpenedWithMiddleActive();

  expect(OpenedDocuments.activate(opened, SecondPath)).toStrictEqual(opened);
});
