import { expectTypeOf, test } from "vitest";
import type { ShadowNumberField } from "@/domains/dcmp/token";
import type {
  GradientControl,
  GradientStopRow,
  TokenColorTarget,
  TokenControlRow,
} from "../index";

test("値の欄の field の行の入力欄は数値か文言で、不透明度・比率・角度の欄は入らない", () => {
  expectTypeOf<
    Extract<TokenControlRow, { kind: "field" }>["field"]["input"]["kind"]
  >().toEqualTypeOf<"number" | "text">();
});

test("箱の書き戻し先は色トークン・影の色・stop の色の 3 つで、影は色のフィールドだけを指す", () => {
  expectTypeOf<TokenColorTarget["kind"]>().toEqualTypeOf<
    "colors" | "shadows" | "gradientsStopColor"
  >();
  expectTypeOf<
    Extract<TokenColorTarget, { kind: "shadows" }>["field"]
  >().toEqualTypeOf<"color">();
});

test("stop の比率の欄は % の欄、角度の欄は度の欄", () => {
  expectTypeOf<
    GradientStopRow["ratio"]["input"]["kind"]
  >().toEqualTypeOf<"percent">();
  expectTypeOf<
    GradientControl["angle"]["input"]["kind"]
  >().toEqualTypeOf<"degree">();
});

test("field の行は色も階調も書き戻さず、影は数値のフィールドだけを指す。stop の比率の欄は比率、角度の欄は角度だけを書き戻す", () => {
  type FieldRowTarget = Extract<
    TokenControlRow,
    { kind: "field" }
  >["field"]["target"];
  expectTypeOf<FieldRowTarget["kind"]>().toEqualTypeOf<
    "spacing" | "radius" | "shadows" | "typography"
  >();
  expectTypeOf<
    Extract<FieldRowTarget, { kind: "shadows" }>["field"]
  >().toEqualTypeOf<ShadowNumberField>();
  expectTypeOf<
    GradientStopRow["ratio"]["target"]["kind"]
  >().toEqualTypeOf<"gradientsStopRatio">();
  expectTypeOf<
    GradientControl["angle"]["target"]["kind"]
  >().toEqualTypeOf<"gradientsAngle">();
});
