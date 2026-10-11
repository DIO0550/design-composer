import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import type { GradientStop } from "@/domains/dcmp/token";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { TokenSelection } from "@/domains/session/token-selection";
import {
  gradientDocumentOf,
  ThreeStops,
  TwoStops,
} from "@/features/editor/features/tokens/__tests__/gradient-documents";
import { Option } from "@/utils/Option";
import { TokenEditor } from "../index";

/**
 * グラデーション `brand` を選んだエディタの本文を描く。
 *
 * @param stops `brand` が持つ色の変わり目
 * @returns 値を受け取る関数。送られた値と続き方を見るために使う
 */
function renderGradient(stops: readonly GradientStop[]) {
  const onSetTokenValue = vi.fn();
  render(
    <TokenEditor.Body
      selection={TokenSelection.create(
        gradientDocumentOf({ stops }),
        Option.some({ kind: "gradients", name: "brand" }),
      )}
      onSetTokenValue={onSetTokenValue}
      onRenameToken={() => {}}
      onRemoveToken={() => {}}
    />,
  );
  return onSetTokenValue;
}

test("stop が 2 件なら stop の − は押せない", () => {
  renderGradient(TwoStops);

  expect(
    screen.getByRole<HTMLButtonElement>("button", { name: "stop 1 を削除" })
      .disabled,
  ).toBe(true);
});

test("stop が 3 件なら stop の − を押すとその stop を除いた値が別のまとまりで届く", async () => {
  const user = userEvent.setup();
  const onSetTokenValue = renderGradient(ThreeStops);

  await user.click(screen.getByRole("button", { name: "stop 2 を削除" }));

  expect(onSetTokenValue).toHaveBeenCalledWith(
    {
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [ThreeStops[0], ThreeStops[2]],
      },
    },
    EditContinuities.Separate,
  );
});

test("stop を追加すると stop を足した値が別のまとまりで届く", async () => {
  const user = userEvent.setup();
  const onSetTokenValue = renderGradient(TwoStops);

  await user.click(screen.getByRole("button", { name: "stop を追加" }));

  expect(onSetTokenValue).toHaveBeenCalledWith(
    {
      kind: "gradients",
      value: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "#000000", ratio: 0 },
          { color: "#000000", ratio: 0.5 },
          { color: "#ffffff", ratio: 1 },
        ],
      },
    },
    EditContinuities.Separate,
  );
});

test("ピッカーを開いて動かした 2 回目以降は続きとして届く", () => {
  const onSetTokenValue = renderGradient(TwoStops);
  const picker = screen.getByLabelText("stop 1 の色");

  fireEvent.click(picker);
  fireEvent.change(picker, { target: { value: "#ff0000" } });
  fireEvent.change(picker, { target: { value: "#00ff00" } });

  expect(
    onSetTokenValue.mock.calls.map(([, continuity]) => continuity),
  ).toEqual([EditContinuities.Separate, EditContinuities.Continued]);
});

test("ピッカーを開き直して動かすと別のまとまりとして届く", () => {
  const onSetTokenValue = renderGradient(TwoStops);
  const picker = screen.getByLabelText("stop 1 の色");

  fireEvent.click(picker);
  fireEvent.change(picker, { target: { value: "#ff0000" } });
  fireEvent.click(picker);
  fireEvent.change(picker, { target: { value: "#00ff00" } });

  expect(
    onSetTokenValue.mock.calls.map(([, continuity]) => continuity),
  ).toEqual([EditContinuities.Separate, EditContinuities.Separate]);
});

test("ピッカーで動かしたあと別の欄へ移り、開き直さずに動かすと別のまとまりとして届く", () => {
  const onSetTokenValue = renderGradient(TwoStops);
  const picker = screen.getByLabelText("stop 1 の色");

  fireEvent.click(picker);
  fireEvent.change(picker, { target: { value: "#ff0000" } });
  fireEvent.blur(picker);
  fireEvent.focus(screen.getByLabelText("角度"));
  fireEvent.change(picker, { target: { value: "#00ff00" } });

  expect(
    onSetTokenValue.mock.calls.map(([, continuity]) => continuity),
  ).toEqual([EditContinuities.Separate, EditContinuities.Separate]);
});

test("角度の欄には ° が、比率と不透明度の欄には % が添えられる", () => {
  renderGradient(TwoStops);

  const unitOf = (label: string) =>
    screen.getByLabelText(label).parentElement?.textContent;

  expect(unitOf("角度")).toBe("°");
  expect(unitOf("stop 1 の比率")).toBe("%");
  expect(unitOf("stop 1 の不透明度")).toBe("%");
});
