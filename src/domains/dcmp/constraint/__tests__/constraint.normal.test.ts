import { expect, test } from "vitest";
import type { AxisResize } from "@/domains/dcmp/axis-length";
import { Axes } from "@/domains/unit/axis";
import { Option } from "@/utils/Option";
import { Constraint, Constraints } from "../index";

/** 幅が 200 から 300 へ広がった親（増分 100・倍率 1.5）。 */
function setupWidening(): AxisResize {
  return { axis: Axes.Width, before: 200, after: 300 };
}

test("min の子は親が広がっても位置が変わらない", () => {
  expect(Constraint.offsetAfter(Constraints.Min, 40, setupWidening())).toBe(40);
});

test("max の子は親が広がった分だけ位置が動く", () => {
  expect(Constraint.offsetAfter(Constraints.Max, 40, setupWidening())).toBe(
    140,
  );
});

test("center の子は親が広がった分の半分だけ位置が動く", () => {
  expect(Constraint.offsetAfter(Constraints.Center, 40, setupWidening())).toBe(
    90,
  );
});

test("stretch の子は位置が変わらない", () => {
  expect(Constraint.offsetAfter(Constraints.Stretch, 40, setupWidening())).toBe(
    40,
  );
});

test("scale の子は位置が親の倍率で拡がる", () => {
  expect(Constraint.offsetAfter(Constraints.Scale, 40, setupWidening())).toBe(
    60,
  );
});

test("min の子は長さが変わらない", () => {
  expect(Constraint.lengthAfter(Constraints.Min, 80, setupWidening())).toBe(80);
});

test("max の子は長さが変わらない", () => {
  expect(Constraint.lengthAfter(Constraints.Max, 80, setupWidening())).toBe(80);
});

test("center の子は長さが変わらない", () => {
  expect(Constraint.lengthAfter(Constraints.Center, 80, setupWidening())).toBe(
    80,
  );
});

test("stretch の子は長さが親の増分だけ伸びる", () => {
  expect(Constraint.lengthAfter(Constraints.Stretch, 80, setupWidening())).toBe(
    180,
  );
});

test("scale の子は長さが親の倍率で拡がる", () => {
  expect(Constraint.lengthAfter(Constraints.Scale, 80, setupWidening())).toBe(
    120,
  );
});

test("props に書かれた追従の仕方を読む", () => {
  expect(
    Option.unwrap(Constraint.fromProps({ constraintX: "max" }, Axes.Width)),
  ).toBe(Constraints.Max);
});

test("縦の追従は横とは別の prop から読む", () => {
  expect(
    Option.unwrap(
      Constraint.fromProps(
        { constraintX: "max", constraintY: "center" },
        Axes.Height,
      ),
    ),
  ).toBe(Constraints.Center);
});
