import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import { TokenList } from "@/features/editor/components/token-list";
import { useTokenActions } from "@/features/editor/hooks/use-token-actions";
import { TokenEditor } from "../index";

const DOCUMENT = DesignDocument.create({
  tokens: {
    colors: { primary: "#3b82f6", danger: "#ef4444" },
    spacing: { lg: 24 },
    radius: {},
    shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
    typography: { body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 } },
  },
  artboards: [
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        { name: "home-body", type: "Box", props: { background: "primary" } },
      ],
    },
  ],
});

/**
 * 一覧と編集欄を、reducer と domains の実物を通して繋いだもの。
 * トークンの選択は一覧からしか作れないので、両方を並べて操作する。
 *
 * 配線は本番と同じ `useTokenActions` を通す。ここで dispatch を手で書くと、
 * 画面が実際に使っている配線を通らないテストになる。
 */
function TokenPanes() {
  const { state } = useEditor();
  const token = useTokenActions();

  return (
    <>
      <TokenList
        state={state}
        onSelectToken={token.select}
        onAddToken={token.add}
      />
      <TokenEditor
        state={state}
        onSetTokenValue={token.setValue}
        onRenameToken={token.rename}
        onRemoveToken={token.remove}
      />
    </>
  );
}

function renderPanes() {
  render(
    <EditorProvider initialDocument={DOCUMENT}>
      <TokenPanes />
    </EditorProvider>,
  );
  return userEvent.setup();
}

/** 名前の入力欄。値の入力欄と同じ役割なのでラベルで引き分ける。 */
function nameField(): HTMLInputElement {
  return screen.getByLabelText("名前");
}

test("トークンを選ぶまで編集欄は出ない", () => {
  renderPanes();

  expect(screen.getByText("トークンが選択されていません")).toBeDefined();
});

test("色の行を選ぶとカラーピッカーと名前が出る", async () => {
  const user = renderPanes();

  await user.click(screen.getByRole("button", { name: /primary/ }));

  expect(screen.getByLabelText("値")).toHaveProperty("value", "#3b82f6");
  expect(nameField()).toHaveProperty("value", "primary");
});

test("カラーピッカーで色を変えると一覧の値も変わる", async () => {
  const user = renderPanes();
  await user.click(screen.getByRole("button", { name: /primary/ }));

  /*
   * カラーピッカーは打鍵ではなく色の確定で値が届くので、変更イベントを直接起こす
   * （`userEvent.type` は `input[type=color]` に文字を入れられない）。
   */
  fireEvent.change(screen.getByLabelText("値"), {
    target: { value: "#00ff00" },
  });

  expect(screen.getByRole("button", { name: "primary #00ff00" })).toBeDefined();
});

test("長さを打って確定すると px 付きで一覧に出る", async () => {
  const user = renderPanes();
  await user.click(screen.getByRole("button", { name: /^spacing 1$/ }));
  await user.click(screen.getByRole("button", { name: /lg/ }));

  await user.clear(screen.getByLabelText("値"));
  await user.type(screen.getByLabelText("値"), "32");
  await user.tab();

  expect(screen.getByText("32px")).toBeDefined();
});

test("名前を打って確定すると一覧の名前が変わり、選択は残る", async () => {
  const user = renderPanes();
  await user.click(screen.getByRole("button", { name: /primary/ }));

  await user.clear(nameField());
  await user.type(nameField(), "brand-color");
  await user.tab();

  expect(
    screen
      .getByRole("button", { name: /brand-color/ })
      .getAttribute("aria-current"),
  ).toBe("true");
});

test("ハイフンを含む名前へ改名できる", async () => {
  const user = renderPanes();
  await user.click(screen.getByRole("button", { name: /primary/ }));

  await user.clear(nameField());
  await user.type(nameField(), "brand-primary-strong");
  await user.tab();

  expect(nameField()).toHaveProperty("value", "brand-primary-strong");
});

test("同じ種別に既にある名前へは改名されない", async () => {
  const user = renderPanes();
  await user.click(screen.getByRole("button", { name: /primary/ }));

  await user.clear(nameField());
  await user.type(nameField(), "danger");
  await user.tab();

  expect(
    screen
      .getByRole("button", { name: /^primary/ })
      .getAttribute("aria-current"),
  ).toBe("true");
});

test("追加ボタンを押すとトークンが増えてそのまま編集できる", async () => {
  const user = renderPanes();

  await user.click(
    screen.getByRole("button", { name: "colors にトークンを追加" }),
  );

  expect(screen.getByRole("button", { name: /^colors 3$/ })).toBeDefined();
  expect(nameField()).toHaveProperty("value", "color");
});

test("削除すると一覧から消えて編集欄も閉じる", async () => {
  const user = renderPanes();
  await user.click(screen.getByRole("button", { name: /primary/ }));

  await user.click(screen.getByRole("button", { name: "Delete token" }));

  expect(screen.getByRole("button", { name: /^colors 1$/ })).toBeDefined();
  expect(screen.getByText("トークンが選択されていません")).toBeDefined();
});

