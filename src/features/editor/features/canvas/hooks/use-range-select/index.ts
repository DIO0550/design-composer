import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useReducer,
} from "react";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Offset } from "@/domains/unit/offset";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import {
  RangeSelect,
  RangeSelectDrag,
} from "@/features/editor/features/canvas/domains/range-select";
import { CanvasPointer } from "@/features/editor/features/canvas/utils/CanvasPointer";
import { DrawnBounds } from "@/features/editor/features/canvas/utils/DrawnBounds";
import { PointerButton } from "@/libs/dom-event";
import { Option } from "@/utils/Option";

/**
 * その範囲に重なって描かれている、選べるものの名前。
 *
 * 候補はドキュメントが答え（artboard 直下の子）、そのうちどれが重なっているかは
 * 実測が答える（描かれた位置はドキュメントからは分からない）。
 *
 * @param designDocument 候補の出どころ
 * @param range 重なりを見る範囲
 * @returns 重なって描かれているものの名前。1 つも無ければ空
 */
function namesWithin(
  designDocument: DesignDocument,
  range: RangeSelect,
): readonly string[] {
  return DrawnBounds.collectOverlappingNames(
    DesignDocument.collectArtboardChildNames(designDocument),
    RangeSelect.bounds(range),
  );
}

/** 範囲選択の状態を進める指示。 */
type RangeSelectAction =
  | Readonly<{ type: "grab"; from: Offset }>
  | Readonly<{ type: "move"; to: Offset }>
  | Readonly<{ type: "release"; at: Offset }>
  | Readonly<{ type: "stop_drawing" }>
  | Readonly<{ type: "consume_click" }>;

/**
 * 範囲選択の状態遷移。判定は `RangeSelectDrag` が持つので、ここは指示を配るだけ。
 *
 * @param drag 今の状態
 * @param action 進める指示
 * @returns 進めたあとの状態
 */
function rangeSelectReducer(
  drag: RangeSelectDrag,
  action: RangeSelectAction,
): RangeSelectDrag {
  switch (action.type) {
    case "grab":
      return RangeSelectDrag.grab(action.from);
    case "move":
      return RangeSelectDrag.extendedTo(drag, action.to);
    case "release":
      return RangeSelectDrag.release(
        RangeSelectDrag.extendedTo(drag, action.at),
      );
    case "stop_drawing":
      return RangeSelectDrag.stopDrawing(drag);
    case "consume_click":
      return RangeSelectDrag.consumesClick(drag)
        ? RangeSelectDrag.create()
        : drag;
  }
}

/** 引いている範囲と、それを引くためのポインタの受け口。 */
export type RangeSelectControl = Readonly<{
  /** 今引いている範囲の矩形（client 座標）。引いていなければ `none`。 */
  bounds: Option<CanvasBounds>;
  dragHandlers: Readonly<{
    /** 押した場所によらず、前の操作の飲み込み待ちを解く（土台の capture で受ける）。 */
    onPointerDownCapture: () => void;
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    /** 引いて離した直後の `click` を飲み込む（選択に使わせない / `RangeSelectDrag` の `drawn`）。 */
    onClickCapture: (event: ReactMouseEvent<HTMLElement>) => void;
    /** 離さないまま捕捉が外れたら（`pointercancel` など）引くのをやめる。 */
    onLostPointerCapture: () => void;
  }>;
}>;

/**
 * ポインタを捕捉する要素。押した要素そのもので捕捉する。
 *
 * 捕捉した要素に `click` が出る（Chromium で実測）ので、土台で捕捉すると artboard の背景を
 * 押して離しただけの `click` が枠の `onClick` へ届かず、artboard を選べなくなる。
 * **happy-dom のテストでは守れない**（`click` の行き先をテストが決める）。
 *
 * @param event 土台で受けた `pointerdown`
 * @returns 押した要素（ポインタのイベントは要素にしか出ないので、土台へ倒れる枝は型を絞るため
 *   だけにある）
 */
function captureTargetOf(event: ReactPointerEvent<HTMLElement>): Element {
  return event.target instanceof Element ? event.target : event.currentTarget;
}

/**
 * 空き領域か artboard の背景から範囲を引いて、重なったものをまとめて選ぶ（docs/06-ui.md
 * 「範囲選択」）。
 *
 * 拾う候補はドキュメントが答え（artboard 直下の子）、どれが範囲に重なっているかは実測が
 * 答える（描かれた位置はドキュメントからは分からない）。ここが持つのは引いている最中の
 * 状態だけで、矩形にするのも閾値の判定も `RangeSelect` / `RangeSelectDrag` にある
 * （rules/hooks.md「hooks はドメインロジックを持たない」）。
 *
 * **引いていないときの `pointerup` では何もしない。** 土台の `pointerup` には別の場所（パ
 * レットの行など）で始まったドラッグの解放も届くため、始めていない操作の終わりで選択を
 * 空にすると、そのたびに選択が消える。
 *
 * @param params 候補の出どころのドキュメントと、選ぶ相手が決まったときに呼ぶ手
 *   続き
 * @returns 引いている範囲と、土台へ渡すポインタのハンドラ
 */
