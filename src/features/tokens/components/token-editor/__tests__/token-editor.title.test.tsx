import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import type { TokenRef } from "@/domains/token";
import { TokenSelection } from "@/domains/token-selection";
import { Option } from "@/utils/Option";
import { TokenEditor } from "../index";

/**
 * 見出しが「どのトークンを編集しているか」を伝えることを見る
 * （UI 案 docs/Design Composer.html の `gray-900` / `Color` / #112）。
 * 5 種すべてのトークンを 1 つのドキュメントに置いて、種別ごとの綴りを見比べる。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: {
      colors: { primary: "#3b82f6" },
      spacing: { lg: 24 },
      radius: { md: 8 },
      shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
      typography: {
        body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
      },
    },
    artboards: [{ name: "home", width: 360, height: 240, children: [] }],
  });
}

/** そのトークンを選んだ状態の見出しを描く。 */
function renderTitle(ref: TokenRef): HTMLElement {
  const { container } = render(
    <TokenEditor.Title
      selection={TokenSelection.create(setupDocument(), Option.some(ref))}
    />,
  );
  return container;
}

/**
 * 見出しの色見本。飾りとして読み上げから外してあり役割で引けないので、
 * 値そのものを載せている style で引く（`token-list` の影の見本と同じ引き方）。
 */
function swatchIn(container: HTMLElement): Element | null {
  return container.querySelector("[style*='background']");
}

test("編集中のトークンの名前が見出しに出る", () => {
  renderTitle({ kind: "colors", name: "primary" });

  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("primary");
});

test("色トークンの見出しには色見本が出る", () => {
  const container = renderTitle({ kind: "colors", name: "primary" });

  expect(swatchIn(container)).not.toBeNull();
});

test("色以外のトークンの見出しには色見本が出ない", () => {
  const container = renderTitle({ kind: "spacing", name: "lg" });

  expect(swatchIn(container)).toBeNull();
});

test("色トークンの種別は Color と出る", () => {
  renderTitle({ kind: "colors", name: "primary" });

  expect(screen.getByText("Color")).toBeDefined();
});

test("余白トークンの種別は Spacing と出る", () => {
  renderTitle({ kind: "spacing", name: "lg" });

  expect(screen.getByText("Spacing")).toBeDefined();
});

test("角丸トークンの種別は Radius と出る", () => {
  renderTitle({ kind: "radius", name: "md" });

  expect(screen.getByText("Radius")).toBeDefined();
});

test("影トークンの種別は Shadow と出る", () => {
  renderTitle({ kind: "shadows", name: "sm" });

  expect(screen.getByText("Shadow")).toBeDefined();
});

test("書体トークンの種別は Typography と出る", () => {
  renderTitle({ kind: "typography", name: "body" });

  expect(screen.getByText("Typography")).toBeDefined();
});

test("トークンを選んでいないときは見出しに名前が出ない", () => {
  render(
    <TokenEditor.Title
      selection={TokenSelection.create(setupDocument(), Option.none)}
    />,
  );

  /*
   * 名前の枠だけを残す実装（空の見出し）にするとここが落ちる。帯そのものを残すのは
   * 呼び出し側の担当で、`opened-document-editor.token-edit.test.tsx` が見ている。
   */
  expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
});
