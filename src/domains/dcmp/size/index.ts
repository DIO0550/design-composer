import {
  CssDeclaration,
  type CssProperty,
} from "@/domains/dcmp/css-declaration";
import { CssDirection } from "@/domains/dcmp/css-direction";
import { PropEdit, type Props, type PropValue } from "@/domains/dcmp/node";
import { Axes, type Axis } from "@/domains/unit/axis";
import { Px } from "@/domains/unit/px";
import { Option } from "@/utils/Option";

/**
 * 軸方向の長さに与える下限と上限（docs/03「サイズ指定の原則」）。
 * 片方だけを書くこともあるので、それぞれが不在を取りうる。
 *
 * 下限が上限を超える逆転は生成時に弾かない。逆転していても開いて描画を続け（docs/03「開く時」）、
 * CSS では下限が勝つ形で出すため。検出は `DesignDocument.collectErrors` が持つ。
 */
export type SizeLimits = Readonly<{
  min: Option<number>;
  max: Option<number>;
}>;

/**
 * その軸の下限・上限が載る prop 名。
 *
 * @param axis どちらの軸の prop 名か
 * @returns 下限と上限の prop 名の対
 */
function limitProps(axis: Axis): Readonly<{
  min: "minWidth" | "minHeight";
  max: "maxWidth" | "maxHeight";
}> {
  return axis === "width"
    ? { min: "minWidth", max: "maxWidth" }
    : { min: "minHeight", max: "maxHeight" };
}

/**
 * prop に設定されている長さ。
 *
 * @param value 読み取った prop の値
 * @returns 数値ならその長さ。prop が無いときと数値でないときは `none`
 */
function lengthOf(value: PropValue | undefined): Option<number> {
  return typeof value === "number" ? Option.some(value) : Option.none;
}

/**
 * 下限・上限 1 つ分の宣言。
 *
 * @param property 出力する CSS のプロパティ名
 * @param length その端の長さ
 * @returns 長さがあるときだけ宣言 1 件。無ければ空
 */
function limitDeclaration(
  property: CssProperty,
  length: Option<number>,
): readonly CssDeclaration[] {
  return Option.isSome(length)
    ? [CssDeclaration.create(property, Px.create(length.value))]
    : [];
}

const SizeLimits = {
  /**
   * props からその軸の下限と上限を読む。
   *
   * @param props 読み取り元の props（デフォルト解決済みでなくてよい）
   * @param axis どちらの軸の下限・上限を読むか
   * @returns 下限と上限。書いていない側と数値でない側は `none`
   */
  fromProps(props: Props, axis: Axis): SizeLimits {
    const names = limitProps(axis);
    return {
      min: lengthOf(props[names.min]),
      max: lengthOf(props[names.max]),
    };
  },

  /**
   * 下限と上限を CSS の宣言にする。
   *
   * @param limits 宣言にする下限と上限
   * @param axis どちらの軸の下限・上限か
   * @returns 書いている側だけの宣言。下限が先。どちらも無ければ空
   */
  declarations(limits: SizeLimits, axis: Axis): readonly CssDeclaration[] {
    return [
      ...limitDeclaration(`min-${axis}`, limits.min),
      ...limitDeclaration(`max-${axis}`, limits.max),
    ];
  },

  /**
   * 下限が上限を超えているか。
   *
   * @param limits 見る下限と上限
   * @returns 両方があり、下限が上限より大きいときだけ `true`。等しいときと片方が無いときは `false`
   */
  isInverted(limits: SizeLimits): boolean {
    return (
      Option.isSome(limits.min) &&
      Option.isSome(limits.max) &&
      limits.min.value > limits.max.value
    );
  },
} as const;

/**
 * 軸ごとのサイズ指定
 * (docs/03「モード(enum)と値(number)の2 prop に分離」)。
 * 長さを持つのは `fixed` のときだけ、下限・上限を持つのは `fixed` 以外のときだけである
 * ことを構造で表す (docs/03「サイズ指定の原則」が後者の理由を持つ)。
 */
