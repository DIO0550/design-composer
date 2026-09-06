import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, expect, test } from "vitest";
import {
  clearDrawn,
  drawNamed,
  stubBounds,
} from "@/features/canvas/__tests__/canvas-measure";
import { Option } from "@/utils/Option";
import { useDrawnBounds } from "../index";

/* 描かれている矩形の追いかけ方。測定の差し替え方は `canvas-measure` の doc を見る。 */

afterEach(clearDrawn);

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
          stubBounds(element, {
            left: ContainerOrigin.left,
            top: ContainerOrigin.top,
            width: 0,
            height: 0,
          });
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
  drawNamed("home", { left: 12, top: 34, width: 200, height: 100 });

  render(<BoundsProbe target={Option.some("home")} />);

  // 器の左上（10, 20）を原点に置き直すので、左上だけがその差だけずれる
  expect(screen.getByTestId("bounds").textContent).toBe("2,14,200,100");
});

test("その名前の要素が描かれていなければ矩形は返らない", () => {
  drawNamed("home", { left: 12, top: 34, width: 200, height: 100 });

  render(<BoundsProbe target={Option.some("about")} />);

  expect(screen.getByTestId("bounds").textContent).toBe("測れていない");
});

test("何も指していなければ矩形は返らない", () => {
  drawNamed("home", { left: 12, top: 34, width: 200, height: 100 });

  render(<BoundsProbe target={Option.none} />);

  expect(screen.getByTestId("bounds").textContent).toBe("測れていない");
});

test("描かれる位置が変わると測り直す", () => {
  /*
   * 倍率やパンが変わると client 矩形が動く。依存配列で原因を列挙せず毎コミット
   * 測り直しているので、再レンダーさえ起きれば新しい矩形へ入れ替わる。
   */
  const target = drawNamed("home", {
    left: 12,
    top: 34,
    width: 200,
    height: 100,
  });
  const { rerender } = render(<BoundsProbe target={Option.some("home")} />);

  stubBounds(target, { left: 20, top: 40, width: 400, height: 200 });
  rerender(<BoundsProbe target={Option.some("home")} />);

  expect(screen.getByTestId("bounds").textContent).toBe("10,20,400,200");
});
