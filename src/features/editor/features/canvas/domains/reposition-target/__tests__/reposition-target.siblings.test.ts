import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import {
  type DropParentCoordinates,
  type GrabbedSiblingsGeometry,
  SiblingsRepositionTarget,
} from "../index";

/*
 * 選んでいる絶対配置の兄弟をまとめて運んだときの行き先（docs/06-ui.md「キャンバス直接操作」の
 * 移動）。
 */

/** 回っていない `home` の中で掴んだ、20x12 の回っていない `a`（40, 24）と `b`（100, 60）。 */
const GrabbedInHome: GrabbedSiblingsGeometry = {
  parentName: "home",
  parentRotation: 0,
  members: [
    {
      name: "a",
      placement: { mode: "absolute", x: 40, y: 24 },
      ownRotation: 0,
      centerFromTopLeft: { x: 10, y: 6 },
    },
    {
      name: "b",
      placement: { mode: "absolute", x: 100, y: 60 },
      ownRotation: 0,
      centerFromTopLeft: { x: 10, y: 6 },
    },
  ],
};

/** 回っていない今の親へそのまま落とす。 */
const Home: DropParentCoordinates = {
  name: "home",
  shift: { x: 0, y: 0 },
  rotation: 0,
};

/** 左上が今の親より右下（200, 60）にある、回っていない落とし先。 */
const Card: DropParentCoordinates = {
  name: "card",
  shift: { x: -200, y: -60 },
  rotation: 0,
};

test("まとめて運ぶと、全員の座標に同じ量が足されて書かれる", () => {
  const dropped = SiblingsRepositionTarget.create(
    GrabbedInHome,
    { x: 30, y: -12 },
    Home,
  );

  expect(dropped.members.map((member) => member.target.placement)).toEqual([
    { mode: "absolute", x: 70, y: 12 },
    { mode: "absolute", x: 130, y: 48 },
  ]);
});

test("別の親へまとめて運ぶと、どの一員も落とし先の親へ書かれる", () => {
  const edits = SiblingsRepositionTarget.toEdits(
    SiblingsRepositionTarget.create(GrabbedInHome, { x: 30, y: -12 }, Card),
  );

  expect(edits.map((edit) => edit.edit.to.parentName)).toEqual([
    "card",
    "card",
  ]);
});

test("小数の座標の一員と整数の一員をまとめて運ぶと、一員ごとに丸めた座標とそこから逆算したずらし量になる", () => {
  const dropped = SiblingsRepositionTarget.create(
    {
      ...GrabbedInHome,
      members: [
        {
          ...GrabbedInHome.members[0],
          placement: { mode: "absolute", x: 10.5, y: 0 },
        },
        {
          ...GrabbedInHome.members[1],
          placement: { mode: "absolute", x: 40, y: 0 },
        },
      ],
    },
    { x: 30, y: 0 },
    Home,
  );

  expect(
    dropped.members.map((member) => [
      member.target.placement.x,
      member.target.offset.x,
    ]),
  ).toEqual([
    [41, 30.5],
    [70, 30],
  ]);
});

test("90 度回った親から回っていない親へまとめて運ぶと、一員ごとに中心を保つ座標と自分の向きに 90 度を足した向きが書かれる", () => {
  /*
   * どちらも運んだ先の中心を 90 度回して落とし先の座標へ写し、大きさの半分を戻した位置。
   * `a`（10, 17）は (217, 14)、`b`（10, 47）は (187, 14)
   */
  const dropped = SiblingsRepositionTarget.create(
    {
      parentName: "turned",
      parentRotation: 90,
      members: [
        {
          name: "a",
          placement: { mode: "absolute", x: 10, y: 10 },
          ownRotation: 0,
          centerFromTopLeft: { x: 10, y: 6 },
        },
        {
          name: "b",
          placement: { mode: "absolute", x: 10, y: 40 },
          ownRotation: 30,
          centerFromTopLeft: { x: 10, y: 6 },
        },
      ],
    },
    { x: -7, y: 0 },
    { name: "home", shift: { x: 250, y: 0 }, rotation: 0 },
  );

  expect(
    dropped.members.map((member) => [
      member.target.placement,
      member.target.rotation,
    ]),
  ).toEqual([
    [{ mode: "absolute", x: 217, y: 14 }, Option.some(90)],
    [{ mode: "absolute", x: 187, y: 14 }, Option.some(120)],
  ]);
});

test("離したときに届く置き直しは、掴んだ時点のツリー順に並ぶ", () => {
  const edits = SiblingsRepositionTarget.toEdits(
    SiblingsRepositionTarget.create(GrabbedInHome, { x: 30, y: -12 }, Card),
  );

  expect(edits.map((edit) => edit.name)).toEqual(["a", "b"]);
});

test("別の親へまとめて運んでいる間も、ずらして見せる親は今の親のまま", () => {
  const preview = SiblingsRepositionTarget.preview(
    SiblingsRepositionTarget.create(GrabbedInHome, { x: 30, y: -12 }, Card),
  );

  expect(preview.parentName).toBe("home");
});

test("落とし先の親が決まっていなくても、全員ぶんのずらし量が決まる", () => {
  const preview = SiblingsRepositionTarget.carriedPreview(GrabbedInHome, {
    x: 30,
    y: -12,
  });

  expect(preview.members).toEqual([
    { name: "a", offset: { x: 30, y: -12 } },
    { name: "b", offset: { x: 30, y: -12 } },
  ]);
});

test("小数の座標の一員と整数の一員をまとめて運んでいる間は、一員ごとに別々のずらし量で見せる", () => {
  const preview = SiblingsRepositionTarget.preview(
    SiblingsRepositionTarget.create(
      {
        ...GrabbedInHome,
        members: [
          {
            ...GrabbedInHome.members[0],
            placement: { mode: "absolute", x: 10.5, y: 0 },
          },
          {
            ...GrabbedInHome.members[1],
            placement: { mode: "absolute", x: 40, y: 0 },
          },
        ],
      },
      { x: 30, y: 0 },
      Home,
    ),
  );

  expect(preview.members).toEqual([
    { name: "a", offset: { x: 30.5, y: 0 } },
    { name: "b", offset: { x: 30, y: 0 } },
  ]);
});

test("落とし先の親が決まっていない間も、小数の座標の一員と整数の一員は一員ごとに別々のずらし量で見せる", () => {
  const preview = SiblingsRepositionTarget.carriedPreview(
    {
      parentName: "home",
      parentRotation: 0,
      members: [
        { name: "a", placement: { mode: "absolute", x: 10.5, y: 0 } },
        { name: "b", placement: { mode: "absolute", x: 40, y: 0 } },
      ],
    },
    { x: 30, y: 0 },
  );

  expect(preview.members).toEqual([
    { name: "a", offset: { x: 30.5, y: 0 } },
    { name: "b", offset: { x: 30, y: 0 } },
  ]);
});
