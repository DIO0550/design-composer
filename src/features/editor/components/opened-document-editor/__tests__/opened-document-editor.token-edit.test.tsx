import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { rightPaneHeading } from "@/features/editor/__tests__/right-pane-heading";
import { leftPane, propertyPane, renderOpenedDocument } from "./setup";

/**
 * 5 種別すべてに 1 件以上のトークンを持ち、そのうち 1 つ（`primary`）が
 * キャンバス上のノードから使われているドキュメント。
 * 使用中でも消せること（docs/04-tokens.md「スキーマデフォルトとの関係」）まで見られる。
 */
const EditedDocument = DesignDocument.create({
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
 * トークンの一覧と編集欄を出した編集画面。
 *
 * 画面から行き先を切り替えるところを通すのは、**一覧が左ペイン・編集欄が右ペインという
 * 別の枝に組まれている**ため。片方だけを描くと、器へ入れる配線（帯と本文）が切れていても
 * 気づけない。
 */
async function renderTokensView(): Promise<void> {
  await renderOpenedDocument(EditedDocument);
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: "Tokens" }),
  );
}

/** 一覧の種別の節を開く。開いた直後に開いているのは先頭の種別（colors）だけ。 */
async function openSection(kind: string): Promise<void> {
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: new RegExp(`^${kind} `) }),
  );
}

/** 一覧の行を名前で選ぶ。同じ名前は右ペインにも出るので一覧に絞る。 */
async function selectRow(name: string): Promise<void> {
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: new RegExp(name) }),
  );
}

/** 節を開いてから、その中の 1 件を選ぶ。 */
async function selectToken(kind: string, name: string): Promise<void> {
  await openSection(kind);
  await selectRow(name);
}

/** 編集欄の入力欄。見出しで引き分ける。 */
function field(label: string): HTMLElement {
  return within(propertyPane()).getByLabelText(label);
}

/** 一覧の行。名前と値が読み上げ名に並ぶ。 */
function row(name: string | RegExp): HTMLElement {
  return within(leftPane()).getByRole("button", { name });
}

test("トークンを選ぶまで編集欄は出ない", async () => {
  await renderTokensView();

  expect(
    within(propertyPane()).getByText("トークンが選択されていません"),
  ).toBeDefined();
});

test("トークンを選んでいなくても見出しの帯は残る", async () => {
  await renderTokensView();

  /* 帯ごと消すと、選択のたびに本文の位置が帯のぶん動く。 */
  expect(rightPaneHeading()).toBeDefined();
});

test("トークンを選ぶと編集中の名前が見出しの帯に出る", async () => {
  await renderTokensView();

  await selectRow("primary");

  expect(
    within(rightPaneHeading()).getByRole("heading", { level: 2 }).textContent,
  ).toBe("primary");
});

test("色の行を選ぶとカラーピッカーと名前が出る", async () => {
  await renderTokensView();

  await selectRow("primary");

  expect(field("値")).toHaveProperty("value", "#3b82f6");
  expect(field("名前")).toHaveProperty("value", "primary");
});

test("カラーピッカーで色を変えると一覧の値も変わる", async () => {
  await renderTokensView();
  await selectRow("primary");

  /*
   * カラーピッカーは打鍵ではなく色の確定で値が届くので、変更イベントを直接起こす
   * （`userEvent.type` は `input[type=color]` に文字を入れられない）。
   */
  fireEvent.change(field("値"), { target: { value: "#00ff00" } });

  expect(row("primary #00ff00")).toBeDefined();
});

test("長さを打って確定すると px 付きで一覧に出る", async () => {
  await renderTokensView();
  await selectToken("spacing", "lg");

  await userEvent.clear(field("値"));
  await userEvent.type(field("値"), "32");
  await userEvent.tab();

  expect(within(leftPane()).getByText("32px")).toBeDefined();
});

test("名前を打って確定すると一覧の名前が変わり、選択は残る", async () => {
  await renderTokensView();
  await selectRow("primary");

  await userEvent.clear(field("名前"));
  await userEvent.type(field("名前"), "brand-color");
  await userEvent.tab();

  expect(row(/brand-color/).getAttribute("aria-current")).toBe("true");
});

test("ハイフンを含む名前へ改名できる", async () => {
  await renderTokensView();
  await selectRow("primary");

  await userEvent.clear(field("名前"));
  await userEvent.type(field("名前"), "brand-primary-strong");
  await userEvent.tab();

  expect(field("名前")).toHaveProperty("value", "brand-primary-strong");
});

test("同じ種別に既にある名前へは改名されない", async () => {
  await renderTokensView();
  await selectRow("primary");

  await userEvent.clear(field("名前"));
  await userEvent.type(field("名前"), "danger");
  await userEvent.tab();

  expect(row(/^primary/).getAttribute("aria-current")).toBe("true");
});

test("追加ボタンを押すとトークンが増えてそのまま編集できる", async () => {
  await renderTokensView();

  await userEvent.click(row("colors にトークンを追加"));

  expect(row(/^colors 3$/)).toBeDefined();
  expect(field("名前")).toHaveProperty("value", "color");
});

