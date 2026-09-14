import type { ReactElement } from "react";
import { OpenedDocuments } from "@/domains/session/opened-documents";
import { FilePath } from "@/utils/FilePath";
import { Option } from "@/utils/Option";

/** 1 枚ぶんの見た目。見ているものだけ地を敷いて、下の帯とつながって見えるようにする。 */
const TabFace = {
  Active: "bg-[#f0f0f0] text-[#1e1e1e]",
  Inactive: "text-[#767676] hover:bg-[#f0f0f0]",
} as const;

/**
 * 開いているドキュメント 1 つぶんの見出し。
 *
 * フルパスは `title` に持たせる。名前を持たないパス（`/` だけなど）では字を出さずに
 * `title` だけが残る（`EditorTopBar.Breadcrumb` と同じ扱い）。
 *
 * @param path そのドキュメントの保存先
 * @param isActive 今見ているものか
 * @param onSelect 見る先をここへ移す手続き
 * @param onClose このドキュメントを閉じる手続き
 * @returns 名前の部分と閉じるボタンを並べた 1 枚
 */
function DocumentTab({
  path,
  isActive,
  onSelect,
  onClose,
}: Readonly<{
  path: string;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}>): ReactElement {
  const fileName = FilePath.fileName(path);

  return (
    <li
      className={`flex items-center border-[#e6e6e6] border-r ${
        isActive ? TabFace.Active : TabFace.Inactive
      }`}
    >
      <button
        type="button"
        title={path}
        aria-current={isActive}
        onClick={onSelect}
        className="max-w-40 truncate py-1 pr-1 pl-[10px] text-[11px]"
      >
        {Option.isSome(fileName) && fileName.value}
      </button>
      <button
        type="button"
        aria-label={`${path} を閉じる`}
        onClick={onClose}
        className="px-[6px] py-1 text-[11px] hover:text-[#1e1e1e]"
      >
        ×
      </button>
    </li>
  );
}

/**
 * 同時に開いているドキュメントを並べて、押した先へ移れるようにする帯
 * （docs/06-ui.md「開いているドキュメントの行き来」）。
 *
 * UI 案（`docs/Design Composer.html`）はドキュメントを 1 つ開いた画面しか描いておらず、
 * `tab` の綴りを持たない。そのため並べ方はここで決めている。UI 案の語彙から採ったのは
 * 1 枚ぶんの綴り（`#f0f0f0` / `#1e1e1e` / `#767676` / `#e6e6e6`、高さ 32px、11px）で、
 * 帯そのものの地と枠（`bg-white` / `border-gray-300`）は UI 案に無く、隣に並ぶ
 * `EditorTopBar` と `EditorLayout` に揃えている。
 *
 * `role="tablist"` にはしない。その role は矢印キーでの移動を約束するが、キーボードの導線
 * はまだ無い（読み上げにだけ「タブ」と名乗って動かないほうが混乱する）。
 *
 * @param opened 開いているドキュメントと、今見ているもの
 * @param onSelect 見る先を移す手続き
 * @param onClose 閉じる手続き
 * @returns 開いた順に並んだ見出しの帯
 */
export function DocumentTabBar({
  opened,
  onSelect,
  onClose,
}: Readonly<{
  opened: OpenedDocuments;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}>): ReactElement {
  const activePath = OpenedDocuments.activePath(opened);

  return (
    <nav
      aria-label="開いているドキュメント"
      className="shrink-0 border-gray-300 border-b bg-white"
    >
      <ul className="flex h-8 items-stretch overflow-x-auto">
        {OpenedDocuments.documents(opened).map((document) => (
          <DocumentTab
            key={document.path}
            path={document.path}
            isActive={document.path === activePath}
            onSelect={() => onSelect(document.path)}
            onClose={() => onClose(document.path)}
          />
        ))}
      </ul>
    </nav>
  );
}
