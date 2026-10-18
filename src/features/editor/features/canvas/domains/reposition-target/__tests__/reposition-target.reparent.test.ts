import { expect, test } from "vitest";
import { Placement } from "@/domains/dcmp/placement";
import { Offset } from "@/domains/unit/offset";
import { Option } from "@/utils/Option";
import {
  type DropParentCoordinates,
  type GrabbedGeometry,
  RepositionTarget,
} from "../index";

/**
 * 向きの違う親へ付け替えるときの行き先。自分の向きも差だけ書き換わり、座標は回る前の左上では
 * なく中心が画面上の同じ位置に来るように直る（docs/06-ui.md「キャンバス直接操作」）。
 */

/** 90 度回った親の中で (10, 10) に置かれた、20x12 の回っていないノード。 */
const GrabbedInTurned: GrabbedGeometry = {
  placement: { mode: "absolute", x: 10, y: 10 },
  parentRotation: 90,
  ownRotation: 0,
  centerFromCorner: { x: 10, y: 6 },
};

/** 今の親の座標の原点が (250, 0) にある、回っていない落とし先。 */
const Home: DropParentCoordinates = {
  name: "home",
  shift: { x: 250, y: 0 },
  rotation: 0,
};

/** 回っていない親の中で (20, 150) に置かれた、20x12 の回っていないノード。 */
const GrabbedInHome: GrabbedGeometry = {
  placement: { mode: "absolute", x: 20, y: 150 },
  parentRotation: 0,
  ownRotation: 0,
  centerFromCorner: { x: 10, y: 6 },
};

/** 今の親の座標の原点が (0, 250) にある、90 度回った落とし先。 */
const Frame: DropParentCoordinates = {
  name: "frame",
  shift: { x: 0, y: 250 },
  rotation: 90,
};

/**
 * 原点が同じで向きだけが違う親どうしで付け替えたときの、書かれる向き。
 *
 * @param rotations 今の親と落とし先の親の画面上の向き、自分の向き
 * @returns 書き込む自分の向き。向きを書かないなら `none`
 */
function writtenRotation(
  rotations: Readonly<{
    parentRotation: number;
    dropRotation: number;
    ownRotation: number;
  }>,
): Option<number> {
  return RepositionTarget.create(
    {
      ...GrabbedInHome,
      parentRotation: rotations.parentRotation,
      ownRotation: rotations.ownRotation,
    },
    { x: 0, y: 0 },
    { name: "frame", shift: { x: 0, y: 0 }, rotation: rotations.dropRotation },
  ).written.rotation;
}

test("90 度回った親から回っていない親へ付け替えると、中心が同じ位置に来る座標が書かれる", () => {
  /*
   * 運んだ先 (10, 17) の左上は落とし先の座標で (233, 10)。中心 (20, 23) は (227, 20) に
   * 写るので、そこから大きさの半分を戻した (217, 14)。左上を保つと中心が (243, 16) へ跳ぶ
   */
  const dropped = RepositionTarget.create(
    GrabbedInTurned,
    { x: -7, y: 0 },
    Home,
  );

  expect(dropped.written.to).toEqual({
    parentName: "home",
    placement: { mode: "absolute", x: 217, y: 14 },
  });
});

test("90 度回った親から回っていない親へ付け替えると、自分の向きが差の 90 度になる", () => {
  const dropped = RepositionTarget.create(
    GrabbedInTurned,
    { x: -7, y: 0 },
    Home,
  );

  expect(dropped.written.rotation).toEqual(Option.some(90));
});

test("回っていない親から 90 度回った親へ付け替えると、中心が同じ位置に来る座標が書かれる", () => {
  // 左上を落とし先の向きで測った (30, 50) から、中心を保つ分 (-4, -16) だけ直す
  const dropped = RepositionTarget.create(
    GrabbedInHome,
    { x: 180, y: -120 },
    Frame,
  );

  expect(dropped.written.to).toEqual({
    parentName: "frame",
    placement: { mode: "absolute", x: 26, y: 34 },
  });
});

test("回っていない親から 90 度回った親へ付け替えると、自分の向きが差の -90 度になる", () => {
  const dropped = RepositionTarget.create(
    GrabbedInHome,
    { x: 180, y: -120 },
    Frame,
  );

  expect(dropped.written.rotation).toEqual(Option.some(-90));
});

test("自分が回っていれば、書かれる向きは自分の向きに差を足した値になる", () => {
  expect(
    writtenRotation({ parentRotation: 90, dropRotation: 0, ownRotation: 30 }),
  ).toEqual(Option.some(120));
});

test("自分の向きに差を足して 1 回りになっても、1 回りに収め直さずに書かれる", () => {
  expect(
    writtenRotation({ parentRotation: 90, dropRotation: 0, ownRotation: 270 }),
  ).toEqual(Option.some(360));
});

test("同じ親の中で動かすときは、向きを書かない", () => {
  const dropped = RepositionTarget.create(
    GrabbedInTurned,
    { x: -7, y: 0 },
    {
      name: "frame",
      shift: { x: 0, y: 0 },
      rotation: 90,
    },
  );

  expect(dropped.written.rotation).toEqual(Option.none);
});

test("360 度回った親から回っていない親へ付け替えると、向きを書かない", () => {
  expect(
    writtenRotation({ parentRotation: 360, dropRotation: 0, ownRotation: 30 }),
  ).toEqual(Option.none);
});

