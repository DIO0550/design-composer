import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/dcmp/component";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { Node } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Option } from "@/utils/Option";
import {
  controlNamed,
  currentPaintOfControl,
  instanceOf,
  resolvedValueOfControl,
  sectionsOf,
} from "./setup";

const Components: ComponentSet = {
  "primary-button": {
    publicProps: { label: { node: "button-label", prop: "content" } },
    type: "Box",
    children: [
      { name: "button-label", type: "Text", props: { content: "Button" } },
    ],
  },
  /** 数値のトークンを公開 prop にしている部品。既定からの解決を見るために使う。 */
  "gapped-card": {
    publicProps: { gap: { node: "gapped-card", prop: "gap" } },
    type: "Box",
    props: { gap: "lg" },
    children: [{ name: "gapped-card-title", type: "Text" }],
  },
  /** 塗りを公開 prop にしている部品。既定の塗りが階調へ解決するのを見るために使う。 */
  "banner-card": {
    publicProps: { background: { node: "banner-card", prop: "background" } },
    type: "Box",
    props: { background: "brand" },
    children: [],
  },
  /** 公開 prop の並びと、条件つきの公開 prop を見るための部品。 */
  "sized-card": {
    publicProps: {
      title: { node: "sized-card-title", prop: "content" },
      widthMode: { node: "sized-card", prop: "widthMode" },
      width: { node: "sized-card", prop: "width" },
    },
    type: "Box",
    children: [{ name: "sized-card-title", type: "Text" }],
  },
  /** Object.prototype 上の名前を公開 prop 名にしている部品。 */
  "prototype-named": {
    publicProps: {
      constructor: { node: "prototype-named-label", prop: "content" },
    },
    type: "Box",
    children: [{ name: "prototype-named-label", type: "Text" }],
  },
  /** 幅のモードと長さを binding 先と違う名前で公開した部品。 */
  "renamed-card": {
    publicProps: {
      mode: { node: "renamed-card", prop: "widthMode" },
      size: { node: "renamed-card", prop: "width" },
    },
    type: "Box",
    children: [],
  },
  /** 部品の中で幅のモードが fixed のノードの、長さだけを公開した部品。 */
  "fixed-inside-card": {
    publicProps: { width: { node: "fixed-inside-body", prop: "width" } },
    type: "Box",
    children: [
      { name: "fixed-inside-body", type: "Box", props: { widthMode: "fixed" } },
    ],
  },
  /** 部品の中で幅のモードが fixed のノードの、モードと長さを公開した部品。 */
  "fixed-mode-card": {
    publicProps: {
      mode: { node: "fixed-mode-body", prop: "widthMode" },
      width: { node: "fixed-mode-body", prop: "width" },
    },
    type: "Box",
    children: [
      {
        name: "fixed-mode-body",
        type: "Box",
        props: { widthMode: "fixed", width: 100 },
      },
    ],
  },
  /** 置き方と座標を別々のノードから公開した部品。 */
  "split-card": {
    publicProps: {
      placement: { node: "split-a", prop: "placement" },
      x: { node: "split-a", prop: "x" },
      y: { node: "split-b", prop: "y" },
    },
    type: "Box",
    children: [
      { name: "split-a", type: "Box" },
      { name: "split-b", type: "Box" },
    ],
  },
  /** 部品の中で絶対配置のノードの座標と、別のノードの置き方を公開した部品。 */
  "absolute-inside-card": {
    publicProps: {
      placement: { node: "absolute-inside-a", prop: "placement" },
      y: { node: "absolute-inside-b", prop: "y" },
    },
    type: "Box",
    children: [
      { name: "absolute-inside-a", type: "Box" },
      {
        name: "absolute-inside-b",
        type: "Box",
        props: { placement: "absolute" },
      },
    ],
  },
  /** 幅のモードと長さを同じ名前で公開した、入れ子にされる側の部品。 */
  "sizing-inner": {
    publicProps: {
      widthMode: { node: "sizing-inner", prop: "widthMode" },
      width: { node: "sizing-inner", prop: "width" },
    },
    type: "Box",
    children: [],
  },
  /** `sizing-inner` のモードと長さを、違う名前で公開し直した部品。 */
  "sizing-outer": {
    publicProps: {
      mode: { node: "sizing-outer-inner", prop: "widthMode" },
      size: { node: "sizing-outer-inner", prop: "width" },
    },
    type: "Box",
    children: [{ name: "sizing-outer-inner", ref: "sizing-inner" }],
  },
  /** 中の `sizing-inner` のモードを fixed に上書きし、長さだけを公開した部品。 */
  "sizing-preset": {
    publicProps: { size: { node: "sizing-preset-inner", prop: "width" } },
    type: "Box",
    children: [
      {
        name: "sizing-preset-inner",
        ref: "sizing-inner",
        overrides: { widthMode: "fixed" },
      },
    ],
  },
  /** ロックを公開 prop にしている部品。繋げない prop の欄が出ないことを見るために使う。 */
  "lock-card": {
    publicProps: {
      title: { node: "lock-card-title", prop: "content" },
      lock: { node: "lock-card-title", prop: "locking" },
    },
    type: "Box",
    children: [{ name: "lock-card-title", type: "Text" }],
  },
};