test("使用中のトークンでも削除できる", async () => {
  const user = renderPanes();
  await user.click(screen.getByRole("button", { name: /primary/ }));

  await user.click(screen.getByRole("button", { name: "Delete token" }));

  expect(screen.queryByText("primary")).toBeNull();
});

/** 一覧で種別の節を開いてから、その中のトークンを選ぶ。 */
async function selectToken(
  user: ReturnType<typeof renderPanes>,
  kind: string,
  name: string,
) {
  await user.click(
    screen.getByRole("button", { name: new RegExp(`^${kind}`) }),
  );
  await user.click(screen.getByRole("button", { name: new RegExp(name) }));
}

test("影のぼかしを打って確定すると一覧の値が変わる", async () => {
  const user = renderPanes();
  await selectToken(user, "shadows", "sm");

  await user.clear(screen.getByLabelText("ぼかし"));
  await user.type(screen.getByLabelText("ぼかし"), "8");
  await user.tab();

  expect(screen.getByText("0px 1px 8px 0px #0000001a")).toBeDefined();
});

test("影の広がりだけを打っても他のフィールドの表示は変わらない", async () => {
  const user = renderPanes();
  await selectToken(user, "shadows", "sm");

  await user.clear(screen.getByLabelText("広がり"));
  await user.type(screen.getByLabelText("広がり"), "2");
  await user.tab();

  expect(screen.getByLabelText("ぼかし")).toHaveProperty("value", "3");
});

test("書体のサイズを打って確定すると一覧の値が変わる", async () => {
  const user = renderPanes();
  await selectToken(user, "typography", "body");

  await user.clear(screen.getByLabelText("サイズ"));
  await user.type(screen.getByLabelText("サイズ"), "24");
  await user.tab();

  expect(screen.getByText("24px / 1.6 / 400")).toBeDefined();
});

test("書体のフォントを打って確定すると入力欄に残る", async () => {
  const user = renderPanes();
  await selectToken(user, "typography", "body");

  await user.type(screen.getByLabelText("フォント"), "Inter");
  await user.tab();

  expect(screen.getByLabelText("フォント")).toHaveProperty("value", "Inter");
});

test("影の追加ボタンを押すと影が増えてそのまま編集できる", async () => {
  const user = renderPanes();
  await user.click(screen.getByRole("button", { name: /^shadows 1$/ }));

  await user.click(
    screen.getByRole("button", { name: "shadows にトークンを追加" }),
  );

  expect(screen.getByRole("button", { name: /^shadows 2$/ })).toBeDefined();
  expect(screen.getByLabelText("ぼかし")).toHaveProperty("value", "3");
});

test("影を削除すると一覧から消えて編集欄も閉じる", async () => {
  const user = renderPanes();
  await selectToken(user, "shadows", "sm");

  await user.click(screen.getByRole("button", { name: "Delete token" }));

  expect(screen.getByRole("button", { name: /^shadows 0$/ })).toBeDefined();
  expect(screen.getByText("トークンが選択されていません")).toBeDefined();
});

test("影の色をピッカーで選び直しても一覧の値に alpha が残る", async () => {
  const user = renderPanes();
  await selectToken(user, "shadows", "sm");

  /* ピッカーは打鍵ではなく色の確定で値が届くので、変更イベントを直接起こす。 */
  fireEvent.change(screen.getByLabelText("色"), {
    target: { value: "#ff0000" },
  });

  expect(screen.getByText("0px 1px 3px 0px #ff00001a")).toBeDefined();
});

test("確定した値が正規化されると入力欄の表示も追随する", async () => {
  const user = renderPanes();
  await selectToken(user, "shadows", "sm");

  await user.clear(screen.getByLabelText("ぼかし"));
  await user.type(screen.getByLabelText("ぼかし"), "007");
  await user.tab();

  expect(screen.getByLabelText("ぼかし")).toHaveProperty("value", "7");
});

test("色の不透明度を打って確定すると一覧の hex に alpha が付く", async () => {
  const user = renderPanes();
  await user.click(screen.getByRole("button", { name: /primary/ }));

  await user.clear(screen.getByLabelText("不透明度"));
  await user.type(screen.getByLabelText("不透明度"), "10");
  await user.tab();

  expect(
    screen.getByRole("button", { name: "primary #3b82f61a" }),
  ).toBeDefined();
});

test("打った不透明度が保存形式へ丸められると入力欄の表示も追随する", async () => {
  const user = renderPanes();
  await user.click(screen.getByRole("button", { name: /primary/ }));

  await user.clear(screen.getByLabelText("不透明度"));
  await user.type(screen.getByLabelText("不透明度"), "10");
  await user.tab();

  expect(screen.getByLabelText("不透明度")).toHaveProperty("value", "10.2");
});

test("数値として読めない入力を確定してもトークンの値は変わらない", async () => {
  const user = renderPanes();
  await selectToken(user, "shadows", "sm");

  await user.clear(screen.getByLabelText("ぼかし"));
  await user.type(screen.getByLabelText("ぼかし"), "-");
  await user.tab();

  expect(screen.getByText("0px 1px 3px 0px #0000001a")).toBeDefined();
});
