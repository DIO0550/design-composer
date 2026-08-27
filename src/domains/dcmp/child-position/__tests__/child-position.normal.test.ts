import { expect, test } from "vitest";
import { ChildPosition } from "../index";

test("同じ親の中で、取り除く位置より後ろへ置くときは1つ手前になる", () => {
  const insertion = ChildPosition.afterRemoving(
    { parentName: "home", index: 3 },
    { parentName: "home", index: 1 },
  );

  expect(insertion).toEqual({ parentName: "home", index: 2 });
});

test("同じ親の中で、取り除く位置より手前へ置くときは変わらない", () => {
  const insertion = ChildPosition.afterRemoving(
    { parentName: "home", index: 1 },
    { parentName: "home", index: 3 },
  );

  expect(insertion).toEqual({ parentName: "home", index: 1 });
});

test("同じ親の中で、取り除く位置と同じ位置へ置くときは変わらない", () => {
  const insertion = ChildPosition.afterRemoving(
    { parentName: "home", index: 2 },
    { parentName: "home", index: 2 },
  );

  expect(insertion).toEqual({ parentName: "home", index: 2 });
});

test("親が違えば、取り除く位置が手前でも変わらない", () => {
  const insertion = ChildPosition.afterRemoving(
    { parentName: "panel", index: 3 },
    { parentName: "home", index: 1 },
  );

  expect(insertion).toEqual({ parentName: "panel", index: 3 });
});