function setupSelection(
  children: readonly Node[],
  selected: string,
): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: Components,
      artboards: [
        { name: "home", width: 360, height: 240, children: [...children] },
      ],
    }),
    [selected],
  );
}

function setupInstanceSelection(node: Node): DocumentSelection {
  return setupSelection([node], node.name);
}

function publicPropNames(selection: DocumentSelection): readonly string[] {
  return instanceOf(selection).publicProps.map((control) => control.prop);
}

test("インスタンスを選ぶと部品が公開している prop のコントロールが出る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
  });

  expect(publicPropNames(selection)).toEqual(["label"]);
});

test("インスタンスを選ぶと元になっている部品の名前が出る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
  });

  expect(instanceOf(selection).source).toBe("primary-button");
});

test("インスタンス以外を選ぶと group ごとのセクションになる", () => {
  const selection = setupInstanceSelection({ name: "action", type: "Box" });

  expect(sectionsOf(selection).length).toBeGreaterThan(0);
});

test("公開 prop のコントロールは binding 先の prop の入力形式になる", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
  });

  expect(
    controlNamed(instanceOf(selection).publicProps, "label").input,
  ).toEqual({
    kind: "text",
  });
});

test("上書きしていない数値トークンの公開 prop は部品が設定している値の解決値を持つ", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "gapped-card",
  });

  expect(
    resolvedValueOfControl(
      controlNamed(instanceOf(selection).publicProps, "gap"),
    ),
  ).toEqual(Option.some(DocumentTemplate.Default.tokens.spacing.lg));
});

test("上書きしていない公開 prop は部品が設定している値が既定として出る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
  });
  const control = controlNamed(instanceOf(selection).publicProps, "label");

  expect(Option.isSome(control.value)).toBe(false);
  expect(control.defaultValue).toEqual(Option.some("Button"));
});

test("上書きしている公開 prop でも、既定には部品が設定している値が出る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
    overrides: { label: "ログイン" },
  });

  expect(
    controlNamed(instanceOf(selection).publicProps, "label").defaultValue,
  ).toEqual(Option.some("Button"));
});

test("上書きしていない塗りの公開 prop は、部品が設定している階調を既定の塗りとして持つ", () => {
  const selection = setupInstanceSelection({
    name: "banner",
    ref: "banner-card",
  });

  expect(
    currentPaintOfControl(
      controlNamed(instanceOf(selection).publicProps, "background"),
    ),
  ).toEqual({
    state: "unset",
    defaultPaint: Option.some({
      kind: "gradients",
      name: "brand",
      value: DocumentTemplate.Default.tokens.gradients.brand,
    }),
  });
});

