import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { TokenSelection } from "@/domains/session/token-selection";
import { Option } from "@/utils/Option";
import { TokenEditor } from "../index";

/**
 * 色トークン `primary` を選んだエディタの本文。
 *
 * @param color `primary` の値
 * @param onSetTokenValue 値を受け取る関数
 */
function colorBody(
  color: string,
  onSetTokenValue: (...args: unknown[]) => void,
): ReactElement {
  return (
    <TokenEditor.Body
      selection={TokenSelection.create(
        DesignDocument.create({
          tokens: { ...TokenSet.empty(), colors: { primary: color } },
        }),
        Option.some({ kind: "colors", name: "primary" }),
      )}
      onSetTokenValue={onSetTokenValue}
      onRenameToken={() => {}}
      onRemoveToken={() => {}}
    />
  );
}

/**
 * 色トークン `primary` を選んだエディタの本文を描く。値を受け取っても描き直さないので、欄に
 * 残った下書きを見られる。
 *
 * @param color `primary` の値
 * @returns 値を受け取る関数。送られた値と続き方を見るために使う
 */
function renderColor(color: string) {
  const onSetTokenValue = vi.fn();
  render(colorBody(color, onSetTokenValue));
  return onSetTokenValue;
}

/** hex の欄。 */
function hexField(): HTMLInputElement {
  return screen.getByLabelText<HTMLInputElement>("hex");
}

test("hex の欄の前には `#` が添えられ、欄には `#` を除いた 6 桁が出る", () => {
  renderColor("#3b82f680");

  expect(hexField().value).toBe("3b82f6");
  expect(hexField().previousElementSibling?.textContent).toBe("#");
});

test("値を変えない綴りで確定しても、欄は小文字の 6 桁へ取り直される", async () => {
  const user = userEvent.setup();
  renderColor("#3b82f6");

  await user.clear(hexField());
  await user.type(hexField(), "3B82F6{Enter}");

  expect(hexField().value).toBe("3b82f6");
});

test("弾かれた hex は打った文字列が欄に残り、値は届かない", async () => {
  const user = userEvent.setup();
  const onSetTokenValue = renderColor("#3b82f6");

  await user.clear(hexField());
  await user.type(hexField(), "abcd{Enter}");

  expect(hexField().value).toBe("abcd");
  expect(onSetTokenValue).not.toHaveBeenCalled();
});

test("3 桁で確定すると、広げた 6 桁の色が別のまとまりで届く", async () => {
  const user = userEvent.setup();
  const onSetTokenValue = renderColor("#3b82f6");

  await user.clear(hexField());
  await user.type(hexField(), "abc{Enter}");

  expect(onSetTokenValue).toHaveBeenCalledWith(
    { kind: "colors", value: "#aabbcc" },
    EditContinuities.Separate,
  );
});

test("見本は、読み上げ名 `値` を持つ色の入力欄", () => {
  renderColor("#3b82f6");

  expect(screen.getByLabelText<HTMLInputElement>("値").type).toBe("color");
});

test("読めない色は `値` のテキスト欄に元の綴りで出て、不透明度の欄は無い", () => {
  renderColor("RED");

  const text = screen.getByLabelText<HTMLInputElement>("値");
  expect([text.type, text.value]).toEqual(["text", "RED"]);
  expect(screen.queryByLabelText("不透明度")).toBeNull();
});

test("読めない色が外から別の読めない綴りに変わると、`値` の欄もその綴りになる", () => {
  const { rerender } = render(colorBody("RED", () => {}));

  rerender(colorBody("BLUE", () => {}));

  expect(screen.getByLabelText<HTMLInputElement>("値").value).toBe("BLUE");
});

test("読めない色の `値` の欄に `#` 付きの 6 桁を打って確定すると、その色が別のまとまりで届く", async () => {
  const user = userEvent.setup();
  const onSetTokenValue = renderColor("RED");

  const text = screen.getByLabelText<HTMLInputElement>("値");
  await user.clear(text);
  await user.type(text, "#aabbcc{Enter}");

  expect(onSetTokenValue).toHaveBeenCalledWith(
    { kind: "colors", value: "#aabbcc" },
    EditContinuities.Separate,
  );
});

test("読めない色の `値` の欄に `#` の無い 3 桁を打って確定しても、値は届かない", async () => {
  const user = userEvent.setup();
  const onSetTokenValue = renderColor("RED");

  const text = screen.getByLabelText<HTMLInputElement>("値");
  await user.clear(text);
  await user.type(text, "abc{Enter}");

  expect(onSetTokenValue).not.toHaveBeenCalled();
});
