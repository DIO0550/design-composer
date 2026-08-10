import type { ColorToken } from "@/domains/token";
import type { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import {
  type PropControl,
  type PropControlSection,
  SelectionControls,
} from "../index";

/**
 * 選択中のものの編集欄。選択が無ければテストを落とす。
 *
 * @param state 選択の出どころ
 * @returns 選択中のものの編集欄
 */
function controlsOf(state: EditorState): SelectionControls {
  return Option.unwrap(SelectionControls.forSelection(state));
}

/**
 * `group` ごとのセクション。インスタンスを選んでいたらテストを落とす
 * （セクションを見るテストがインスタンスの状態で通ってしまうのを防ぐ）。
 *
 * @param state 選択の出どころ
 * @returns 選択中のものの `group` ごとのセクション
 */
export function sectionsOf(state: EditorState): readonly PropControlSection[] {
  const controls = controlsOf(state);
  if (controls.kind !== "groups") {
    throw new Error(`${controls.source} のインスタンスにセクションは無い`);
  }
  return controls.sections;
}

/**
 * インスタンスの編集欄。インスタンス以外を選んでいたらテストを落とす。
 *
 * @param state 選択の出どころ
 * @returns 出どころの部品と公開 prop を持つ編集欄
 */
export function instanceOf(
  state: EditorState,
): Extract<SelectionControls, { kind: "instance" }> {
  const controls = controlsOf(state);
  if (controls.kind !== "instance") {
    throw new Error("インスタンスを選んでいない");
  }
  return controls;
}

/**
 * セクションをまたいで prop 名だけを並べる。
 *
 * @param state 選択の出どころ
 * @returns セクションの順・セクション内の宣言順に並んだ prop 名
 */
export function propNamesOf(state: EditorState): readonly string[] {
  return sectionsOf(state).flatMap((section) =>
    section.controls.map((control) => control.prop),
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
