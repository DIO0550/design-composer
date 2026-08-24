import { expect, test } from "vitest";
import { SampleSyntaxError } from "@/domains/__tests__/document-errors";
import { ReceivedAt } from "@/domains/__tests__/instants";
import { EditorState } from "../index";
import { stateWithComponentDefinitions } from "./setup";

test("ファイルへ書き戻すと、ファイル由来のエラーは無くなる", () => {
  const rejected = EditorState.applyReload(
    stateWithComponentDefinitions(),
    {
      kind: "rejected",
      errors: [SampleSyntaxError],
    },
    ReceivedAt,
  );

  const reverted = EditorState.applyRevert(rejected);

  expect(reverted.fileValidity.kind).toBe("valid");
});

test("ファイルへ書き戻しても、表示中のドキュメントは戻らない", () => {
  const rejected = EditorState.applyReload(
    stateWithComponentDefinitions(),
    {
      kind: "rejected",
      errors: [SampleSyntaxError],
    },
    ReceivedAt,
  );

  const reverted = EditorState.applyRevert(rejected);

  // 履歴が伸びていないことを、undo で戻る先が無いことで見る
  expect(EditorState.undo(reverted).some).toBe(false);
});
