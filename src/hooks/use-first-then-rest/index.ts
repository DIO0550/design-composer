import { useRef } from "react";

/**
 * 区切ってから 1 回目だけ `first` を、2 回目以降は `rest` を返す並び。
 *
 * 呼んだ時点で 1 件目は済んだとみなす。返した値を受け手が捨てても、次は `rest` を返す。
 *
 * @param values 1 回目に返す値と、2 回目以降に返す値
 * @returns 区切る手続きと、次の値を返す手続き
 */
export function useFirstThenRest<T>(
  values: Readonly<{ first: T; rest: T }>,
): Readonly<{ restart: () => void; next: () => T }> {
  const hasStarted = useRef(false);

  return {
    /** 区切る。次の `next` はまた `first` を返す。 */
    restart: () => {
      hasStarted.current = false;
    },
    /**
     * 次の値を返す。iterator の `{ value, done }` ではなく値そのものを返す。
     *
     * @returns 区切ってから(または初めて)1 回目なら `first`、それ以外は `rest`
     */
    next: () => {
      const value = hasStarted.current ? values.rest : values.first;
      hasStarted.current = true;
      return value;
    },
  };
}
