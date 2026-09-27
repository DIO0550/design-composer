import { CanvasDom } from "@/libs/canvas-dom";

/**
 * 1 ノード分の宣言を、名前で引く選択子の規則としてキャンバスへ差し込む。
 *
 * キャンバスの中身は文字列の HTML を流し込んでおり React の管理下に無いため、
 * 特定の要素へ class を足せない。出力に残っているノード名の属性を選択子にして、
 * 規則を 1 本だけ差し込む。選択子はその名前で描かれている要素すべてに当たるので、
 * 部品の中のノードの名前を渡すと全インスタンスに効く（`CanvasDom`）。
 *
 * @param name 指したい artboard / ノードの名前
 * @param declarations 差し込む宣言（`{}` の中身）
 */
export function NameStyleRule({
  name,
  declarations,
}: Readonly<{ name: string; declarations: string }>) {
  return <style>{`${CanvasDom.selectorOf(name)}{${declarations}}`}</style>;
}
