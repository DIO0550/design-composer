import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DropLine, DropLineTestId, ListOrientations } from "../index";

test("前へ動かしているときは行の手前に引かれる", () => {
  render(
    <DropLine side="before" listOrientation={ListOrientations.Vertical} />,
  );

  expect(screen.getByTestId(DropLineTestId).getAttribute("data-side")).toBe(
    "before",
  );
});

test("後ろへ動かしているときは行の後ろに引かれる", () => {
  render(<DropLine side="after" listOrientation={ListOrientations.Vertical} />);

  expect(screen.getByTestId(DropLineTestId).getAttribute("data-side")).toBe(
    "after",
  );
});

test("横に並べる並びでは、横並びの線として引かれる", () => {
  render(
    <DropLine side="before" listOrientation={ListOrientations.Horizontal} />,
  );

  expect(
    screen.getByTestId(DropLineTestId).getAttribute("data-orientation"),
  ).toBe(ListOrientations.Horizontal);
});

test("縦に積む並びでは、縦並びの線として引かれる", () => {
  render(
    <DropLine side="before" listOrientation={ListOrientations.Vertical} />,
  );

  expect(
    screen.getByTestId(DropLineTestId).getAttribute("data-orientation"),
  ).toBe(ListOrientations.Vertical);
});

/*
 * 掴んで運ぶ操作はポインタ専用なので、この線を読む相手が居ない
 * （キャンバスの `DropMarker` も同じ理由で読み上げから外している）。
 */
test("落ちる先の線は読み上げから外れている", () => {
  render(
    <DropLine side="before" listOrientation={ListOrientations.Vertical} />,
  );

  expect(screen.getByTestId(DropLineTestId).getAttribute("aria-hidden")).toBe(
    "true",
  );
});
