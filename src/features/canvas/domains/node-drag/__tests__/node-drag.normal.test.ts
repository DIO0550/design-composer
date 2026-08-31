import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type {
  DraggedNode,
  DropTarget,
} from "@/features/canvas/domains/node-drop";
import { Option } from "@/utils/Option";
import { DropEdit, NodeDrag } from "../index";

/** 木にある `title` を掴んでいる状態。 */
const MovingTitle: DraggedNode = { kind: "existing", name: "title" };

/** パレットの Box を掴んでいる状態。 */
const PlacingBox: DraggedNode = {
  kind: "new",
  template: { kind: "primitive", type: "Box" },
};

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          { name: "body", type: "Box", children: [] },
        ],
      },
    ],
  });
}

const SampleDropTarget: DropTarget = {
  position: { parentName: "body", index: 0 },
  marker: { left: 0, top: 0, width: 100, height: 2 },
  childCount: 0,
  parentBounds: { left: 0, top: 0, width: 100, height: 100 },
};

/** ツリーへ挿す側の落とし方。座標の置き直しは別のファイルで見る。 */
const SampleDrop = DropEdit.intoTree(MovingTitle, SampleDropTarget);

test("押した位置から少ししか動かないうちはドラッグとして扱われない", () => {
  const held = NodeDrag.grab({
    dragged: MovingTitle,
    origin: { x: 100, y: 100 },
  });

  const moved = NodeDrag.moveTo(held, { x: 102, y: 100 }, Option.none);

  expect(NodeDrag.isDragging(moved)).toBe(false);
});

test("押した位置から離れるとドラッグとして扱われる", () => {
  const held = NodeDrag.grab({
    dragged: MovingTitle,
    origin: { x: 100, y: 100 },
  });

  const moved = NodeDrag.moveTo(held, { x: 100, y: 140 }, Option.none);

  expect(NodeDrag.isDragging(moved)).toBe(true);
});

test("ドラッグ中は受け入れ先の上にいる間だけ落ちる位置が決まる", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: MovingTitle, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.some(SampleDrop),
  );

  expect(Option.unwrap(NodeDrag.insertionTarget(dragging)).position).toEqual({
    parentName: "body",
    index: 0,
  });
});

test("受け入れられない場所へ移ると落ちる位置は無くなる", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: MovingTitle, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.some(SampleDrop),
  );

  const outside = NodeDrag.moveTo(dragging, { x: 100, y: 180 }, Option.none);

  expect(NodeDrag.insertionTarget(outside).some).toBe(false);
});

test("掴んでいないときのポインタ移動では何も起きない", () => {
  const moved = NodeDrag.moveTo(
    NodeDrag.create(),
    { x: 100, y: 140 },
    Option.some(SampleDrop),
  );

  expect(NodeDrag.isDragging(moved)).toBe(false);
});

test("動かさずに離したときは直後のクリックを選択に使う", () => {
  const released = NodeDrag.release(
    NodeDrag.grab({ dragged: MovingTitle, origin: { x: 100, y: 100 } }),
  );

  expect(NodeDrag.consumesClick(released)).toBe(false);
});

test("運んでから離したときは直後のクリックを選択に使わない", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: MovingTitle, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.some(SampleDrop),
  );

  expect(NodeDrag.consumesClick(NodeDrag.release(dragging))).toBe(true);
});

test("離したあとは何も掴んでいない状態に戻る", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: MovingTitle, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.some(SampleDrop),
  );

  expect(NodeDrag.grabbed(NodeDrag.release(dragging)).some).toBe(false);
});

test("動かし続けても掴んだ位置は掴んだ時点のまま変わらない", () => {
  // 座標の移動量はここからの差で決まるので、途中のポインタ位置で上書きすると
  // 1 回の移動分しか動かなくなる
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: MovingTitle, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.none,
  );

  const further = NodeDrag.moveTo(dragging, { x: 100, y: 180 }, Option.none);

  expect(Option.unwrap(NodeDrag.grabbed(further)).origin).toEqual({
    x: 100,
    y: 100,
  });
});

test("木にある既存ノードをツリーへ落とすと移動になる", () => {
  const edit = DropEdit.intoTree(MovingTitle, SampleDropTarget);

  expect(edit).toEqual({
    kind: "move",
    name: "title",
    target: SampleDropTarget,
  });
});

