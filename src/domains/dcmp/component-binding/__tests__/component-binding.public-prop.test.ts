import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ComponentBinding } from "../index";
import { setupLabeledButton } from "./setup";

test("公開 prop は、その binding を辿った先の prop 定義と設定値に解決される", () => {
  const target = ComponentBinding.resolvePublicPropTarget(
    setupLabeledButton(),
    {
      component: "button",
      prop: "label",
    },
  );

  expect(target).toEqual(
    Option.some({
      definition: expect.objectContaining({
        domain: "literal",
        literalType: "string",
      }),
      declared: Option.some("Button"),
    }),
  );
});

test("存在しない部品の公開 prop は解決できない", () => {
  const target = ComponentBinding.resolvePublicPropTarget(
    setupLabeledButton(),
    {
      component: "missing",
      prop: "label",
    },
  );

  expect(target).toEqual(Option.none);
});

test("宣言されていない公開 prop は解決できない", () => {
  const target = ComponentBinding.resolvePublicPropTarget(
    setupLabeledButton(),
    {
      component: "button",
      prop: "body",
    },
  );

  expect(target).toEqual(Option.none);
});
