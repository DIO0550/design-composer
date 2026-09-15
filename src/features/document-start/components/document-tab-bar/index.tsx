import type { ReactElement } from "react";
import { TabBar } from "@/components/tab-bar";
import { OpenedDocuments } from "@/domains/session/opened-documents";
import { FilePath } from "@/utils/FilePath";
import { Option } from "@/utils/Option";

/**
 * 同時に開いているドキュメントを並べて、押した先へ移れるようにする帯
 * （docs/06-ui.md「開いているドキュメントの行き来」）。
 *
 * 出す字はファイル名だけにして、フルパスは `TabBar.Tab` の `name` へ渡す。名前を持たない
 * パス（`/` だけなど）では字を出さずに手がかりだけが残る（`EditorTopBar.Breadcrumb` と同
 * じ扱い）。
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
    <TabBar label="開いているドキュメント">
      {OpenedDocuments.documents(opened).map((document) => {
        const fileName = FilePath.fileName(document.path);

        return (
          <TabBar.Tab
            key={document.path}
            name={document.path}
            isCurrent={document.path === activePath}
            onSelect={() => onSelect(document.path)}
            onClose={() => onClose(document.path)}
          >
            {Option.isSome(fileName) && fileName.value}
          </TabBar.Tab>
        );
      })}
    </TabBar>
  );
}
