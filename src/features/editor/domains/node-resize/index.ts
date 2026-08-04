import type { Artboard } from "@/domains/artboard";
import { AxisLength } from "@/domains/axis-length";
import { AXES } from "@/domains/css-direction";
import { DesignDocument } from "@/domains/design-document";
import { Node, type Props } from "@/domains/node";
import { Size } from "@/domains/size";
import {
  CanvasOffset,
  CanvasView,
} from "@/features/editor/domains/canvas-view";
import type { EditorState } from "@/features/editor/domains/editor-state";
import { CanvasBounds } from "@/features/editor/domains/node-drop";
import { Option } from "@/utils/Option";

/**
 * ハンドルの太さ（画面上の px）。
 * 描く帯の幅と掴める帯の幅を同じ値にして、見えているところがそのまま掴めるようにする。
 */
export const RESIZE_HANDLE_THICKNESS_PX = 8;

/**
 * キャンバス上でリサイズハンドルを掴んでから離すまでの状態
 * （docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
 *
 * 掴んだ辺と押した位置を持つのは掴んでいる間だけ、と状態ごとに持つものが変わるため
 * 直和で列挙する（「掴んでいないのに掴んだ辺がある」を作れなくするため）。
 *
 * `resized` は離した直後の状態。ブラウザは `pointerup` のあとに `click` を発火させるので、
 * これを挟まないと大きさを変えただけで選択が動く（選択は `EditorState` の担当 / #35）。
 */
export type NodeResize =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "resizing"; handle: AxisLength; origin: CanvasOffset }>
  | Readonly<{ kind: "resized" }>;

/** artboard は 2 軸とも `fixed` 固定なので、常にどちらの辺も掴める（docs/03）。 */
function artboardHandles(artboard: Artboard): readonly AxisLength[] {
  return [
    AxisLength.create("width", artboard.width),
    AxisLength.create("height", artboard.height),
  ];
}

/**
 * `fixed` の軸だけを掴める（docs/06-ui.md「`hug` / `fill` ではハンドルを出さない」）。
 *
 * モードが `fixed` でも長さが未設定なら出さない。掴んだ時点の長さが無いと
 * ドラッグの基準が決まらないため（長さはプロパティパネルから入れる）。
 */
function propsHandles(props: Props): readonly AxisLength[] {
  return Object.values(AXES).flatMap((axis) => {
    const length = Size.fixedLength(
      Size.create(props[Size.modeProp(axis)], props[axis]),
    );
    return length.some ? [AxisLength.create(axis, length.value)] : [];
  });
}

/**
 * 参照ノードにはハンドルを出さない。インスタンスが上書きできるのは publicProps に
 * 宣言のある prop だけで、宣言の追加は AI / JSON 編集の担当（docs/06-ui.md「部品化」）。
 * 出すと「掴めるのに何も起きない」操作になる。
 */
function nodeHandles(node: Node): readonly AxisLength[] {
  return Node.isRef(node) ? [] : propsHandles(node.props ?? {});
}

export const NodeResize = {
  /** 何も掴んでいない状態から始める。 */
  create(): NodeResize {
    return { kind: "idle" };
  },

  /**
   * 選択中の artboard / ノードに出すハンドルと、掴んだ時点の長さ
   * （docs/06-ui.md「リサイズハンドル」）。
   *
   * 対象を選択から決めるのは、キャンバスがハンドルを描くのが選択中のものだけであり、
   * 名前で受け取れる形にすると「選択していないものにハンドルが出る」状態を
   * 呼び出し側が作れてしまうため。
   */
  handles(state: EditorState): readonly AxisLength[] {
    if (!state.selectedName.some) {
      return [];
    }
    const name = state.selectedName.value;
    const artboard = DesignDocument.findArtboard(state.document, name);
    if (artboard.some) {
      return artboardHandles(artboard.value);
    }
    const node = DesignDocument.findNode(state.document, name);
    return node.some ? nodeHandles(node.value) : [];
  },

  /**
   * ポインタが乗っているハンドル。終端から内側へ `RESIZE_HANDLE_THICKNESS_PX` までを
   * 掴める帯とする（描いている帯と同じ範囲）。
   *
   * 角では 2 本の帯が重なるので、先にある方（`handles` の並び順）を掴む。
   * どちらを選んでも一方の軸しか変えられない以上、順序を決めておけば足りる。
   */
  handleAt(
    handles: readonly AxisLength[],
    bounds: CanvasBounds,
    pointer: CanvasOffset,
  ): Option<AxisLength> {
    if (!CanvasBounds.contains(bounds, pointer)) {
      return Option.none;
    }
    return Option.fromNullable(
      handles.find(
        (handle) =>
          CanvasBounds.edge(bounds, handle.axis) -
            CanvasOffset.along(pointer, handle.axis) <=
          RESIZE_HANDLE_THICKNESS_PX,
      ),
    );
  },

  /** ハンドルを掴む。以後の長さはこの位置とこの長さからの差分で決まる。 */
  grab(handle: AxisLength, origin: CanvasOffset): NodeResize {
    return { kind: "resizing", handle, origin };
  },

  /**
   * 今のポインタ位置での長さ。掴んでいなければ長さは決まらない
   * （ボタンを離したあとのマウス移動）。
   *
   * 毎回「掴んだ時点の長さ + 掴んでからの移動量」で出すのは、1 回の移動ごとに
   * 前回の長さへ足していくと丸め（`AxisLength.create`）の誤差が積み上がるため。
   */
  lengthAt(
    resize: NodeResize,
    pointer: CanvasOffset,
    view: CanvasView,
  ): Option<AxisLength> {
    if (resize.kind !== "resizing") {
      return Option.none;
    }
    const moved = CanvasOffset.along(
      CanvasOffset.delta(resize.origin, pointer),
      resize.handle.axis,
    );
    return Option.some(
      AxisLength.create(
        resize.handle.axis,
        resize.handle.length + CanvasView.toDocumentLength(view, moved),
      ),
    );
  },

  /** 指を離す。掴んでいたなら直後の `click` を飲み込む状態へ。 */
  release(resize: NodeResize): NodeResize {
    return resize.kind === "resizing"
      ? { kind: "resized" }
      : NodeResize.create();
  },

  /** 直後の `click` を選択に使わせないか（上の `resized` の説明を参照）。 */
  consumesClick(resize: NodeResize): boolean {
    return resize.kind === "resized";
  },
} as const;
