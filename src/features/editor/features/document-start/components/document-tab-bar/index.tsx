import type { ReactElement } from "react";
import { TabBar } from "@/components/tab-bar";
import { OpenedDocuments } from "@/domains/session/opened-documents";
import { FilePath } from "@/domains/unit/file-path";
import type { IndexMove } from "@/types/IndexMove";

/**
 * 同時に開いているドキュメントを並べて、押した先へ移れ、掴んで並べ替えられるようにする帯
 * （docs/06-ui.md「開いているドキュメントの行き来」）。
 *
 * 出す字はファイル名だけにして、フルパスは `TabBar.Tab` の `name` へ渡す。
 *
 * @param opened 開いているドキュメントと、今見ているもの
 * @param onSelect 見る先を移す手続き
 * @param onClose 閉じる手続き
 * @param onReorder 並びの別の位置へ移す手続き
 * @returns `opened` の並び順に並んだ見出しの帯
 */
export function DocumentTabBar({
  opened,
  onSelect,
  onClose,
  onReorder,
}: Readonly<{
  opened: OpenedDocuments;
  onSelect: (path: FilePath) => void;
  onClose: (path: FilePath) => void;
  onReorder: (move: IndexMove) => void;
}>): ReactElement {
  const activePath = OpenedDocuments.activePath(opened);

  return (
    <TabBar label="開いているドキュメント" onReorder={onReorder}>
      {OpenedDocuments.documents(opened).map((document, index) => {
        const fileName = FilePath.fileName(document.path);

        return (
          <TabBar.Tab
            key={document.path}
            name={document.path}
            index={index}
            isCurrent={document.path === activePath}
            onSelect={() => onSelect(document.path)}
            onClose={() => onClose(document.path)}
          >
            {fileName}
          </TabBar.Tab>
        );
      })}
    </TabBar>
  );
}
