import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import type { Props } from "@/domains/node";
import type { ColorToken } from "@/domains/token";
import { Option } from "@/utils/Option";
import {
  type DetachableCheck,
  type PropControl,
  type PropControlSection,
  PropShorthandControl,
  SelectionControls,
} from "../index";

/**
 * 解除できないことにする判定。
 *
 * 解除できるかの規則そのものは `services/instance-composition` のテストが、
 * パネルがその規則を渡していることは `property-panel.instance.test.tsx` が持つ。
 * ここが見るのは**渡された答えがそのまま `isDetachable` に載るか**なので、
 * 判定はテストが渡す（`src/domains/` から `@/services` を引かないため）。
 */
const NotDetachable: DetachableCheck = () => false;

/**
 * Box を 1 つ選んだ状態。
 *
 * @param props その Box に設定する props
 * @returns その Box を選んでいるドキュメントと選択の対
 */
export function boxSelection(props: Props): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [{ name: "box", type: "Box", props }],
        },
      ],
    }),
    ["box"],
  );
}

/**
 * 選択中のものの編集欄。選択が無ければテストを落とす。
 *
 * @param selection 選択の出どころ
 * @param isDetachable インスタンスを解除できるかを答える判定
 * @returns 選択中のものの編集欄
 */
function controlsOf(
  selection: DocumentSelection,
  isDetachable: DetachableCheck = NotDetachable,
): SelectionControls {
  return Option.unwrap(SelectionControls.forSelection(selection, isDetachable));
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
 * @param isDetachable インスタンスを解除できるかを答える判定
 * @returns 出どころの部品と公開 prop を持つ編集欄
 */
export function instanceOf(
  selection: DocumentSelection,
  isDetachable: DetachableCheck = NotDetachable,
): Extract<SelectionControls, { kind: "instance" }> {
  const controls = controlsOf(selection, isDetachable);
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
