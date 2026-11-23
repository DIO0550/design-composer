/**
 * 張る DOM のイベントリスナー 1 件。張り方と外し方を対で持ち、外すときに張ったときと同じ
 * 対象・種類・関数を渡し損ねないようにする。
 */
export type DomListener = Readonly<{
  attach: () => void;
  detach: () => void;
}>;

export const DomListener = {
  /**
   * `document` に張るリスナーを作る。
   *
   * @param type 待ち受けるイベントの種類
   * @param listener イベントが届いたときに呼ぶもの
   * @returns `document` へ張り、同じ組で外すリスナー
   */
  createOnDocument<K extends keyof DocumentEventMap>(
    type: K,
    listener: (event: DocumentEventMap[K]) => void,
  ): DomListener {
    return {
      attach: () => globalThis.document.addEventListener(type, listener),
      detach: () => globalThis.document.removeEventListener(type, listener),
    };
  },

  /**
   * `window` に張るリスナーを作る。
   *
   * @param type 待ち受けるイベントの種類
   * @param listener イベントが届いたときに呼ぶもの
   * @returns `window` へ張り、同じ組で外すリスナー
   */
  createOnWindow<K extends keyof WindowEventMap>(
    type: K,
    listener: (event: WindowEventMap[K]) => void,
  ): DomListener {
    return {
      attach: () => globalThis.window.addEventListener(type, listener),
      detach: () => globalThis.window.removeEventListener(type, listener),
    };
  },

  /**
   * 要素に張るリスナーを作る。`passive` にせず張るので、`preventDefault` で既定動作を止め
   * られる（要素へ直接張るのは、React が passive で張る `onWheel` では止められないとき）。
   *
   * @param element 張る先の要素
   * @param type 待ち受けるイベントの種類
   * @param listener イベントが届いたときに呼ぶもの
   * @returns 要素へ張り、同じ組で外すリスナー
   */
  createOnElement<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
  ): DomListener {
    return {
      attach: () =>
        element.addEventListener(type, listener, { passive: false }),
      detach: () => element.removeEventListener(type, listener),
    };
  },
} as const;