test("上書きしている塗りの公開 prop は、部品の既定ではなく上書きした塗りを今の値として持つ", () => {
  const selection = setupInstanceSelection({
    name: "banner",
    ref: "banner-card",
    overrides: { background: "primary" },
  });

  expect(
    currentPaintOfControl(
      controlNamed(instanceOf(selection).publicProps, "background"),
    ),
  ).toEqual({
    state: "owned",
    token: {
      kind: "colors",
      name: "primary",
      value: DocumentTemplate.Default.tokens.colors.primary,
    },
  });
});

test("上書きしている公開 prop はその値がコントロールに乗る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
    overrides: { label: "ログイン" },
  });

  expect(
    controlNamed(instanceOf(selection).publicProps, "label").value,
  ).toEqual(Option.some("ログイン"));
});

test("公開 prop は部品が宣言した順に並ぶ", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "sized-card",
    overrides: { widthMode: "fixed" },
  });

  expect(publicPropNames(selection)).toEqual(["title", "widthMode", "width"]);
});

test("条件を満たさない公開 prop はコントロールが出ない", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "sized-card",
    overrides: { widthMode: "hug" },
  });

  expect(publicPropNames(selection)).toEqual(["title", "widthMode"]);
});

test("locking へ繋いだ公開 prop はコントロールが出ず、同じ部品の他の公開 prop は出る", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "lock-card",
  });

  expect(publicPropNames(selection)).toEqual(["title"]);
});

test("存在しない部品を指すインスタンスには公開 prop のコントロールが出ない", () => {
  const selection = setupInstanceSelection({ name: "action", ref: "missing" });

  expect(instanceOf(selection).publicProps).toEqual([]);
});

/*
 * 解除できるかの規則そのもの（参照先が無い・循環している）は
 * `design-document.detachable.test.ts` が持つ。ここが見るのは、答えが
 * **選んでいるインスタンス自身**のもので、それがそのまま編集欄に載るかだけ。
 * 2 件が同じドキュメントを共有しているのはそのためで、別々のドキュメントに
 * 分けると「そのドキュメント唯一のインスタンス」で答える誤りが通ってしまう。
 */
function setupDetachSelection(selected: string): DocumentSelection {
  return setupSelection(
    [
      { name: "action", ref: "primary-button" },
      { name: "broken", ref: "missing" },
    ],
    selected,
  );
}

test("参照先の部品が引けるインスタンスは解除できるものとして出る", () => {
  expect(instanceOf(setupDetachSelection("action")).isDetachable).toBe(true);
});

test("存在しない部品を指すインスタンスは解除できないものとして出る", () => {
  expect(instanceOf(setupDetachSelection("broken")).isDetachable).toBe(false);
});

test("スキーマの分からない type のノードにはコントロールが出ない", () => {
  const selection = setupInstanceSelection({ name: "action", type: "Unknown" });

  expect(sectionsOf(selection)).toEqual([]);
});

test("上書きしていない公開 prop constructor は、今の値を持たない", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "prototype-named",
  });
  const control = controlNamed(
    instanceOf(selection).publicProps,
    "constructor",
  );

  expect(control.value).toEqual(Option.none);
});

test("インスタンスを選ぶとインスタンス自身のロックの欄が 1 つ出る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
  });

  expect(
    instanceOf(selection).refOwnProps.map((control) => control.prop),
  ).toEqual(["locking"]);
});

test("ロックを書いていないインスタンスのロックの欄は値を持たず、既定は unlocked", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
  });
  const control = controlNamed(instanceOf(selection).refOwnProps, "locking");

  expect([control.value, control.defaultValue]).toEqual([
    Option.none,
    Option.some("unlocked"),
  ]);
});

test("ロックしたインスタンスのロックの欄には locked が乗る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
    locking: "locked",
  });

  expect(
    controlNamed(instanceOf(selection).refOwnProps, "locking").value,
  ).toEqual(Option.some("locked"));
});

