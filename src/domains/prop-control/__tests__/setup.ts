import type { DocumentSelection } from "@/domains/document-selection";
import type { ColorToken } from "@/domains/token";
import { InstanceComposition } from "@/services/instance-composition";
import { Option } from "@/utils/Option";
import {
  type PropControl,
  type PropControlSection,
  PropShorthandControl,
  SelectionControls,
} from "../index";

/**
 * 選択中のものの編集欄。選択が無ければテストを落とす。
 *
 * 解除できるかの判定に実物の `InstanceComposition.isDetachable` を渡すのは、
 * ここで述語を自作すると解除可否のテストが自作した偽物を検証することになるため
 * （`rules/testing.md`「依存は実物を使う」）。依存方向が縛るのは本番コードの
 * import なので、`src/domains/prop-control/index.ts` からの `@/services` は 0 のまま。
 *
 * @param selection 選択の出どころ
 * @returns 選択中のものの編集欄
 */
function controlsOf(selection: DocumentSelection): SelectionControls {
  return Option.unwrap(
    SelectionControls.forSelection(selection, InstanceComposition.isDetachable),
  );
}

/**
 * `group` ごとのセクション。インスタンスを選んでいたらテストを落とす
 * （セクションを見るテストがインスタンスの状態で通ってしまうのを防ぐ）。
 *
 * @param selection 選択の出どころ
 * @returns 選択中のものの `group` ごとのセクション
 */
export function sectionsOf(
  selection: DocumentSelection,
): readonly PropControlSection[] {
  const controls = controlsOf(selection);
  if (controls.kind !== "groups") {
    throw new Error(`${controls.kind} の選択にセクションは無い`);
  }
  return controls.sections;
}

/**
 * インスタンスの編集欄。インスタンス以外を選んでいたらテストを落とす。
 *
 * @param selection 選択の出どころ
 * @returns 出どころの部品と公開 prop を持つ編集欄
 */
export function instanceOf(
  selection: DocumentSelection,
): Extract<SelectionControls, { kind: "instance" }> {
  const controls = controlsOf(selection);
  if (controls.kind !== "instance") {
    throw new Error("インスタンスを選んでいない");
  }
  return controls;
}

/**
 * セクション内の編集欄を、束ねた行を辺ごとにほどいて並べる。
 *
 * @param section ほどきたいセクション
 * @returns 行の順・束ねた行の中は上 右 下 左の順に並んだ編集欄
 */
export function controlsIn(
  section: PropControlSection,
): readonly PropControl[] {
  return section.rows.flatMap((row) =>
    row.kind === "prop"
      ? [row.control]
      : PropShorthandControl.sides(row.shorthand).map((side) => side.control),
  );
}

/**
 * セクションをまたいで prop 名だけを並べる。
 *
 * @param selection 選択の出どころ
 * @returns セクションの順・セクション内の宣言順に並んだ prop 名
 */
export function propNamesOf(selection: DocumentSelection): readonly string[] {
  return sectionsOf(selection).flatMap((section) =>
    controlsIn(section).map((control) => control.prop),
  );
}

/**
 * 名前で編集欄を 1 つ引く。
 *
 * @param controls 引き先の編集欄の並び
 * @param prop 引きたい prop 名
 * @returns その prop の編集欄。無ければテストを落とす
 */
export function controlNamed(
  controls: readonly PropControl[],
  prop: string,
): PropControl {
  return Option.unwrap(
    Option.fromNullable(controls.find((candidate) => candidate.prop === prop)),
  );
}

/**
 * 色のトークン参照の編集欄が持つ色。
 *
 * @param control 色を見たい編集欄
 * @returns 今効いている色。色のトークン参照でなければテストを落とす
 */
export function colorOfControl(
  control: PropControl | undefined,
): Option<ColorToken> {
  if (control?.input.kind !== "colorToken") {
    throw new Error("色のトークン参照の編集欄ではない");
  }
  return control.input.color;
}

/**
 * 数値のトークン参照の編集欄が持つ解決値。
 *
 * @param control 解決値を見たい編集欄
 * @returns 今効いているトークンの数値。数値のトークン参照でなければテストを落とす
 */
export function resolvedValueOfControl(
  control: PropControl | undefined,
): Option<number> {
  if (control?.input.kind !== "numericToken") {
    throw new Error("数値のトークン参照の編集欄ではない");
  }
  return control.input.resolvedValue;
}
