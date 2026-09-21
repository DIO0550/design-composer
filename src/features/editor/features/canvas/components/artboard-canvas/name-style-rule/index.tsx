import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import { Css } from "@/utils/Css";

/**
 * 名前で指した要素だけに効く規則をキャンバスへ差し込む。
 *
 * キャンバスの中身は文字列の HTML を流し込んでおり React の管理下に無いため、
 * 特定の要素へ class を足せない。出力に残っているノード名の属性を選択子にして、
 * 規則を 1 本だけ差し込む。名前はドキュメント全体で一意なので、
 * この 1 本が指すのは狙った artboard / ノードだけになる。
 *
 * @param name 指したい artboard / ノードの名前
 * @returns その名前の属性に当たる属性選択子
 */
export function nameSelector(name: string): string {
  return `[${ElementNameAttribute}="${Css.escapeQuotedString(name)}"]`;
}

/** 1 ノード分の宣言を、名前で引く選択子の規則としてキャンバスへ差し込む。 */
export function NameStyleRule({
  name,
  declarations,
}: Readonly<{ name: string; declarations: string }>) {
  return <style>{`${nameSelector(name)}{${declarations}}`}</style>;
}