test("パレットの雛形をツリーへ落とすと挿入になる", () => {
  const edit = DropEdit.intoTree(PlacingBox, SampleDropTarget);

  expect(edit).toEqual({
    kind: "insert",
    template: { kind: "primitive", type: "Box" },
    target: SampleDropTarget,
  });
});

test("座標を置き直す落とし方では挿さる位置を持たない", () => {
  // ドロップ線とラベルは「どの親の何番目の子になるか」の提示なので出さない
  const edit = DropEdit.reposition("title", { mode: "absolute", x: 40, y: 24 });

  expect(DropEdit.insertionTarget(edit).some).toBe(false);
});

test("座標を置き直す落とし方のときだけ、動かす相手と行き先を答える", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: MovingTitle, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.some(
      DropEdit.reposition("title", { mode: "absolute", x: 40, y: 24 }),
    ),
  );

  expect(Option.unwrap(NodeDrag.repositionTarget(dragging))).toEqual({
    name: "title",
    placement: { mode: "absolute", x: 40, y: 24 },
  });
});

test("ツリーへ落とす落とし方では、動かす相手と行き先を答えない", () => {
  // 対照。ドロップ線が出る側では実体を動かさない
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: MovingTitle, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.some(SampleDrop),
  );

  expect(NodeDrag.repositionTarget(dragging).some).toBe(false);
});

test("押しただけでまだ動かしていない間は、動かす相手と行き先を答えない", () => {
  // 閾値未満で答えると、クリックのたびにノードが一瞬ずれる
  const held = NodeDrag.grab({
    dragged: MovingTitle,
    origin: { x: 100, y: 100 },
  });

  expect(NodeDrag.repositionTarget(held).some).toBe(false);
});

test("押された位置から外へ辿った名前のうち最も内側のノードを掴む", () => {
  const name = NodeDrag.grabbableName(setupDocument(), ["title", "home"]);

  expect(Option.unwrap(name)).toBe("title");
});

test("artboard の枠だけを押したときは掴めるノードが無い", () => {
  const name = NodeDrag.grabbableName(setupDocument(), ["home"]);

  expect(name.some).toBe(false);
});

test("パレットの雛形を運んでから離したときは、直後のクリックを飲み込まない", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: PlacingBox, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.some(SampleDrop),
  );

  /*
   * 押した場所（パレットの行）と離した場所（キャンバス）が別の枝にあるので、
   * `click` はキャンバスの枠まで上がってこない。飲み込む状態に入ると、
   * 次にキャンバスを押したときの選択が消える。
   */
  expect(NodeDrag.consumesClick(NodeDrag.release(dragging))).toBe(false);
});

test("運んでいる最中だけ、何を運んでいるかを答える", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: PlacingBox, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.none,
  );

  expect(Option.unwrap(NodeDrag.carriedNode(dragging))).toEqual(PlacingBox);
});

test("押しただけでまだ動かしていない間は、何を運んでいるかを答えない", () => {
  // 掴んだ行の強調とツールバーの点灯がこれで決まるので、押しただけで点くと
  // クリックのたびに一瞬光る
  const held = NodeDrag.grab({
    dragged: PlacingBox,
    origin: { x: 100, y: 100 },
  });

  expect(NodeDrag.carriedNode(held).some).toBe(false);
});

test("パレットの雛形を運んでいる最中は、その雛形を答える", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: PlacingBox, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.none,
  );

  expect(Option.unwrap(NodeDrag.carriedTemplate(dragging))).toEqual({
    kind: "primitive",
    type: "Box",
  });
});

test("木にある既存ノードを運んでいる間は、雛形を答えない", () => {
  // 掴んだ行の強調とツールバーの点灯はパレットから運んでいるときだけの表示で、
  // 木の中の移動では点かない
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab({ dragged: MovingTitle, origin: { x: 100, y: 100 } }),
    { x: 100, y: 140 },
    Option.none,
  );

  expect(NodeDrag.carriedTemplate(dragging).some).toBe(false);
});

test("雛形を押しただけでまだ動かしていない間は、雛形を答えない", () => {
  const held = NodeDrag.grab({
    dragged: PlacingBox,
    origin: { x: 100, y: 100 },
  });

  expect(NodeDrag.carriedTemplate(held).some).toBe(false);
});
