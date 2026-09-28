import type { MouseEvent } from "react";
import type { OpenRowContextMenu } from "@/features/editor/features/sidebar/types/LeftPaneContextMenuActions";

/**
 * 左ペインの行の右クリック。ツリーの行と `Artboards` の行が同じ読み替えをする。
 *
 * 凍結中かは見ない。左ペインは凍結中 `inert` になり、行の `contextmenu` は受け口まで
 * 届かない（Chromium で確認。happy-dom は `inert` をイベントに強制しないのでテストでは
 * 守れない）。
 */
export const RowContextMenuEvent = {
  /**
   * 行の右クリックを受けるハンドラ。ブラウザ既定のメニューを止め、行の名前と押した窓の
   * 座標を渡す。
   *
   * @param name 押された行のものの名前
   * @param open 名前と押した位置を受け取る先
   * @returns 行のボタンの `onContextMenu` に渡すハンドラ
   */
  handlerFor(
    name: string,
    open: OpenRowContextMenu,
  ): (event: MouseEvent<HTMLElement>) => void {
    return (event) => {
      event.preventDefault();
      open(name, { x: event.clientX, y: event.clientY });
    };
  },
} as const;
