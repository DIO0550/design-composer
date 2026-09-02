import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, expect, test } from "vitest";
import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { Option } from "@/utils/Option";
import { useDrawnBounds } from "../index";

/*
 * 描かれている矩形の追いかけ方。
 *
 * happy-dom はレイアウトを行わず矩形をすべて 0 で返すため、**測定を差し替えないと
 * 実装を何に壊しても通る**（rules/testing.md「その assert は落ちうるか」）。
 * ここで差し替えるのはブラウザが行う測定だけで、そこから何が決まるかは実物が答える。
 */

/** キャンバスに描かれていることにする要素。器の外に置き、名前で引けるようにする。 */
function drawTarget(name: string, bounds: CanvasBounds): HTMLElement {
  const target = globalThis.document.createElement("div");
  target.setAttribute(ElementNameAttribute, name);
  target.getBoundingClientRect = () =>
    new DOMRect(bounds.left, bounds.top, bounds.width, bounds.height);
  globalThis.document.body.append(target);
  return target;
}

afterEach(() => {
  for (const element of globalThis.document.querySelectorAll(
    `[${ElementNameAttribute}]`,
  )) {
    element.remove();
  }
});

/** 器の左上。0 以外にして、器からの相対に直していることが見えるようにする。 */
const ContainerOrigin = { left: 10, top: 20 };

/** 測った矩形をそのまま読める形で出す器。 */
function BoundsProbe({ target }: Readonly<{ target: Option<string> }>) {
  const container = useRef<HTMLDivElement>(null);
  const bounds = useDrawnBounds(target, container);
  return (
    <div
      ref={(element) => {
        /*
         * ref は layout effect より先に付くので、ここで差し替えれば最初の測定から
         * 器の矩形が 0 以外になる（render 後に差し替えると初回に間に合わない）。
         */
        if (element !== null) {
          element.getBoundingClientRect = () =>
            new DOMRect(ContainerOrigin.left, ContainerOrigin.top, 0, 0);
        }
        container.current = element;
      }}
    >
      <output data-testid="bounds">
        {bounds.some
          ? `${bounds.value.left},${bounds.value.top},${bounds.value.width},${bounds.value.height}`
          : "測れていない"}
      </output>
    </div>
  );
}

test("描かれている要素の矩形を返す", () => {
  drawTarget("home", { left: 12, top: 34, width: 200, height: 100 });

  render(<BoundsProbe target={Option.some("home")} />);

  // 器の左上（10, 20）を原点に置き直すので、左上だけがその差だけずれる
  expect(screen.getByTestId("bounds").textContent).toBe("2,14,200,100");
});

test("その名前の要素が描かれていなければ矩形は返らない", () => {
  drawTarget("home", { left: 12, top: 34, width: 200, height: 100 });

  render(<BoundsProbe target={Option.some("about")} />);

  expect(screen.getByTestId("bounds").textContent).toBe("測れていない");
});

test("何も指していなければ矩形は返らない", () => {
  drawTarget("home", { left: 12, top: 34, width: 200, height: 100 });

  render(<BoundsProbe target={Option.none} />);

  expect(screen.getByTestId("bounds").textContent).toBe("測れていない");
});

test("描かれる位置が変わると測り直す", () => {
  /*
   * 倍率やパンが変わると client 矩形が動く。依存配列で原因を列挙せず毎コミット
   * 測り直しているので、再レンダーさえ起きれば新しい矩形へ入れ替わる。
   */
  const target = drawTarget("home", {
    left: 12,
    top: 34,
    width: 200,
    height: 100,
  });
  const { rerender } = render(<BoundsProbe target={Option.some("home")} />);

  target.getBoundingClientRect = () => new DOMRect(20, 40, 400, 200);
  rerender(<BoundsProbe target={Option.some("home")} />);

  expect(screen.getByTestId("bounds").textContent).toBe("10,20,400,200");
});
