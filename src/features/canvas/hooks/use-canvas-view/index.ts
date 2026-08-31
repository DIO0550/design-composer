import {
  type ActionDispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useReducer,
  useRef,
} from "react";
import type { Offset } from "@/domains/unit/offset";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import { CanvasPointer } from "@/features/canvas/utils/CanvasPointer";

/** キャンバスの見え方に対する操作（docs/06-ui.md「ズーム / パンは非永続の view state」）。 */
export type CanvasViewAction =
  | Readonly<{ type: "zoom_in" }>
  | Readonly<{ type: "zoom_out" }>
  | Readonly<{ type: "reset" }>
  | Readonly<{ type: "pan"; delta: Offset }>
  | Readonly<{ type: "drag_start"; pointer: Offset }>
  | Readonly<{ type: "drag_move"; pointer: Offset }>
  | Readonly<{ type: "drag_end" }>;

/**
 * アクションの解釈だけを行い、倍率と位置の規則は CanvasView に委ねる。
 *
 * @param view 今の表示（倍率・位置・ドラッグ状態）
 * @param action 解釈するアクション
 * @returns 遷移後の表示
 */
function canvasViewReducer(
  view: CanvasView,
  action: CanvasViewAction,
): CanvasView {
  switch (action.type) {
    case "zoom_in":
      return CanvasView.zoomIn(view);
    case "zoom_out":
      return CanvasView.zoomOut(view);
    case "reset":
      return CanvasView.create();
    case "pan":
      return CanvasView.panBy(view, action.delta);
    case "drag_start":
      return CanvasView.startDrag(view, action.pointer);
    case "drag_move":
      return CanvasView.dragTo(view, action.pointer);
    case "drag_end":
      return CanvasView.endDrag(view);
  }
}

/**
 * ホイール操作を view の操作へ読み替える。
 * ctrl / ⌘ を押していればズーム、押していなければスクロール方向へのパン
 * （ホイールを下へ回すと中身が上へ動く = 見ている位置が下へ進む）。
 *
 * @param event 読み替える対象のホイールイベント
 * @returns ctrl / ⌘ が押されていればズーム、押されていなければパン
 */
function wheelAction(event: WheelEvent): CanvasViewAction {
  if (event.ctrlKey || event.metaKey) {
    return event.deltaY < 0 ? { type: "zoom_in" } : { type: "zoom_out" };
  }
  return { type: "pan", delta: { x: -event.deltaX, y: -event.deltaY } };
}

/**
 * ホイールをキャンバスの操作として扱う。
 * React の `onWheel` は passive で登録されるため `preventDefault()` が効かず、
 * ctrl + ホイールがブラウザ側のページズームも同時に起こしてしまう。
 * 要素の props で受けられないのはこの 1 点のためで、対象は `surface` 自身に限る。
 *
 * @param surface ホイールの登録先になるキャンバスの土台
 * @param dispatch 読み替えたアクションの送り先
 */
function useWheelControl(
  surface: RefObject<HTMLElement | null>,
  dispatch: ActionDispatch<[action: CanvasViewAction]>,
): void {
  useEffect(() => {
    const element = surface.current;
    if (element === null) {
      return;
    }
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      dispatch(wheelAction(event));
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [surface, dispatch]);
}

/** ドラッグ中のポインタを追い続けるための props。キャンバスの土台へ spread する。 */
export type PanHandlers = Readonly<{
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}>;

/** キャンバスの表示（倍率・位置）と、それを動かすハンドラ。 */
export type CanvasViewControl = Readonly<{
  view: CanvasView;
  /** ホイールの登録先。ズーム / パンの対象になる土台の要素へ渡す。 */
  surfaceRef: RefObject<HTMLDivElement | null>;
  panHandlers: PanHandlers;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}>;

/**
 * キャンバスのズーム / パンを預かる。
 * 1 回のドラッグで位置とドラッグ状態が同時に変わるため、useState を並べず
 * reducer へ統合する（rules/hooks.md）。
 *
 * @returns 今の表示と、ホイールの登録先・パンのハンドラ・ズーム / 初期化の操作
 */
export function useCanvasView(): CanvasViewControl {
  const [view, dispatch] = useReducer(canvasViewReducer, undefined, () =>
    CanvasView.create(),
  );
  const surfaceRef = useRef<HTMLDivElement>(null);

  useWheelControl(surfaceRef, dispatch);

  return {
    view,
    surfaceRef,
    panHandlers: {
      onPointerDown: (event) => {
        // ポインタが土台の外へ出てもドラッグが続くようにする（キャンバスは画面の端に接する）
        event.currentTarget.setPointerCapture(event.pointerId);
        dispatch({
          type: "drag_start",
          pointer: CanvasPointer.offsetOf(event),
        });
      },
      onPointerMove: (event) =>
        dispatch({ type: "drag_move", pointer: CanvasPointer.offsetOf(event) }),
      onPointerUp: (event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        dispatch({ type: "drag_end" });
      },
    },
    zoomIn: () => dispatch({ type: "zoom_in" }),
    zoomOut: () => dispatch({ type: "zoom_out" }),
    reset: () => dispatch({ type: "reset" }),
  };
}
