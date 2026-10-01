import type { ComponentSet } from "@/domains/dcmp/component";

/**
 * ラベルの文言に "Button" を設定し、それを `label` として公開した部品 `button` だけの一式。
 *
 * @returns 部品一式
 */
export function setupLabeledButton(): ComponentSet {
  return {
    button: {
      type: "Box",
      children: [
        { name: "button-label", type: "Text", props: { content: "Button" } },
      ],
      publicProps: { label: { node: "button-label", prop: "content" } },
    },
  };
}
