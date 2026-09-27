import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/dcmp/component";
import type { Node } from "@/domains/dcmp/node";
import { DesignDocument, DocumentTemplate } from "../index";

/**
 * 部品一式と、artboard 直下に置くノードからドキュメントを作り、エラーの文言だけを取り出す。
 * トークンは既定のテーマを入れる（Text の既定がトークンを指すため）。
 *
 * @param components 部品一式
 * @param children artboard 直下に置くノード
 * @returns エラーの文言の並び
 */
function messagesOf(
  components: ComponentSet,
  children: readonly Node[],
): readonly string[] {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components,
    artboards: [{ name: "screen", width: 375, height: 812, children }],
  });
  return DesignDocument.collectErrors(document).map((error) => error.message);
}

test("binding の指すノードが無いときの文言は、そのノード名を挙げる", () => {
  const messages = messagesOf(
    {
      button: {
        type: "Box",
        publicProps: { label: { node: "ghost", prop: "content" } },
      },
    },
    [],
  );

  expect(messages).toEqual(['unknown node "ghost"']);
});

test("binding の指すプリミティブに prop が無いときの文言は、ノード名と prop 名を挙げる", () => {
  const messages = messagesOf(
    {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { spacing: { node: "button-label", prop: "gap" } },
      },
    },
    [],
  );

  expect(messages).toEqual(['node "button-label" has no prop "gap"']);
});

test("binding の指すインスタンスの参照先が prop を公開していないときの文言は、参照先の部品名を挙げる", () => {
  const messages = messagesOf(
    {
      button: {
        type: "Box",
        children: [{ name: "button-icon", ref: "icon" }],
        publicProps: { size: { node: "button-icon", prop: "size" } },
      },
      icon: { type: "Box" },
    },
    [],
  );

  expect(messages).toEqual(['"size" is not a public prop of component "icon"']);
});

test("参照先の部品が無いときの文言は、その部品名を挙げる", () => {
  const messages = messagesOf({}, [{ name: "submit", ref: "missing" }]);

  expect(messages).toEqual(['unknown component "missing"']);
});

test("公開されていない prop を上書きしたときの文言は、参照先の部品名と prop 名を挙げる", () => {
  const messages = messagesOf({ button: { type: "Box" } }, [
    { name: "submit", ref: "button", overrides: { caption: "保存" } },
  ]);

  expect(messages).toEqual([
    'component "button" does not declare public prop "caption"',
  ]);
});
