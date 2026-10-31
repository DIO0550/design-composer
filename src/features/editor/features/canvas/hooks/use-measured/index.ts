import { useLayoutEffect, useState } from "react";
import { Option } from "@/utils/Option";

/**
 * 描かれているものを測った結果を、変わるたびに追いかけて返す。
 *
 * **依存配列を持たず毎コミット測り直す。** 位置が動く原因はキャンバス自身のドキュメント
 * / 倍率だけでなく、トークン選択やエラー一覧の出入りで中央ペインの高さが変わることでも
 * 起きるため、原因を列挙して deps に並べると上流の状態が増えるたびに追随が要る。測り直
 * した値が前と同じなら**同じ参照を返して再レンダーを止める**。
 *
 * 拾えないのは**再レンダーを伴わない位置変化**（Web フォントや画像の読み込み完了）。ウ
 * ィンドウの大きさの変化だけは再レンダーが起きないので明示的に購読する。
 *
 * @param measure 今の描かれ方を測る手続き。測れなければ `none`
 * @param equals 前の結果と測り直した結果が同じかを比べる関数
 * @returns 最後に測った結果。測れなければ `none`
 */
export function useMeasured<T>(
  measure: () => Option<T>,
  equals: (value: T, other: T) => boolean,
): Option<T> {
  const [measured, setMeasured] = useState<Option<T>>(Option.none);

  useLayoutEffect(() => {
    const remeasure = () => {
      setMeasured((previous) => {
        const next = measure();
        return Option.equals(previous, next, equals) ? previous : next;
      });
    };

    remeasure();
    /*
     * 購読も毎コミット張り直す。`[]` で 1 度だけ張ると、リスナーが最初の `measure` を
     * 掴んだままになり、測る相手を変えたあとに古い相手を測り続ける。
     */
    globalThis.window.addEventListener("resize", remeasure);
    return () => globalThis.window.removeEventListener("resize", remeasure);
  });

  return measured;
}