export type Size =
  | Readonly<{ mode: "hug"; limits: SizeLimits }>
  | Readonly<{ mode: "fill"; limits: SizeLimits }>
  | Readonly<{ mode: "fixed"; length: number }>;

/**
 * 主軸方向なら伸長、交差軸方向なら引き伸ばし
 * (docs/03「親コンテキストに依存するコンパイル」)。
 *
 * @param flexParentDirection flex アイテムとして並ぶ親の向き
 * @param axis どちらの軸のサイズか
 * @returns 並ぶ親があるときだけ宣言 1 件。フローの外では空
 */
function fillDeclarations(
  flexParentDirection: Option<CssDirection>,
  axis: Axis,
): readonly CssDeclaration[] {
  return Option.isSome(flexParentDirection)
    ? [CssDirection.fillDeclaration(flexParentDirection.value, axis)]
    : [];
}

/**
 * `Size.fixedLengthFromProps` のうち、サイズが決まった後の部分。
 *
 * @param size 見るサイズ
 * @returns `fixed` ならその長さ。それ以外は `none`
 */
function fixedLength(size: Size): Option<number> {
  return size.mode === "fixed" ? Option.some(size.length) : Option.none;
}

/**
 * `Size.declarationsFromProps` のうち、サイズが決まった後の部分。
 *
 * @param size 宣言にするサイズ
 * @param axis どちらの軸のサイズか
 * @param flexParentDirection `Size.declarationsFromProps` のとおり
 * @returns その軸の宣言
 */
function declarations(
  size: Size,
  axis: Axis,
  flexParentDirection: Option<CssDirection>,
): readonly CssDeclaration[] {
  switch (size.mode) {
    case "hug":
      return [
        CssDeclaration.create(axis, "fit-content"),
        ...SizeLimits.declarations(size.limits, axis),
      ];
    case "fixed":
      return [CssDeclaration.create(axis, Px.create(size.length))];
    case "fill":
      return [
        ...fillDeclarations(flexParentDirection, axis),
        ...SizeLimits.declarations(size.limits, axis),
      ];
  }
}

