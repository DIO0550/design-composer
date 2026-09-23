import {
  CssDeclaration,
  type CssProperty,
} from "@/domains/dcmp/css-declaration";
import { CssDirection } from "@/domains/dcmp/css-direction";
import type { Props, PropValue } from "@/domains/dcmp/node";
import type { Axis } from "@/domains/unit/axis";
import { Px } from "@/domains/unit/px";
import { Option } from "@/utils/Option";

/**
 * 軸方向の長さに与える下限と上限（docs/03「サイズ指定の原則」）。
 * 片方だけを書くこともあるので、それぞれが不在を取りうる。
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

export const Size = {
  /**
   * props からその軸のサイズを組み立てる。
   *
   * この `undefined` は「不在」ではなく「スキーマ違反で決められない」を表す
   * (不正は `DesignDocument.collectErrors` が出す / `Placement.fromProps` と同じ)。
   *
   * @param props 読み取り元の props (デフォルト解決済みでなくてよい)
   * @param axis どちらの軸のサイズを読むか
   * @returns その軸のサイズ。モードの綴りが読めないときと、`fixed` なのに長さが数値で
   *   ないときは `undefined`
   */
  fromProps(props: Props, axis: Axis): Size | undefined {
    const mode = props[Size.modeProp(axis)];
    const limits = SizeLimits.fromProps(props, axis);
    if (mode === "hug") {
      return { mode: "hug", limits };
    }
    if (mode === "fill") {
      return { mode: "fill", limits };
    }
    const length = props[axis];
    if (mode === "fixed" && typeof length === "number") {
      return { mode: "fixed", length };
    }
    return undefined;
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
   * 固定された長さ。`hug` / `fill` と、長さの決まらないサイズは持たない。
   *
   * @param size 見るサイズ。`undefined` の意味は `fromProps` のとおり
   * @returns `fixed` ならその長さ。`hug` / `fill` と `undefined` なら `none`
   */
  fixedLength(size: Size | undefined): Option<number> {
    return size?.mode === "fixed" ? Option.some(size.length) : Option.none;
  },

  /**
   * props からその軸の固定された長さを読む。
   *
   * モードと長さがどの prop に載っているかを知っているのはこのモジュールなので、
   * 軸で引く側が 2 つの prop 名を組み立てずに済む。`fixedLength` と組で使う形が
   * 呼び出し側に散っていたのでここへ集約している。
   *
   * @param props 読み取り元の props (デフォルト解決済みでなくてよい)
   * @param axis どちらの軸の長さを読むか
   * @returns その軸の長さ。`hug` / `fill` と、`fixed` なのに長さが無いときは `none`
   */
  fixedLengthFromProps(props: Props, axis: Axis): Option<number> {
    return Size.fixedLength(Size.fromProps(props, axis));
  },

  /**
   * サイズを CSS の宣言にする。
   * `fill` だけは親の向きに依存する (docs/03「親コンテキストに依存するコンパイル」)。
   *
   * 下限・上限は親の向きに依らないので、`fill` がフローの外にあって伸長の宣言を出さない
   * ときも出す。
   *
   * @param size 宣言にするサイズ。サイズが決まらないときは `undefined`
   * @param axis どちらの軸のサイズか
   * @param flexParentDirection flex アイテムとして並ぶ親の向き。フローに参加して
   *   いない位置（親を持たない / 親が `layout: free` / 自身が絶対配置）では `none`。
   *   そこでは `fill` が意味を持たないので宣言を出さない
   * @returns その軸の宣言。サイズが決まらないときと、`fill` がフローの外にあって
   *   下限・上限も無いときは空
   */
  declarations(
    size: Size | undefined,
    axis: Axis,
    flexParentDirection: Option<CssDirection>,
  ): readonly CssDeclaration[] {
    if (size === undefined) {
      return [];
    }
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
  },
} as const;
