import {
  type OperatingSystem,
  OperatingSystems,
} from "@/libs/operating-system";

/*
 * 人が読む 1 行への綴りは表示側の関心事なので、割り当てを併記する部品が共に使えるここに置く
 * （rules/architecture.md「ロジックの帰属先」）。domains は production から libs を import できず、
 * 綴りを選ぶのに要る `OperatingSystem` を受け取れない。
 */

/**
 * 併記するキーボードの割り当て。綴りは OS ごとに変わるので、ここではキーと修飾だけを持つ。
 */
export type ShortcutNotation =
  | Readonly<{ kind: "plain"; key: string }>
  | Readonly<{ kind: "command"; key: string; withShiftKey: boolean }>;

/**
 * コマンドキー付きの割り当てを、動いている OS の綴りにする。
 *
 * @param notation コマンドキー付きの割り当て
 * @param operatingSystem アプリが動いている OS
 * @returns `ShortcutNotation.toText` の、コマンドキー付きの場合の綴り
 */
function commandText(
  notation: Extract<ShortcutNotation, { kind: "command" }>,
  operatingSystem: OperatingSystem,
): string {
  switch (operatingSystem) {
    case OperatingSystems.MacOs:
      return notation.withShiftKey
        ? `Shift+⌘${notation.key}`
        : `⌘${notation.key}`;
    case OperatingSystems.Other:
      return notation.withShiftKey
        ? `Ctrl+Shift+${notation.key}`
        : `Ctrl+${notation.key}`;
  }
}

/** 併記する割り当ての綴り。 */
export const ShortcutNotation = {
  /**
   * 割り当てを、動いている OS の綴りにする（docs/06-ui.md「コンテキストメニュー」の表記）。
   *
   * @param notation 併記する割り当て
   * @param operatingSystem アプリが動いている OS
   * @returns macOS なら `⌘X` / `Shift+⌘X`、それ以外なら `Ctrl+X` / `Ctrl+Shift+X`。修飾の無いキーはそのまま
   */
  toText(notation: ShortcutNotation, operatingSystem: OperatingSystem): string {
    switch (notation.kind) {
      case "plain":
        return notation.key;
      case "command":
        return commandText(notation, operatingSystem);
    }
  },
} as const;