export const Size = {
  /**
   * props からその軸のサイズを組み立てる。
   *
   * 決まらないのはスキーマ違反のときで、不正は `DesignDocument.collectErrors` が出す。
   *
   * @param props 読み取り元の props (デフォルト解決済みでなくてよい)
   * @param axis どちらの軸のサイズを読むか
   * @returns その軸のサイズ。モードの綴りが読めないときと、`fixed` なのに長さが数値で
   *   ないときは `none`
   */
  fromProps(props: Props, axis: Axis): Option<Size> {
    const mode = props[Size.modeProp(axis)];
    const limits = SizeLimits.fromProps(props, axis);
    if (mode === "hug") {
      return Option.some({ mode: "hug", limits });
    }
    if (mode === "fill") {
      return Option.some({ mode: "fill", limits });
    }
    const length = props[axis];
    if (mode === "fixed" && typeof length === "number") {
      return Option.some({ mode: "fixed", length });
    }
    return Option.none;
  },

  /**
   * その軸のモードを持つ prop 名
   * (docs/03「モード(enum)と値(number)の2 prop に分離」)。
   * 長さ側の prop 名は軸の名前そのもの (`width` / `height`)。
   *
   * @param axis どちらの軸のモードか
   * @returns `axis` の側のモードを持つ prop の名前
   */
  modeProp(axis: Axis): "widthMode" | "heightMode" {
    return axis === "width" ? "widthMode" : "heightMode";
  },

  /**
   * `fill` になっている軸。
   *
   * @param props 見るノードの props（デフォルト解決済みでなくてよい）
   * @returns `fill` の軸を width・height の順で。サイズが決まらない軸は含めない
   */
  collectFillAxes(props: Props): readonly Axis[] {
    return Object.values(Axes).filter((axis) =>
      Option.contains(
        Option.map(Size.fromProps(props, axis), (size) => size.mode),
        "fill",
      ),
    );
  },

  /**
   * その軸の下限・上限が載る prop 名。
   *
   * @param axis どちらの軸の prop 名か
   * @returns 下限と上限の prop 名の対
   */
  limitProps,

  /**
   * 下限が上限を超えている軸（docs/03「バリデーション仕様」）。
   *
   * @param props 見るノードの props。デフォルト解決済みのもの（`widthMode` を書いていない
   *   ノードを既定のモードで見るため。解決していないと `fromProps` が `none` になり見落とす）
   * @returns `hug` / `fill` で下限が上限より大きい軸を width・height の順で。`fixed` の軸と
   *   サイズが決まらない軸は含めない
   */
  collectInvertedLimitAxes(props: Props): readonly Axis[] {
    return Object.values(Axes).filter((axis) =>
      Option.contains(
        Option.map(
          Size.fromProps(props, axis),
          (size) => size.mode !== "fixed" && SizeLimits.isInverted(size.limits),
        ),
        true,
      ),
    );
  },

  /**
   * `fill` の軸を、下限・上限ごと別のノードへ書く編集（グループ化で、包むノードの `fill` を
   * Box へ引き継ぐときなど）。
   *
   * 下限・上限を写さないと、写した先だけが上限を超えて伸び、並びの中の兄弟の長さが変わる。
   *
   * @param props 写し元の props（デフォルト解決済みでないもの。書かれている下限・上限だけを
   *   写すため）
   * @returns `fill` の軸ごとに、モードを `fill` にする編集と、書かれているその軸の下限・上限
   *   を同じ値で設定する編集。`fill` の軸が無ければ空
   */
  collectFillPropEdits(props: Props): readonly PropEdit[] {
    return Size.collectFillAxes(props).flatMap((axis) => [
      PropEdit.set([Size.modeProp(axis)], "fill"),
      ...PropEdit.collectWritten(props, Object.values(limitProps(axis))),
    ]);
  },

  /**
   * props からその軸の固定された長さを読む。
   *
   * モードと長さがどの prop に載っているかを知っているのはこのモジュールなので、
   * 軸で引く側が 2 つの prop 名を組み立てずに済む。
   *
   * @param props 読み取り元の props (デフォルト解決済みでなくてよい)
   * @param axis どちらの軸の長さを読むか
   * @returns その軸の長さ。`hug` / `fill` と、`fixed` なのに長さが無いときは `none`
   */
  fixedLengthFromProps(props: Props, axis: Axis): Option<number> {
    return Option.flatMap(Size.fromProps(props, axis), fixedLength);
  },

  /**
   * props からその軸のサイズを読み、CSS の宣言にする。
   * `fill` だけは親の向きに依存する (docs/03「親コンテキストに依存するコンパイル」)。
   *
   * 下限・上限は親の向きに依らないので、`fill` がフローの外にあって伸長の宣言を出さない
   * ときも出す。
   *
   * @param props 読み取り元の props (デフォルト解決済みでなくてよい)
   * @param axis どちらの軸のサイズか
   * @param flexParentDirection flex アイテムとして並ぶ親の向き。フローに参加して
   *   いない位置（親を持たない / 親が `layout: free` / 自身が絶対配置）では `none`。
   *   そこでは `fill` が意味を持たないので宣言を出さない
   * @returns その軸の宣言。サイズが決まらない（`fromProps` が `none`）ときと、`fill` が
   *   フローの外にあって下限・上限も無いときは空
   */
  declarationsFromProps(
    props: Props,
    axis: Axis,
    flexParentDirection: Option<CssDirection>,
  ): readonly CssDeclaration[] {
    return Option.unwrapOr(
      Option.map(Size.fromProps(props, axis), (size) =>
        declarations(size, axis, flexParentDirection),
      ),
      [],
    );
  },
} as const;