test("削除すると一覧から消えて編集欄も閉じる", async () => {
  await renderTokensView();
  await selectRow("primary");

  await userEvent.click(
    within(propertyPane()).getByRole("button", { name: "Delete token" }),
  );

  expect(row(/^colors 1$/)).toBeDefined();
  expect(
    within(propertyPane()).getByText("トークンが選択されていません"),
  ).toBeDefined();
});

test("使用中のトークンでも削除できる", async () => {
  await renderTokensView();
  await selectRow("primary");

  await userEvent.click(
    within(propertyPane()).getByRole("button", { name: "Delete token" }),
  );

  expect(within(leftPane()).queryByText("primary")).toBeNull();
});

test("影のぼかしを打って確定すると一覧の値が変わる", async () => {
  await renderTokensView();
  await selectToken("shadows", "sm");

  await userEvent.clear(field("ぼかし"));
  await userEvent.type(field("ぼかし"), "8");
  await userEvent.tab();

  expect(
    within(leftPane()).getByText("0px 1px 8px 0px #0000001a"),
  ).toBeDefined();
});

test("影の広がりだけを打っても他のフィールドの表示は変わらない", async () => {
  await renderTokensView();
  await selectToken("shadows", "sm");

  await userEvent.clear(field("広がり"));
  await userEvent.type(field("広がり"), "2");
  await userEvent.tab();

  expect(field("ぼかし")).toHaveProperty("value", "3");
});

test("書体のサイズを打って確定すると一覧の値が変わる", async () => {
  await renderTokensView();
  await selectToken("typography", "body");

  await userEvent.clear(field("サイズ"));
  await userEvent.type(field("サイズ"), "24");
  await userEvent.tab();

  expect(within(leftPane()).getByText("24px / 1.6 / 400")).toBeDefined();
});

test("書体のフォントを打って確定すると入力欄に残る", async () => {
  await renderTokensView();
  await selectToken("typography", "body");

  await userEvent.type(field("フォント"), "Inter");
  await userEvent.tab();

  expect(field("フォント")).toHaveProperty("value", "Inter");
});

test("影の追加ボタンを押すと影が増えてそのまま編集できる", async () => {
  await renderTokensView();
  await openSection("shadows");

  await userEvent.click(row("shadows にトークンを追加"));

  expect(row(/^shadows 2$/)).toBeDefined();
  expect(field("ぼかし")).toHaveProperty("value", "3");
});

test("影を削除すると一覧から消えて編集欄も閉じる", async () => {
  await renderTokensView();
  await selectToken("shadows", "sm");

  await userEvent.click(
    within(propertyPane()).getByRole("button", { name: "Delete token" }),
  );

  expect(row(/^shadows 0$/)).toBeDefined();
  expect(
    within(propertyPane()).getByText("トークンが選択されていません"),
  ).toBeDefined();
});

test("影の色をピッカーで選び直しても一覧の値に alpha が残る", async () => {
  await renderTokensView();
  await selectToken("shadows", "sm");

  /* ピッカーは打鍵ではなく色の確定で値が届くので、変更イベントを直接起こす。 */
  fireEvent.change(field("色"), { target: { value: "#ff0000" } });

  expect(
    within(leftPane()).getByText("0px 1px 3px 0px #ff00001a"),
  ).toBeDefined();
});

test("確定した値が正規化されると入力欄の表示も追随する", async () => {
  await renderTokensView();
  await selectToken("shadows", "sm");

  await userEvent.clear(field("ぼかし"));
  await userEvent.type(field("ぼかし"), "007");
  await userEvent.tab();

  expect(field("ぼかし")).toHaveProperty("value", "7");
});

test("色の不透明度を打って確定すると一覧の hex に alpha が付く", async () => {
  await renderTokensView();
  await selectRow("primary");

  await userEvent.clear(field("不透明度"));
  await userEvent.type(field("不透明度"), "10");
  await userEvent.tab();

  expect(row("primary #3b82f61a")).toBeDefined();
});

test("打った不透明度が保存形式へ丸められると入力欄の表示も追随する", async () => {
  await renderTokensView();
  await selectRow("primary");

  await userEvent.clear(field("不透明度"));
  await userEvent.type(field("不透明度"), "10");
  await userEvent.tab();

  expect(field("不透明度")).toHaveProperty("value", "10.2");
});

test("数値として読めない入力を確定してもトークンの値は変わらない", async () => {
  await renderTokensView();
  await selectToken("shadows", "sm");

  await userEvent.clear(field("ぼかし"));
  await userEvent.type(field("ぼかし"), "-");
  await userEvent.tab();

  expect(
    within(leftPane()).getByText("0px 1px 3px 0px #0000001a"),
  ).toBeDefined();
});

test("トークンを選んだあとでも Layers へ戻せる", async () => {
  await renderTokensView();
  await selectRow("primary");

  await userEvent.click(
    within(leftPane()).getByRole("button", { name: "Layers" }),
  );

  /* 右ペインはプロパティパネルへ戻る（トークンの編集欄は残らない）。 */
  expect(screen.queryByRole("region", { name: "トークン編集" })).toBeNull();
});
