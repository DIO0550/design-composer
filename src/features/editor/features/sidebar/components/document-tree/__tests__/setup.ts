import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";

/**
 * 行を 2 つ並べ、何も選んでいない対。行ごとの操作（名前の変更・右クリック）を
 * 対象の行と対照の行で見るのに使う。
 *
 * @returns 何も選んでいない、ドキュメントと選択の対
 */
export function setupSelection(): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text" },
            { name: "lead", type: "Text" },
          ],
        },
      ],
    }),
    [],
  );
}
