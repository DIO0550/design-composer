import { expect, test } from "vitest";
import { openedAt } from "@/domains/__tests__/sample-document";
import { OpenedDocuments } from "@/domains/session/opened-documents";
import { Option } from "@/utils/Option";
import {
  FirstPath,
  SecondPath,
  ThirdPath,
  threeOpenedWithMiddleActive,
  UnopenedPath,
} from "./setup";

test("見ているドキュメントを閉じると、後ろの先頭へ移る", () => {
  const opened = threeOpenedWithMiddleActive();

  expect(
    Option.unwrap(OpenedDocuments.close(opened, SecondPath)),
  ).toStrictEqual({
    before: [openedAt(FirstPath)],
    active: openedAt(ThirdPath),
    after: [],
  });
});

test("後ろが無いドキュメントを見ているときに閉じると、前の末尾へ移る", () => {
  const opened = OpenedDocuments.open(
    OpenedDocuments.create(openedAt(FirstPath)),
    openedAt(SecondPath),
  );

  expect(
    Option.unwrap(OpenedDocuments.close(opened, SecondPath)),
  ).toStrictEqual({
    before: [],
    active: openedAt(FirstPath),
    after: [],
  });
});

test("最後の 1 つを閉じると、開いているドキュメントが無くなる", () => {
  const opened = OpenedDocuments.create(openedAt(FirstPath));

  expect(OpenedDocuments.close(opened, FirstPath)).toStrictEqual(Option.none);
});

test("開いていないパスを閉じても、並びは変わらない", () => {
  const opened = threeOpenedWithMiddleActive();

  expect(
    Option.unwrap(OpenedDocuments.close(opened, UnopenedPath)),
  ).toStrictEqual(opened);
});

test("開いていないパスへは移せず、並びは変わらない", () => {
  const opened = threeOpenedWithMiddleActive();

  expect(OpenedDocuments.activate(opened, UnopenedPath)).toStrictEqual(opened);
});
