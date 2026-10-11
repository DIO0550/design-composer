import { type ActionCardContent, ActionCardTones } from "../index";

/*
 * ストーリーとテストが ActionCard に渡すカードの中身の見本。綴りは呼び出し側（開始画面）と重ならないものにしている。
 *
 * ストーリーファイルに直に書かないのは、`title:` の行が既定 export の title と並ぶと
 * story の title の検査（`story-title-violations.py`）が title を一意に取れないため。
 */

/** 勧め分けをしない配色の見本（書き出す）。 */
export const ExportContent: ActionCardContent = {
  title: "書き出す",
  description: "選んだ部品を画像にする",
  shortcut: "⌘E",
  iconPaths: ["M12 5v14", "M19 12l-7 7-7-7"],
  tone: ActionCardTones.Normal,
};

/** いちばん勧めたい配色の見本（取り込む）。 */
export const ImportContent: ActionCardContent = {
  title: "取り込む",
  description: "別のファイルの部品を使う",
  shortcut: "⌘I",
  iconPaths: ["M12 19V5", "M5 12l7-7 7 7"],
  tone: ActionCardTones.Primary,
};
