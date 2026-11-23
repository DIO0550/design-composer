import { expect, test } from "vitest";
import { DomListener } from "../index";

test("document に張ったリスナーはイベントを受け取り、外すと受け取らなくなる", () => {
  const received: string[] = [];
  const listener = DomListener.createOnDocument("keydown", (event) => {
    received.push(event.key);
  });

  const unsubscribe = listener();
  globalThis.document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
  unsubscribe();
  globalThis.document.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));

  expect(received).toEqual(["a"]);
});

test("window に張ったリスナーはイベントを受け取り、外すと受け取らなくなる", () => {
  const received: string[] = [];
  const listener = DomListener.createOnWindow("blur", () => {
    received.push("blur");
  });

  const unsubscribe = listener();
  globalThis.window.dispatchEvent(new FocusEvent("blur"));
  unsubscribe();
  globalThis.window.dispatchEvent(new FocusEvent("blur"));

  expect(received).toEqual(["blur"]);
});

test("要素に張ったリスナーは既定動作を止められる", () => {
  const surface = globalThis.document.createElement("div");
  const listener = DomListener.createOnElement(surface, "wheel", (event) =>
    event.preventDefault(),
  );

  const unsubscribe = listener();
  const notCanceled = surface.dispatchEvent(
    new WheelEvent("wheel", { cancelable: true }),
  );
  unsubscribe();

  expect(notCanceled).toBe(false);
});

test("要素から外したリスナーは、イベントを受け取らなくなる", () => {
  const surface = globalThis.document.createElement("div");
  const received: string[] = [];
  const listener = DomListener.createOnElement(surface, "wheel", () => {
    received.push("wheel");
  });

  const unsubscribe = listener();
  surface.dispatchEvent(new WheelEvent("wheel"));
  unsubscribe();
  surface.dispatchEvent(new WheelEvent("wheel"));

  expect(received).toEqual(["wheel"]);
});
