/**
 * 張る DOM のイベントリスナー 1 件。呼ぶと張り、外し方を返す。張り方と外し方を対で持ち、
 * 外すときに張ったときと同じ対象・種類・関数を渡し損ねないようにする。
 */
export type DomListener = () => () => void;

export const DomListener = {
  /**
   * `document` に張るリスナーを作る。
   *
   * @param type 待ち受けるイベントの種類
   * @param listener イベントが届いたときに呼ぶもの
   * @returns 呼ぶと `document` へ張り、同じ組で外す手続きを返すリスナー
   */
  createOnDocument<K extends keyof DocumentEventMap>(
    type: K,
    listener: (event: DocumentEventMap[K]) => void,
  ): DomListener {
    return () => {
      globalThis.document.addEventListener(type, listener);
      return () => globalThis.document.removeEventListener(type, listener);
    };
  },

  /**
   * `window` に張るリスナーを作る。
   *
   * @param type 待ち受けるイベントの種類
   * @param listener イベントが届いたときに呼ぶもの
   * @returns 呼ぶと `window` へ張り、同じ組で外す手続きを返すリスナー
   */
  createOnWindow<K extends keyof WindowEventMap>(
    type: K,
    listener: (event: WindowEventMap[K]) => void,
  ): DomListener {
    return () => {
      globalThis.window.addEventListener(type, listener);
      return () => globalThis.window.removeEventListener(type, listener);
    };
  },

  /**
   * 要素に張るリスナーを作る。`passive` にせず張るので、`preventDefault` で既定動作を止め
   * られる。React の `onWheel` は passive で登録されて `preventDefault` が効かないため、
   * 既定動作を止めたいホイールはこれで要素へ直接張る。
   *
   * @param element 張る先の要素
   * @param type 待ち受けるイベントの種類
   * @param listener イベントが届いたときに呼ぶもの
   * @returns 呼ぶと要素へ張り、同じ組で外す手続きを返すリスナー
   */
  createOnElement<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
  ): DomListener {
    return () => {
      element.addEventListener(type, listener, { passive: false });
      return () => element.removeEventListener(type, listener);
    };
  },
} as const;