test("公開 prop の上書きに書いたロックは、ロックの欄の値にならない", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
    overrides: { locking: "locked" },
  });

  expect(
    controlNamed(instanceOf(selection).refOwnProps, "locking").value,
  ).toEqual(Option.none);
});

test("語彙に無い綴りのロックを書いたインスタンスは、その綴りもロックの欄の選択肢に並ぶ", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
    locking: "frozen",
  });

  expect(
    controlNamed(instanceOf(selection).refOwnProps, "locking").input,
  ).toEqual({ kind: "enum", values: ["frozen", "unlocked", "locked"] });
});

test("存在しない部品を指すインスタンスにもロックの欄が出る", () => {
  const selection = setupInstanceSelection({ name: "action", ref: "missing" });

  expect(
    instanceOf(selection).refOwnProps.map((control) => control.prop),
  ).toEqual(["locking"]);
});

test("公開名を binding 先と違う名前にした部品で、幅のモードを上書きで fixed にすると、公開した長さの欄が出る", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "renamed-card",
    overrides: { mode: "fixed" },
  });

  expect(publicPropNames(selection)).toEqual(["mode", "size"]);
});

test("部品の中でノードの幅のモードが fixed なら、モードを公開していなくても公開した長さの欄が出る", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "fixed-inside-card",
  });

  expect(publicPropNames(selection)).toEqual(["width"]);
});

test("部品の中で幅のモードが fixed でも、インスタンスがモードの公開 prop を hug に上書きすれば長さの欄は出ない", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "fixed-mode-card",
    overrides: { mode: "hug" },
  });

  expect(publicPropNames(selection)).toEqual(["mode"]);
});

test("置き方を上書きで絶対配置にしても、別のノードの座標へ繋いだ公開 prop の欄は出ない", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "split-card",
    overrides: { placement: "absolute" },
  });

  expect(publicPropNames(selection)).toEqual(["placement", "x"]);
});

test("部品の中でノードが絶対配置なら、置き方を公開していなくても、そのノードの座標へ繋いだ公開 prop の欄が出る", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "absolute-inside-card",
  });

  expect(publicPropNames(selection)).toEqual(["placement", "y"]);
});

test("入れ子の部品へ公開名を変えて繋いだ幅のモードを上書きで fixed にすると、長さの欄が出る", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "sizing-outer",
    overrides: { mode: "fixed" },
  });

  expect(publicPropNames(selection)).toEqual(["mode", "size"]);
});

test("部品定義の中の参照ノードが幅のモードを fixed に上書きしていれば、公開した長さの欄が出る", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "sizing-preset",
  });

  expect(publicPropNames(selection)).toEqual(["size"]);
});

test("条件の prop を公開していれば、公開 prop の欄の条件の行はその公開名になる", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "sized-card",
    overrides: { widthMode: "fixed" },
  });

  expect(
    controlNamed(instanceOf(selection).publicProps, "width").enabledBy,
  ).toEqual(Option.some("widthMode"));
});

test("条件の prop を公開していなければ、公開 prop の欄に条件の行は無い", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "fixed-inside-card",
  });

  expect(
    controlNamed(instanceOf(selection).publicProps, "width").enabledBy,
  ).toEqual(Option.none);
});

test("条件の prop を別の名前で公開していれば、公開 prop の欄の条件の行はその公開名になる", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "renamed-card",
    overrides: { mode: "fixed" },
  });

  expect(
    controlNamed(instanceOf(selection).publicProps, "size").enabledBy,
  ).toEqual(Option.some("mode"));
});

test("別のノードの置き方を公開していても、座標の公開 prop の欄に条件の行は無い", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "absolute-inside-card",
  });

  expect(
    controlNamed(instanceOf(selection).publicProps, "y").enabledBy,
  ).toEqual(Option.none);
});
