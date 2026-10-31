import { useCallback, useRef, useState } from "react";
import { Pointing } from "@/features/editor/features/canvas/domains/pointing";
import {
  type HeldModifierKey,
  useModifierKeyHold,
} from "@/features/editor/features/canvas/hooks/use-modifier-key-hold";
import { KeyTriggers } from "@/hooks/use-key-shortcut";
import { AltKey } from "@/libs/dom-event";
import { Option } from "@/utils/Option";

/**
 * そのキー操作の時点で、左右どちらの Alt / Option も押していないか。
 *
 * @param event 見るキー操作
 * @returns どちらも押していなければ真
 */
function releasesAlt(event: KeyboardEvent): boolean {
  return !AltKey.isHeld(event);
}

/** 選択しているだけのときの Alt / Option の距離を出す修飾キー。 */
const DistanceModifierKey: HeldModifierKey = {
  shortcut: {
    kind: KeyTriggers.PhysicalKey,
    codes: ["AltLeft", "AltRight"],
    withCommandKey: false,
    withShiftKey: false,
  },
  isReleasedBy: releasesAlt,
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
  const pointing = Option.some(next);
  return Option.equals(previous, pointing, Pointing.equals)
    ? previous
    : pointing;
}

/**
 * Alt / Option を押している間だけ、ポインタの指し先を返す（docs/06-ui.md「キャンバス直接
 * 操作」の、選択しているだけのときの Alt / Option の距離）。
 *
 * 指し先はキーを押していない間も覚えておく。ポインタを置いてから Alt を押しても、押した
 * 時点で出せるようにするため。押していない間に指し先が変わっても再レンダーしない。
 *
 * @returns 押している間の指し先と、指し先を伝える口
 */
export function useAltPointing(): AltPointingControl {
  const lastPointing = useRef<Pointing>(Pointing.Outside);
  const [pointing, setPointing] = useState<Option<Pointing>>(Option.none);

  const changeHold = useCallback((isHeld: boolean) => {
    const last = lastPointing.current;
    setPointing((previous) =>
      isHeld ? keepIfSame(previous, last) : Option.none,
    );
  }, []);
  useModifierKeyHold(DistanceModifierKey, changeHold);

  const trackPointer = useCallback((next: Pointing) => {
    lastPointing.current = next;
    setPointing((previous) =>
      Option.isSome(previous) ? keepIfSame(previous, next) : previous,
    );
  }, []);

  return { pointing, trackPointer };
}
