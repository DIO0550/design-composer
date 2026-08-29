import { expect, test } from "vitest";
import { PropDefinitionRecord } from "../index";

const Accent = { kind: "colors", name: "accent" } as const;

test("設定されていない prop のデフォルトがトークンを指していると、その prop 名が並ぶ", () => {
  const schema = {
    color: {
      domain: "token",
      tokenKind: "colors",
      default: "accent",
      group: "appearance",
    },
    background: { domain: "token", tokenKind: "colors", group: "appearance" },
  } satisfies PropDefinitionRecord;

  /* `background` は設定も既定も無いので、拾えるのは `color` の既定だけ。 */
  expect(PropDefinitionRecord.collectRefPropNames(schema, {}, Accent)).toEqual([
    "color",
  ]);
});

test("明示設定がデフォルトを上書きしているとき、デフォルトのトークンは参照されない", () => {
  const schema = {
    color: {
      domain: "token",
      tokenKind: "colors",
      default: "accent",
      group: "appearance",
    },
    background: { domain: "token", tokenKind: "colors", group: "appearance" },
  } satisfies PropDefinitionRecord;
  /* 上書きした側は集まる、を同じ入力で見る（集めすぎでも集め漏れでも落ちる）。 */
  const props = { color: "danger", background: "accent" };

  expect(
    PropDefinitionRecord.collectRefPropNames(schema, props, Accent),
  ).toEqual(["background"]);
});

test("明示設定の prop 名が先、デフォルトで補われた prop 名が後に並ぶ", () => {
  /*
   * デフォルト側の prop をスキーマの宣言順で先に置く。宣言順どおりに並べる実装だと
   * `["defaulted", "assigned"]` になるので、連結順を入れ替えるとこの assert が落ちる。
   */
  const schema = {
    defaulted: {
      domain: "token",
      tokenKind: "colors",
      default: "accent",
      group: "appearance",
    },
    assigned: { domain: "token", tokenKind: "colors", group: "appearance" },
  } satisfies PropDefinitionRecord;

  expect(
    PropDefinitionRecord.collectRefPropNames(
      schema,
      { assigned: "accent" },
      Accent,
    ),
  ).toEqual(["assigned", "defaulted"]);
});
