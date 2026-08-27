import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, test } from "vitest";
import { Instant } from "@/domains/unit/instant";
import type { Clock } from "@/libs/clock";
import { ClockFake } from "@/libs/clock/fake";
import { Option } from "@/utils/Option";
import { useElapsed } from "../index";

/** 時計の開始時刻。起点はここから作る。 */
const StartEpochMs = 1_700_000_000_000;

/**
 * 起点を持たせたり外したりできる器。
 *
 * 起点の有無を押して切り替えられるようにしているのは、`none` になったときに購読が
 * 解除されるか（張り直されないか）を、同じ描画のまま確かめるため。
 */
function ElapsedHarness({
  clock,
  initialSince,
}: Readonly<{ clock: Clock; initialSince: Option<Instant> }>) {
  const [since, setSince] = useState(initialSince);
  const elapsed = useElapsed(clock, since);

  return (
    <>
      <p data-testid="elapsed">
        {elapsed.some
          ? `${elapsed.value.count}:${elapsed.value.unit}`
          : "起点なし"}
      </p>
      <button type="button" onClick={() => setSince(Option.none)}>
        起点を外す
      </button>
      <button
        type="button"
        onClick={() => setSince(Option.some(Instant.create(StartEpochMs)))}
      >
        起点を持たせる
      </button>
    </>
  );
}

/** 経過時間の表示。`count:unit` の形で出している。 */
function elapsedText(): string {
  return screen.getByTestId("elapsed").textContent ?? "";
}

test("起点が無いあいだは経過時間を返さない", () => {
  const clock = ClockFake.create(StartEpochMs);

  render(<ElapsedHarness clock={clock.clock} initialSince={Option.none} />);

  expect(elapsedText()).toBe("起点なし");
});

test("起点があると経過時間を返す", () => {
  const clock = ClockFake.create(StartEpochMs + 4000);

  render(
    <ElapsedHarness
      clock={clock.clock}
      initialSince={Option.some(Instant.create(StartEpochMs))}
    />,
  );

  expect(elapsedText()).toBe("4:seconds");
});

test("時計が進むと経過時間も進む", () => {
  const clock = ClockFake.create(StartEpochMs + 4000);
  render(
    <ElapsedHarness
      clock={clock.clock}
      initialSince={Option.some(Instant.create(StartEpochMs))}
    />,
  );

  act(() => {
    clock.advanceSeconds(1);
  });

  expect(elapsedText()).toBe("5:seconds");
});

test("起点が無いあいだは時計を購読しない", () => {
  const clock = ClockFake.create(StartEpochMs);

  render(<ElapsedHarness clock={clock.clock} initialSince={Option.none} />);

  expect(clock.isSubscribed()).toBe(false);
});

test("起点が消えると時計の購読も解除される", async () => {
  const clock = ClockFake.create(StartEpochMs);
  render(
    <ElapsedHarness
      clock={clock.clock}
      initialSince={Option.some(Instant.create(StartEpochMs))}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "起点を外す" }));

  expect(clock.isSubscribed()).toBe(false);
});

test("起点が消えると経過時間も返さなくなる", async () => {
  const clock = ClockFake.create(StartEpochMs + 4000);
  render(
    <ElapsedHarness
      clock={clock.clock}
      initialSince={Option.some(Instant.create(StartEpochMs))}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "起点を外す" }));

  expect(elapsedText()).toBe("起点なし");
});

/*
 * `Option.some` は毎回新しいオブジェクトを返すので、依存に `since` そのものを置くと
 * レンダーのたびに購読が張り直される。張り直されても経過時間は進むため、
 * 数字を見るテストでは気づけない（代役の購読回数でだけ見える）。
 */
test("起点が変わらないまま再レンダーしても時計を購読し直さない", async () => {
  const clock = ClockFake.create(StartEpochMs);
  render(
    <ElapsedHarness
      clock={clock.clock}
      initialSince={Option.some(Instant.create(StartEpochMs))}
    />,
  );

  // 同じ起点をもう一度持たせる（state が別のオブジェクトに差し替わり、再レンダーが走る）
  await userEvent.click(screen.getByRole("button", { name: "起点を持たせる" }));

  expect(clock.subscribedCount()).toBe(1);
});