export function useRangeSelect(
  params: Readonly<{
    designDocument: DesignDocument;
    onSelect: (names: readonly string[]) => void;
  }>,
): RangeSelectControl {
  const { designDocument, onSelect } = params;
  const [drag, dispatch] = useReducer(
    rangeSelectReducer,
    undefined,
    RangeSelectDrag.create,
  );

  /**
   * 今の位置まで伸ばした範囲（選び直す相手を決める）。状態の遷移は reducer が同じ関数で
   * 進めるので、ここは選ぶ相手を出すためだけに使う。
   */
  const rangeTo = (event: ReactPointerEvent<HTMLElement>) =>
    RangeSelectDrag.range(
      RangeSelectDrag.extendedTo(drag, CanvasPointer.offsetOf(event)),
    );

  return {
    /*
     * 枠を出すのは引かれてからにする。押した瞬間から出すと、選択のつもりの
     * クリックのたびに 0 面積の枠が一瞬映る（選ぶ相手を決める閾値とも揃う）。
     */
    bounds: Option.flatMap(RangeSelectDrag.range(drag), (range) =>
      range.isDrawn ? Option.some(RangeSelect.bounds(range)) : Option.none,
    ),
    dragHandlers: {
      /*
       * 引いて離したあとに `click` が来ないまま次の操作が始まると、飲み込み待ちが残って
       * そのクリックを食べる。次の操作の始まりで解く。枠は `pointerdown` を止めるが、
       * capture はその前に通る。
       */
      onPointerDownCapture: () => dispatch({ type: "consume_click" }),
      onPointerDown: (event) => {
        // 右ボタンのドラッグでは引き始めない（パンは capture 側が先に取る）
        if (!PointerButton.isPrimary(event)) {
          return;
        }
        // ポインタが土台の外へ出ても引き続けられるようにする（キャンバスは画面の端に接する）
        captureTargetOf(event).setPointerCapture(event.pointerId);
        dispatch({ type: "grab", from: CanvasPointer.offsetOf(event) });
      },
      onPointerMove: (event) => {
        const range = rangeTo(event);
        if (!Option.isSome(range)) {
          return;
        }
        dispatch({ type: "move", to: CanvasPointer.offsetOf(event) });
        /*
         * 離すまで待たず、引いている間ずっと選び直す。選択そのものを動かすので、
         * キャンバスの枠・ツリー・インスペクタが同じ 1 つの選択を映したまま追随する。
         * **選択が変わってもコンパイルはやり直さない**ことが前提で（`ArtboardCanvas`
         * の `useMemo`）、崩れると 1 回のドラッグで何度も木を作り直すことになる。
         */
        if (range.value.isDrawn) {
          onSelect(namesWithin(designDocument, range.value));
        }
      },
      onPointerUp: (event) => {
        const range = rangeTo(event);
        if (!Option.isSome(range)) {
          return;
        }
        // 捕捉は `pointerup` で暗黙に外れるので、ここでは触らない（捕捉した要素は押した要素）
        dispatch({ type: "release", at: CanvasPointer.offsetOf(event) });
        /*
         * 離した位置で選び直す。動かしている間も選んでいるが、最後の `pointermove` と
         * 離した位置が同じとは限らない。一度も引かれていない（手ぶれ）なら選択に
         * 手を付けない（`RangeSelect` の `isDrawn` の doc）。
         */
        if (!range.value.isDrawn) {
          return;
        }
        onSelect(namesWithin(designDocument, range.value));
      },
      /*
       * `click` は捕捉した要素（押した要素）に出るので、artboard の背景から引いた回は枠まで
       * 上がり、範囲で選んだものを artboard の選択で上書きする。外側の余白から引いた回は
       * 土台に出る。どちらも受けられるいちばん外側のここで、bubble より先に capture で取る。
       */
      onClickCapture: (event) => {
        if (!RangeSelectDrag.consumesClick(drag)) {
          return;
        }
        event.stopPropagation();
        dispatch({ type: "consume_click" });
      },
      /*
       * 捕捉は離したときにも外れ、`pointerup` → `lostpointercapture` → `click` の順に届く
       * （Chromium で実測）。引いている間だけ止めるので、離した直後の飲み込み待ちは残る。
       */
      onLostPointerCapture: () => dispatch({ type: "stop_drawing" }),
    },
  };
}
