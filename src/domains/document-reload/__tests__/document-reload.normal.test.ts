import { expect, test } from "vitest";
import { DocumentReload } from "../index";
import { artboardContent, artboardDocument } from "./setup";

test("仕様どおりの内容は、そのままのドキュメントとして取り込まれる", () => {
  const reload = DocumentReload.fromContent(artboardContent("home"));

  // JSON を経由すると省略可能なキーが落ちるため、キーの有無ではなく値で比べる。
  expect(reload).toEqual({
    kind: "reloaded",
    document: artboardDocument("home"),
  });
});

test("不正な内容の次に正しい内容が来ると、取り込めるようになる", () => {
  const rejected = DocumentReload.fromContent("{");
  const reload = DocumentReload.fromContent(artboardContent("home"));

  expect(rejected.kind).toBe("rejected");
  expect(reload.kind).toBe("reloaded");
});
