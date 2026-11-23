import { useLayoutEffect } from "react";
import { DomListener } from "@/libs/dom-event";

/**
 * 描画を画面へ出す前に `remeasure` を呼ぶ。コミットのたびと、ウィンドウの大きさが変わる
 * たびに呼ぶ。再レンダーを伴わない変化のうち拾えるのはウィンドウの大きさだけで、Web
 * フォント・画像の読み込み完了などは拾えない。
 *
 * 依存配列を持たずコミットのたびに測り直すのは、描かれ方が変わる原因が呼び出し側の状態
 * だけでなく上流の状態の変化でも起きるため。原因を依存に並べると、上流の状態が増える
 * たびに追随が要る。
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
    const unsubscribe = resize();

    return unsubscribe;
  });
}