test("360 度回った親から回っていない親へ付け替えると、左上を保った座標が書かれる", () => {
  const dropped = RepositionTarget.create(
    {
      ...GrabbedInHome,
      placement: { mode: "absolute", x: 40, y: 24 },
      parentRotation: 360,
    },
    { x: 30, y: -12 },
    { name: "home", shift: { x: 0, y: 0 }, rotation: 0 },
  );

  expect(dropped.written.to.placement).toEqual({
    mode: "absolute",
    x: 70,
    y: 12,
  });
});

test("大きさの半分が整数でなくても、付け替えで書かれる座標は整数になる", () => {
  // 21x12 なら中心を保つ分は (-16.5, 4.5) で、丸めないと (216.5, 14.5) の端数が書かれる
  const dropped = RepositionTarget.create(
    { ...GrabbedInTurned, centerFromCorner: { x: 10.5, y: 6 } },
    { x: -7, y: 0 },
    Home,
  );

  expect(dropped.written.to.placement).toEqual({
    mode: "absolute",
    x: 217,
    y: 15,
  });
});

test("向きを書き換える付け替えでも、見た目のずらし量は今の親の向きで測った運んだ分のまま", () => {
  const dropped = RepositionTarget.create(
    GrabbedInTurned,
    { x: -7, y: 0 },
    Home,
  );

  expect(dropped.offset).toEqual({ x: 0, y: 7 });
});

/**
 * 運んでいる間の見た目と、離したあとの、画面上の中心と向き。中心はどちらも落とし先の親の
 * 座標で見る（画面上の点との差は落とし先の親の位置と向きだけで、両方に同じだけ効く）。
 *
 * @param from 掴んだ時点の配置と形
 * @param carried 画面上で運んだ量
 * @param dropParent 落とし先の親
 * @returns 2 つの中心の距離と、運んでいる間と離したあとの画面上の向き
 */
function centersAndOrientations(
  from: GrabbedGeometry,
  carried: Offset,
  dropParent: DropParentCoordinates,
) {
  const dropped = RepositionTarget.create(from, carried, dropParent);
  const turn = from.parentRotation - dropParent.rotation;
  const carriedCorner = Offset.add(
    Placement.offset(from.placement),
    dropped.offset,
  );
  const carriedCenter = Offset.add(
    Offset.rotate(Offset.add(carriedCorner, from.centerFromCorner), turn),
    dropParent.shift,
  );
  const droppedCenter = Offset.add(
    Placement.offset(dropped.written.to.placement),
    from.centerFromCorner,
  );
  const droppedRotation = Option.isSome(dropped.written.rotation)
    ? dropped.written.rotation.value
    : from.ownRotation;
  return {
    centerGap: Offset.distance(carriedCenter, droppedCenter),
    carriedOrientation: from.parentRotation + from.ownRotation,
    droppedOrientation: dropParent.rotation + droppedRotation,
  };
}

/** 30 度回った親の中の 20x12 のノードを、割り切れない量だけ運んで 75 度回った親へ落とす。 */
const ThirtyToSeventyFive = [
  {
    placement: { mode: "absolute", x: 40, y: 24 },
    parentRotation: 30,
    ownRotation: 0,
    centerFromCorner: { x: 10, y: 6 },
  },
  { x: 28.33, y: -10.83 },
  { name: "card", shift: { x: 13, y: -7 }, rotation: 75 },
] as const satisfies Parameters<typeof centersAndOrientations>;

test("向きの違う親へ付け替えても、画面上の中心は運んでいる間の位置から 0.71px 以内に来る", () => {
  // 座標を整数へ丸めるので縦横それぞれ 0.5px まではずれる。中心を直さないと 8px 以上跳ぶ
  const { centerGap } = centersAndOrientations(...ThirtyToSeventyFive);

  expect(centerGap).toBeLessThanOrEqual(Math.SQRT1_2);
});

test("向きの違う親へ付け替えても、画面上の向きは運んでいる間と同じ", () => {
  const { carriedOrientation, droppedOrientation } = centersAndOrientations(
    ...ThirtyToSeventyFive,
  );

  expect(droppedOrientation).toBe(carriedOrientation);
});

/*
 * 以下は浮動小数の端数。親の画面上の向きは祖先の角度を足し合わせて求めるので、0.1 度の中の
 * 0.2 度のような親では差に端数が残る。
 */
test("0.1 度の中の 0.2 度の親から 0.3 度の親へ付け替えても、向きを書かない", () => {
  expect(
    writtenRotation({
      parentRotation: 0.1 + 0.2,
      dropRotation: 0.3,
      ownRotation: 0,
    }),
  ).toEqual(Option.none);
});

test("0.1 度の中の 360.1 度の親から 0.2 度の親へ付け替えても、向きを書かない", () => {
  expect(
    writtenRotation({
      parentRotation: 0.1 + 360.1,
      dropRotation: 0.2,
      ownRotation: 0,
    }),
  ).toEqual(Option.none);
});

test("0.1 度の中の 0.3 度の親から 0.2 度の中の 0.3 度の親へ付け替えると、端数の無い差が書かれる", () => {
  expect(
    writtenRotation({
      parentRotation: 0.1 + 0.3,
      dropRotation: 0.2 + 0.3,
      ownRotation: 0,
    }),
  ).toEqual(Option.some(-0.1));
});

test("0.1 度回ったノードを 0.2 度の差の親へ付け替えると、端数の無い和が書かれる", () => {
  expect(
    writtenRotation({ parentRotation: 0.2, dropRotation: 0, ownRotation: 0.1 }),
  ).toEqual(Option.some(0.3));
});
