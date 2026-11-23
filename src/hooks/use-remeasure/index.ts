import { useLayoutEffect } from "react";
import { DomListener } from "@/libs/dom-event";

/**
 * 描画を画面へ出す前に `remeasure` を呼ぶ。コミットのたびと、ウィンドウの大きさが変わる
 * たびに呼ぶ（再レンダーを伴わない位置の変化のうち、拾えるのはウィンドウの大きさだけ）。
 *
 * @param remeasure 今の描かれ方を測り直す手続き
 */
export function useRemeasure(remeasure: () => void): void {
  useLayoutEffect(() => {
    remeasure();
    /*
     * リスナーもコミットのたびに張り直す。1 度だけ張ると、最初の `remeasure` を掴んだまま
     * になり、測る相手を変えたあとに古い相手を測り続ける。
     */
    const resize = DomListener.createOnWindow("resize", remeasure);
    resize.attach();
    return resize.detach;
  });
}
