import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { expect, test } from "vitest";
import { useSpaceHeld } from "..";

/** 構えているかだけを映す器。フックの戻り値を画面から読めるようにする。 */
function SpaceHeldProbe(): ReactElement {
  const isHeld = useSpaceHeld();
  return <output data-testid="held">{isHeld ? "held" : "released"}</output>;
}

/** 今の構え。 */
function heldState(): string {
  return screen.getByTestId("held").textContent ?? "";
}

test("space を押している間は構えている", () => {
  render(<SpaceHeldProbe />);

  fireEvent.keyDown(globalThis.document, { code: "Space" });

  expect(heldState()).toBe("held");
});

test("space を離すと構えが解ける", () => {
  render(<SpaceHeldProbe />);
  fireEvent.keyDown(globalThis.document, { code: "Space" });

  fireEvent.keyUp(globalThis.document, { code: "Space" });

  expect(heldState()).toBe("released");
});

test("space 以外のキーでは構えない", () => {
  render(<SpaceHeldProbe />);

  fireEvent.keyDown(globalThis.document, { code: "KeyA" });

  expect(heldState()).toBe("released");
});

test("space を押したまま別のキーを離しても構えは解けない", () => {
  /* 押下側だけ space を見ていると、別のキーの keyup で構えが落ちる。 */
  render(<SpaceHeldProbe />);
  fireEvent.keyDown(globalThis.document, { code: "Space" });

  fireEvent.keyUp(globalThis.document, { code: "KeyA" });

  expect(heldState()).toBe("held");
});

test("Shift を押しながらの space でも構える", () => {
  /*
   * 修飾キーの一致まで求めると、Shift を押したままの space で構えられず、
   * keyup の時点で修飾が外れていると解けなくなる。
   */
  render(<SpaceHeldProbe />);

  fireEvent.keyDown(globalThis.document, { code: "Space", shiftKey: true });

  expect(heldState()).toBe("held");
});

test("文字を打ち込める要素にフォーカスがある間の space では構えない", () => {
  render(
    <>
      <input data-testid="field" />
      <SpaceHeldProbe />
    </>,
  );

  fireEvent.keyDown(screen.getByTestId("field"), { code: "Space" });

  expect(heldState()).toBe("released");
});

test("選択欄にフォーカスがある間の space では構えない", () => {
  render(
    <>
      <select data-testid="picker">
        <option>a</option>
      </select>
      <SpaceHeldProbe />
    </>,
  );

  fireEvent.keyDown(screen.getByTestId("picker"), { code: "Space" });

  expect(heldState()).toBe("released");
});

test("space を押したままウィンドウのフォーカスが外れると構えが解ける", () => {
  /*
   * 外れている間の keyup は届かないので、解かないと戻ってきたときに
   * 押していない space で掴んだドラッグがパンになる。
   */
  render(<SpaceHeldProbe />);
  fireEvent.keyDown(globalThis.document, { code: "Space" });

  fireEvent.blur(globalThis.window);

  expect(heldState()).toBe("released");
});
