import { useCallback, useEffect, useRef, useState } from "react";
import { Pointing } from "@/features/editor/features/canvas/domains/pointing";
import { KeyShortcut, KeyTriggers } from "@/hooks/use-key-shortcut";
import { AltKey } from "@/libs/dom-event";
import { Option } from "@/utils/Option";

/**
 * 選択しているだけのときの Alt / Option の距離を出す修飾キー。
 *
 * 押下の判定と「フォーカスのある要素に食われるか」を `KeyShortcut` へ委ねるために、割り
 * 当てと同じ形で持つ（`useSpaceHeld` のパンの修飾キーと同じ）。
 */
const DistanceModifierKeyCodes: readonly string[] = ["AltLeft", "AltRight"];

const DistanceModifierKey: KeyShortcut = {
  kind: KeyTriggers.PhysicalKey,
  codes: DistanceModifierKeyCodes,
  withCommandKey: false,
  withShiftKey: false,
};

/** Alt / Option を押している間の、ポインタの指し先と、指し先を伝える口。 */
export type AltPointingControl = Readonly<{
  /** Alt / Option を押している間だけ、ポインタの今の指し先。離している間は `none` */
  pointing: Option<Pointing>;
  /** ポインタが指している先が変わったことを伝える */
  trackPointer: (pointing: Pointing) => void;
}>;

/**
 * 前の値と指し先が同じなら前の値を、違えば新しい指し先を返す。
 *
 * @param previous 今持っている値
 * @param next 新しい指し先
 * @returns 指し先が変わらなければ `previous` そのもの
 */
function keepIfSame(
  previous: Option<Pointing>,
  next: Pointing,
): Option<Pointing> {
  const isSame =
    Option.isSome(previous) && Pointing.equals(previous.value, next);
  return isSame ? previous : Option.some(next);
}

/**
 * Alt / Option を押している間だけ、ポインタの指し先を返す（docs/06-ui.md「キャンバス直接
 * 操作」の、選択しているだけのときの Alt / Option の距離）。
 *
 * 指し先はキーを押していない間も覚えておく。ポインタを置いてから Alt を押しても、押した
 * 時点で出せるようにするため。フォーカスのある要素がキーを受け取る間（`isConsumedBy`）は
 * 押しても出さず、ウィンドウを離れたら解く（戻ってきたときに離した Alt の keyup は届かない）。
 *
 * @returns 押している間の指し先と、指し先を伝える口
 */
export function useAltPointing(): AltPointingControl {
  const lastPointing = useRef<Pointing>(Pointing.Outside);
  const [pointing, setPointing] = useState<Option<Pointing>>(Option.none);

  useEffect(() => {
    const hold = (event: KeyboardEvent) => {
      const startsDistance =
        DistanceModifierKeyCodes.includes(event.code) &&
        !KeyShortcut.isConsumedBy(DistanceModifierKey, event.target);
      if (startsDistance) {
        setPointing((previous) => keepIfSame(previous, lastPointing.current));
      }
    };
    const release = (event: KeyboardEvent) => {
      if (!AltKey.isHeld(event)) {
        setPointing(Option.none);
      }
    };
    const clear = () => setPointing(Option.none);

    globalThis.document.addEventListener("keydown", hold);
    globalThis.document.addEventListener("keyup", release);
    globalThis.window.addEventListener("blur", clear);
    return () => {
      globalThis.document.removeEventListener("keydown", hold);
      globalThis.document.removeEventListener("keyup", release);
      globalThis.window.removeEventListener("blur", clear);
    };
  }, []);

  const trackPointer = useCallback((next: Pointing) => {
    lastPointing.current = next;
    setPointing((previous) =>
      Option.isSome(previous) ? keepIfSame(previous, next) : previous,
    );
  }, []);

  return { pointing, trackPointer };
}
