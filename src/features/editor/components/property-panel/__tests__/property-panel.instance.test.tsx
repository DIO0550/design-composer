import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import type { ComponentSet } from "@/domains/component";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { type InstanceActions, PropertyPanel } from "../index";

/**
 * インスタンスを選んだときの右ペイン
 * （UI 案 docs/Design Composer.html の `Assets · Instance`）。
 *
 * 見出しの帯（種別・型アイコン）は `property-panel.heading.test.tsx`、
 * 入力欄そのものと編集の反映は `.normal` / `.edit` が見る。ここで見るのは
 * この画面にしか無いもの（出どころ・件数・上書きの注記・インスタンスの操作）。
 */
const Components: ComponentSet = {
  ...DocumentTemplate.Default.components,
  /** 公開 prop 2 件。片方だけ上書きした状態を作るために使う。 */
  "profile-card": {
    publicProps: {
      title: { node: "profile-card-title", prop: "content" },
      body: { node: "profile-card-body", prop: "content" },
    },
    type: "Box",
    children: [
      {
        name: "profile-card-title",
        type: "Text",
        props: { content: "Title" },
      },
      { name: "profile-card-body", type: "Text", props: { content: "Body" } },
    ],
  },
};

function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: Components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-title", type: "Text" },
            {
              name: "home-login",
              ref: "primary-button",
              overrides: { label: "ログイン" },
            },
            {
              name: "home-card",
              ref: "profile-card",
              overrides: { title: "プロフィール" },
            },
            { name: "home-broken", ref: "missing" },
          ],
        },
      ],
    }),
  );
}

function renderPanel(
  state: EditorState,
  instance: InstanceActions = {
    goToSource: vi.fn(),
    selectAllInstances: vi.fn(),
    detach: vi.fn(),
  },
) {
  render(
    <PropertyPanel
      state={state}
      instance={instance}
      onEditProp={vi.fn()}
      onClearSelection={vi.fn()}
    />,
  );
}

test("インスタンスを選ぶと元になっている部品が出る", () => {
  renderPanel(EditorState.select(setupState(), "home-login"));

  expect(screen.getByText("primary-button")).toBeDefined();
});

test("インスタンスを選ぶと公開 prop の件数が出る", () => {
  renderPanel(EditorState.select(setupState(), "home-card"));

  expect(screen.getByText("2")).toBeDefined();
});

test("上書きしている公開 prop には上書き済みであることが出る", () => {
  renderPanel(EditorState.select(setupState(), "home-login"));

  expect(screen.getByText(/overridden/)).toBeDefined();
});

test("上書きしている公開 prop には部品側の既定値が添えて出る", () => {
  renderPanel(EditorState.select(setupState(), "home-login"));

  expect(screen.getByText(/Button/)).toBeDefined();
});

test("上書きしていない公開 prop には上書き済みの注記が出ない", () => {
  /*
   * `profile-card` は公開 prop 2 件のうち `title` だけを上書きしている。
   * 上書きしていない側にも注記を出す実装にすると 2 件になって落ちる。
   */
  renderPanel(EditorState.select(setupState(), "home-card"));

  expect(screen.getAllByText(/overridden/).length).toBe(1);
});

test("インスタンスでは binding 先の group の見出しが出ない", () => {
  renderPanel(EditorState.select(setupState(), "home-login"));

  expect(screen.queryByRole("heading", { name: "Content" })).toBeNull();
});

test("インスタンスでは公開 prop の節の見出しが出る", () => {
  renderPanel(EditorState.select(setupState(), "home-login"));

  expect(screen.getByRole("heading", { name: "Public props" })).toBeDefined();
});

test("元の部品へ移動できる", async () => {
  const goToSource = vi.fn();
  renderPanel(EditorState.select(setupState(), "home-login"), {
    goToSource,
    selectAllInstances: vi.fn(),
    detach: vi.fn(),
  });

  await userEvent.click(
    screen.getByRole("button", { name: "Go to source component" }),
  );

  expect(goToSource).toHaveBeenCalled();
});

test("インスタンスを解除できる", async () => {
  const detach = vi.fn();
  renderPanel(EditorState.select(setupState(), "home-login"), {
    goToSource: vi.fn(),
    selectAllInstances: vi.fn(),
    detach,
  });

  await userEvent.click(
    screen.getByRole("button", { name: "Detach instance" }),
  );

  expect(detach).toHaveBeenCalled();
});

test("存在しない部品を指すインスタンスは解除のボタンを押せない", () => {
  renderPanel(EditorState.select(setupState(), "home-broken"));

  expect(
    screen.getByRole("button", { name: "Detach instance" }),
  ).toHaveProperty("disabled", true);
});

test("部品が引けるインスタンスは解除のボタンを押せる", () => {
  renderPanel(EditorState.select(setupState(), "home-login"));

  expect(
    screen.getByRole("button", { name: "Detach instance" }),
  ).toHaveProperty("disabled", false);
});

test("インスタンス以外を選んでいるときはインスタンスの操作が出ない", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(screen.queryByRole("button", { name: "Detach instance" })).toBeNull();
});

test("インスタンス以外を選んでいるときは group の見出しが出る", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(screen.getByRole("heading", { name: "Content" })).toBeDefined();
});

/**
 * 同じ部品を指すインスタンスが 2 つあるドキュメント。
 *
 * `setupState` を使い回さないのは、あちらの `primary-button` が 1 件しか無く、
 * ボタンが押せる側の見え方を確かめられないため。
 */
function setupMultiInstanceState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: Components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-login", ref: "primary-button" },
            { name: "home-signup", ref: "primary-button" },
            { name: "home-card", ref: "profile-card" },
          ],
        },
      ],
    }),
  );
}

test("インスタンスを選ぶと、同じ部品を指すインスタンスの数がボタンに出る", () => {
  renderPanel(EditorState.select(setupMultiInstanceState(), "home-login"));

  expect(
    screen.getByRole("button", { name: "Select all 2 instances" }),
  ).toBeDefined();
});

test("同じ部品を指すインスタンスが2つ以上あればまとめて選ぶボタンを押せる", () => {
  renderPanel(EditorState.select(setupMultiInstanceState(), "home-login"));

  expect(
    screen.getByRole("button", { name: "Select all 2 instances" }),
  ).toHaveProperty("disabled", false);
});

test("そのインスタンスしか無いときはまとめて選ぶボタンを押せない", () => {
  renderPanel(EditorState.select(setupMultiInstanceState(), "home-card"));

  expect(
    screen.getByRole("button", { name: "Select all 1 instances" }),
  ).toHaveProperty("disabled", true);
});

test("まとめて選ぶボタンを押すとまとめて選ぶ操作が呼ばれる", async () => {
  const selectAllInstances = vi.fn();
  renderPanel(EditorState.select(setupMultiInstanceState(), "home-login"), {
    goToSource: vi.fn(),
    selectAllInstances,
    detach: vi.fn(),
  });

  await userEvent.click(
    screen.getByRole("button", { name: "Select all 2 instances" }),
  );

  expect(selectAllInstances).toHaveBeenCalled();
});

test("数えるのは artboard 配下だけで、部品定義の中の参照は入らない", () => {
  const state = EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: {
        ...Components,
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
            { name: "home-login", ref: "primary-button" },
            { name: "home-signup", ref: "primary-button" },
          ],
        },
      ],
    }),
  );

  renderPanel(EditorState.select(state, "home-login"));

  expect(
    screen.getByRole("button", { name: "Select all 2 instances" }),
  ).toBeDefined();
});
