import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/dcmp/component";
import type { RefNode } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { ComponentBinding, InstancePropTarget } from "../index";

/**
 * 公開 prop の着いた先を公開名で引く。無ければテストを落とす。
 *
 * @param targets 着いた先の並び
 * @param name 引きたい公開名
 * @returns その公開名の着いた先
 */
function targetNamed(
  targets: readonly InstancePropTarget[],
  name: string,
): InstancePropTarget {
  return Option.unwrap(
    Option.fromNullable(targets.find((target) => target.name === name)),
  );
}

/**
 * 内部ノード `card-body` の幅とモードを `size` / `mode` として公開した部品 `card` だけの一式。
 * `card-body` は幅 5・モード fixed を持つ。
 *
 * @returns 部品一式
 */
function setupCard(): ComponentSet {
  return {
    card: {
      type: "Box",
      children: [
        {
          name: "card-body",
          type: "Box",
          props: { width: 5, widthMode: "fixed" },
        },
      ],
      publicProps: {
        mode: { node: "card-body", prop: "widthMode" },
        size: { node: "card-body", prop: "width" },
      },
    },
  };
}

/**
 * `split-a` の置き方と幅、`split-b` の座標と幅を公開した部品 `split` だけの一式。
 * どちらのノードも幅 5 を持つ。
 *
 * @returns 部品一式
 */
function setupSplit(): ComponentSet {
  return {
    split: {
      type: "Box",
      children: [
        { name: "split-a", type: "Box", props: { width: 5 } },
        { name: "split-b", type: "Box", props: { width: 5 } },
      ],
      publicProps: {
        placement: { node: "split-a", prop: "placement" },
        widthA: { node: "split-a", prop: "width" },
        x: { node: "split-b", prop: "x" },
        widthB: { node: "split-b", prop: "width" },
      },
    },
  };
}

/**
 * インスタンスの公開 prop の着いた先。
 *
 * @param components 引き先の部品一式
 * @param instance 公開 prop を辿るインスタンス
 * @returns 公開 prop ごとの着いた先
 */
function resolve(
  components: ComponentSet,
  instance: RefNode,
): readonly InstancePropTarget[] {
  return ComponentBinding.resolveInstancePropTargets(components, instance);
}

test("インスタンスの上書きは、部品の値を上書きした形で着いたノードに乗る", () => {
  const targets = resolve(setupCard(), {
    name: "instance",
    ref: "card",
    overrides: { size: 10 },
  });

  expect(targetNamed(targets, "size").resolvedProps.width).toBe(10);
});

test("着いた先の既定は、インスタンスの上書きを当てる前の部品の値になる", () => {
  const targets = resolve(setupCard(), {
    name: "instance",
    ref: "card",
    overrides: { size: 10 },
  });

  expect(targetNamed(targets, "size").declared).toEqual(Option.some(5));
});

test("別のノードへ繋いだ公開 prop の上書きは、着いたノードに当たらない", () => {
  const targets = resolve(setupSplit(), {
    name: "instance",
    ref: "split",
    overrides: { widthB: 10 },
  });

  expect(targetNamed(targets, "widthA").resolvedProps.width).toBe(5);
});

test("入れ子の部品では、途中の参照ノードの上書きが着いたノードに当たり、インスタンスの上書きが勝つ", () => {
  const components: ComponentSet = {
    ...setupCard(),
    row: {
      type: "Box",
      children: [
        {
          name: "row-card",
          ref: "card",
          overrides: { size: 7, mode: "hug" },
        },
      ],
      publicProps: { rowSize: { node: "row-card", prop: "size" } },
    },
  };

  const targets = resolve(components, {
    name: "instance",
    ref: "row",
    overrides: { rowSize: 10 },
  });

  expect(targetNamed(targets, "rowSize").resolvedProps).toMatchObject({
    width: 10,
    widthMode: "hug",
  });
});

test("同じノードの条件の prop を公開していれば、その公開名が条件の公開名になる", () => {
  const targets = resolve(setupCard(), { name: "instance", ref: "card" });

  expect(
    InstancePropTarget.conditionPublicName(
      targets,
      targetNamed(targets, "size"),
    ),
  ).toEqual(Option.some("mode"));
});

test("条件の prop を別のノードから公開していても、条件の公開名にならない", () => {
  const targets = resolve(setupSplit(), { name: "instance", ref: "split" });

  expect(
    InstancePropTarget.conditionPublicName(targets, targetNamed(targets, "x")),
  ).toEqual(Option.none);
});

test("存在しない部品を指すインスタンスには、着いた先が無い", () => {
  expect(resolve(setupCard(), { name: "instance", ref: "missing" })).toEqual(
    [],
  );
});

test("部品の中に無いノードへ繋いだ公開 prop は着かず、他の公開 prop は着く", () => {
  const components: ComponentSet = {
    card: {
      type: "Box",
      children: [{ name: "card-body", type: "Box" }],
      publicProps: {
        size: { node: "card-body", prop: "width" },
        gone: { node: "card-missing", prop: "width" },
      },
    },
  };

  const targets = resolve(components, { name: "instance", ref: "card" });

  expect(targets.map((target) => target.name)).toEqual(["size"]);
});

test("locking へ繋いだ公開 prop は着かず、他の公開 prop は着く", () => {
  const components: ComponentSet = {
    card: {
      type: "Box",
      children: [{ name: "card-body", type: "Box" }],
      publicProps: {
        size: { node: "card-body", prop: "width" },
        lock: { node: "card-body", prop: "locking" },
      },
    },
  };

  const targets = resolve(components, { name: "instance", ref: "card" });

  expect(targets.map((target) => target.name)).toEqual(["size"]);
});

test("参照が循環している公開 prop は着かない", () => {
  const components: ComponentSet = {
    first: {
      type: "Box",
      children: [{ name: "first-second", ref: "second" }],
      publicProps: { p: { node: "first-second", prop: "q" } },
    },
    second: {
      type: "Box",
      children: [{ name: "second-first", ref: "first" }],
      publicProps: { q: { node: "second-first", prop: "p" } },
    },
  };

  expect(resolve(components, { name: "instance", ref: "first" })).toEqual([]);
});
