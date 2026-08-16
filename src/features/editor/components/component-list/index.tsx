import type { PointerEvent as ReactPointerEvent } from "react";
import { ComponentAsset } from "@/domains/component";
import { TypeGlyph } from "@/features/editor/components/type-glyph";
import { NodeTemplate } from "@/features/editor/domains/node-template";
import type { AssetGrab } from "@/features/editor/types/AssetGrab";
import type { Option } from "@/utils/Option";

/** 使われていない部品の右端に出す語（UI 案は `×0` ではなくこの語を出す）。 */
const UnusedLabel = "unused";

/**
 * 行の背景。掴んでいる青（UI 案の `#e5f4ff` と左端の帯）と、選択中のインスタンスの
 * 出どころを示す紫（`#f3ebff` / `#9747ff`）は別物で、UI 案も別の画面で描き分けている。
 *
 * 掴んでいる間は掴んでいることを優先する（出どころは選択が変わらない限り残るので、
 * 掴んでいる最中に出どころを出すと、どちらの意味の色か読めなくなる）。
 *
 * @param isGrabbed 今この行を掴んでいるか
 * @param isSourceOfSelection 選択中のインスタンスの元がこの行か
 * @returns 背景と左端の帯を与える class。どちらでもなければ空文字
 */
function rowToneClass(
  isGrabbed: boolean,
  isSourceOfSelection: boolean,
): string {
  if (isGrabbed) {
    return "bg-[#e5f4ff] shadow-[inset_2px_0_0_#0d99ff]";
  }
  return isSourceOfSelection
    ? "bg-purple-50 shadow-[inset_2px_0_0_#9747ff]"
    : "";
}

/** 選択中のインスタンスの元になっている行に添える語（UI 案の綴り）。 */
const SourceOfSelectionLabel = "source of selection";

/**
 * 部品 1 件の行。名前の左に部品を表すアイコン、名前の下にその部品が公開している prop の
 * 名前、右端にドキュメント内での使用数を出す
 * （UI 案 docs/Design Composer.html の `primary-button / label / ×4`）。
 *
 * 使用数の綴りだけをここで決める。「使われていない」かどうかは部品の性質なので
 * `ComponentAsset.isUnused` が答え、こちらは `unused` と `×N` のどちらを書くかだけを持つ。
 *
 * 行に操作は付けない。掴んでキャンバスへ落とすのが唯一の挿入の入口で、押しても何も
 * 起きない（UI 案「Assets is browse-only … Insertion is drag-only」/ #203）。
 */
function ComponentRow({
  asset,
  isSourceOfSelection,
  isGrabbed,
  onGrab,
}: Readonly<{
  asset: ComponentAsset;
  isSourceOfSelection: boolean;
  isGrabbed: boolean;
  onGrab: (event: ReactPointerEvent<HTMLElement>) => void;
}>) {
  /*
   * 出どころの行では、公開 prop の名前を `source of selection` に譲る。
   * 両方を出すと 1 行に 2 段の補足が並び、UI 案が 1 段しか置いていない位置に
   * 収まらなくなる（公開 prop は右ペインの `Public props` が出している）。
   */
  const showsPublicProps =
    !isSourceOfSelection && asset.publicPropNames.length > 0;

  return (
    <li
      /*
       * 文字を選択させないのは、掴んで運ぶドラッグが範囲選択に化けるため
       * （キャンバスの artboard の枠と同じ理由）。掴んだまま画面を横断するので、
       * 選択の帯は左ペインだけでなく通り道の全体に残る。
       */
      className={`flex select-none items-center gap-1.5 rounded px-2 py-1 hover:bg-gray-100 ${rowToneClass(
        isGrabbed,
        isSourceOfSelection,
      )}`}
      onPointerDown={onGrab}
    >
      <TypeGlyph kind="component" />
      {/* 名前が余りを占める。flex の子は既定で内容幅より縮まないため省略には min-w-0 が要る */}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{asset.name}</span>
        {showsPublicProps ? (
          <span className="block truncate text-gray-400 text-xs">
            {asset.publicPropNames.join(", ")}
          </span>
        ) : null}
        {isSourceOfSelection ? (
          <span className="block truncate text-[#9747ff] text-xs">
            {SourceOfSelectionLabel}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-gray-400 text-xs">
        {ComponentAsset.isUnused(asset) ? UnusedLabel : `×${asset.refCount}`}
      </span>
    </li>
  );
}

/**
 * パレットの部品（UI 案 docs/Design Composer.html の `Assets` > `Components`。
 * `docs/06-ui.md`「画面構成」が左ペインの内容として挙げている部品一覧）。
 * 各行を掴んでキャンバスへ落とすとインスタンス（参照ノード）が挿さる
 * （docs/06-ui.md「編集操作の一覧」/ #203）。
 *
 * 見出しと件数は UI 案に合わせて左右に離して置く。
 *
 * 絞り込みはここでは行わない。何を出すかは検索欄を持つ `AssetsPanel` が決め、
 * ここは渡された並びを描くだけ。1 件も無いときに「部品がありません」と言わないのは、
 * 絞り込みで 0 件になっただけかもしれないから。件数は見出しの `0` が伝え、
 * 検索の結果として 0 件になったことは、検索語を持つ `AssetsPanel` が伝える。
 *
 * 部品は選択の対象にしない。選択できるのはキャンバスに描かれるもの、つまり
 * artboard とその配下のノードだけ（`EditorState` と同じ線引き）。選択中の
 * インスタンスの元になっている行は、選択ではなく**出どころ**として強調する
 * （UI 案 docs/Design Composer.html の `source of selection`）。
 */
export function ComponentList({
  assets,
  sourceName,
  grab,
}: Readonly<{
  assets: readonly ComponentAsset[];
  sourceName: Option<string>;
  grab: AssetGrab;
}>) {
  return (
    <section className="text-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-gray-500 text-xs uppercase">
          Components
        </h3>
        <span className="text-gray-400 text-xs">{assets.length}</span>
      </div>
      <ul>
        {assets.map((asset) => {
          const template: NodeTemplate = {
            kind: "instance",
            componentName: asset.name,
          };

          return (
            <ComponentRow
              key={asset.name}
              asset={asset}
              isSourceOfSelection={
                sourceName.some && sourceName.value === asset.name
              }
              isGrabbed={
                grab.dragged.some &&
                NodeTemplate.isSame(grab.dragged.value, template)
              }
              onGrab={(event) => grab.onGrab(template, event)}
            />
          );
        })}
      </ul>
    </section>
  );
}
