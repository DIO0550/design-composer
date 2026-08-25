import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [{ name: "title", type: "Text" }],
        },
      ],
    }),
  );
}

/*
 * artboard は削除の対象になった（#43）ので、ここで見るのは「消せない」ではなく
 * **最後の 1 枚まで消せる**こと。0 枚は左ペインが「artboard がありません」を出し、
 * ツリーが何も映さなくなる境界で、消せない側へ倒す実装を入れたくなる場所でもある。
 */
test("最後の1枚の artboard も削除できる", () => {
  const state = EditorState.select(setupState(), "home");

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect(EditorState.document(removed).artboards).toEqual([]);
});

test("何も選んでいないときの削除はドキュメントを変えない", () => {
  expect(EditorState.removeSelected(setupState())).toEqual(Option.none);
});
