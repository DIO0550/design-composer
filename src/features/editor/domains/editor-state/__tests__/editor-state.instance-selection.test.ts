import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * 同じ部品を指すインスタンスをまとめて選ぶ
 * （UI 案 docs/Design Composer.html の `Select all N instances`）。
 *
 * artboard を 2 枚置くのは、まとめた選択が 1 枚に閉じないことを確かめるため。
 * 部品定義の中にも `primary-button` を指すノードを 1 つ足してあり、
 * これが選択に入らないことが「集めるのは artboard 配下だけ」の対照になる。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: {
        ...DocumentTemplate.Default.components,
        // 部品定義の中のインスタンス。キャンバスには描かれるが選択の対象にならない
        "login-card": {
          type: "Box",
          children: [{ name: "login-card-action", ref: "primary-button" }],
        },
      },
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-title", type: "Text" },
            { name: "home-login", ref: "primary-button" },
            { name: "home-cancel", ref: "secondary-button" },
          ],
        },
        {
          name: "settings",
          width: 360,
          height: 240,
          children: [
            { name: "settings-login", ref: "primary-button" },
            { name: "settings-broken", ref: "missing" },
          ],
        },
      ],
    }),
  );
}

test("インスタンスを選んでまとめて選ぶと、同じ部品を指すインスタンスがすべて選ばれる", () => {
  const selected = EditorState.select(setupState(), "home-login");

  const all = Option.unwrap(EditorState.selectAllInstances(selected));

  expect(EditorState.selectedNames(all)).toEqual([
    "home-login",
    "settings-login",
  ]);
});

test("まとめて選んだ結果には、部品定義の中にある同じ部品のインスタンスは入らない", () => {
  const selected = EditorState.select(setupState(), "home-login");

  const all = Option.unwrap(EditorState.selectAllInstances(selected));

  expect(EditorState.selectedNames(all)).not.toContain("login-card-action");
});

test("同じ部品のインスタンスが1つしか無いときにまとめて選ぶと単一選択のままになる", () => {
  const selected = EditorState.select(setupState(), "home-cancel");

  const all = Option.unwrap(EditorState.selectAllInstances(selected));

  expect(EditorState.singleName(all)).toEqual(Option.some("home-cancel"));
});

test("インスタンス以外を選んでいるときはまとめて選べない", () => {
  const selected = EditorState.select(setupState(), "home-title");

  expect(EditorState.selectAllInstances(selected).some).toBe(false);
});

test("何も選んでいないときはまとめて選べない", () => {
  expect(EditorState.selectAllInstances(setupState()).some).toBe(false);
});

test("参照先の部品が無いインスタンスでも、同じ参照を持つものをまとめて選べる", () => {
  const selected = EditorState.select(setupState(), "settings-broken");

  const all = Option.unwrap(EditorState.selectAllInstances(selected));

  expect(EditorState.selectedNames(all)).toEqual(["settings-broken"]);
});

/*
 * 選択そのものから決まる出どころ（インスタンスなら読める / インスタンス以外なら無い）は
 * 対の側（`document-selection.source-name.test.ts`）が持つ。ここで見るのは
 * まとめて選ぶ操作を通しても答えが変わらないこと。
 */
test("まとめて選んだあとも元の部品の名前は Assets 側へ渡り続ける", () => {
  const selected = EditorState.select(setupState(), "home-login");

  const all = Option.unwrap(EditorState.selectAllInstances(selected));

  expect(EditorState.sourceName(all)).toEqual(Option.some("primary-button"));
});

test("まとめて選ぶと、その部品を載せていない artboard からもインスタンスが選ばれる", () => {
  // 2 枚目の配下を起点にする（1 枚目を起点にすると「先頭の artboard だけ見る」実装でも通る）
  const selected = EditorState.select(setupState(), "settings-login");

  const all = Option.unwrap(EditorState.selectAllInstances(selected));

  expect(EditorState.selectedNames(all)).toContain("home-login");
});

test("複数選んでいるとき、ツリーが映すのは選択の先頭が載っている artboard になる", () => {
  // 2 枚目を起点にする。先頭の artboard へ落ちる実装と区別が付かなくなるため
  const selected = EditorState.select(setupState(), "settings-login");
  const all = Option.unwrap(EditorState.selectAllInstances(selected));

  // 選択の並びは collectInstanceNames の順（home-login が先頭）
  expect(EditorState.selectedNames(all)[0]).toBe("home-login");
  expect(Option.unwrap(EditorState.currentArtboard(all)).name).toBe("home");
});

test("複数選んでいても、選択に含まれない artboard は映さない", () => {
  const selected = EditorState.select(setupState(), "home-login");
  const all = Option.unwrap(EditorState.selectAllInstances(selected));

  expect(Option.unwrap(EditorState.currentArtboard(all)).name).not.toBe(
    "settings",
  );
});
