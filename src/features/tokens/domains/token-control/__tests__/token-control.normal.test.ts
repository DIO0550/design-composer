import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import type { TokenKind } from "@/domains/token";
import { TokenSelection } from "@/domains/token-selection";
import { Font } from "@/utils/Font";
import { Option } from "@/utils/Option";
import { TokenControl, TokenSection } from "../index";
import { fieldOf, fieldsOf, setupDocument } from "./setup";

function sectionOf(document: DesignDocument, kind: TokenKind): TokenSection {
  return Option.unwrap(
    Option.fromNullable(
      TokenSection.forDocument(document).find(
        (section) => section.kind === kind,
      ),
    ),
  );
}

test("一覧には5種別すべてのセクションが仕様の順で並ぶ", () => {
  const sections = TokenSection.forDocument(setupDocument());

  expect(sections.map((section) => section.kind)).toEqual([
    "colors",
    "spacing",
    "radius",
    "shadows",
    "typography",
  ]);
});

test("トークンを1つも持たない種別も見出しだけ並ぶ", () => {
  const document = DesignDocument.create({});

  expect(TokenSection.forDocument(document)).toHaveLength(5);
});

test("色の行には色見本と hex が出る", () => {
  const [row] = sectionOf(setupDocument(), "colors").rows;

  expect(row.preview).toEqual({ kind: "swatch", color: "#3b82f6" });
  expect(row.valueText).toBe("#3b82f6");
});

test("長さの行には値に比例した幅の見本と px 付きの値が出る", () => {
  const [row] = sectionOf(setupDocument(), "radius").rows;

  expect(row.preview).toEqual({ kind: "bar", widthPx: 8 });
  expect(row.valueText).toBe("8px");
});

test("上限より長い長さの見本は同じ幅で頭打ちになる", () => {
  const [row] = sectionOf(setupDocument(), "spacing").rows;

  expect(row.preview).toEqual({ kind: "bar", widthPx: 20 });
});

test("影の行には影を当てた見本と box-shadow に渡せる値が出る", () => {
  const [row] = sectionOf(setupDocument(), "shadows").rows;

  expect(row.preview).toEqual({
    kind: "shadow",
    value: "0px 1px 3px 0px #0000001a",
  });
  expect(row.valueText).toBe("0px 1px 3px 0px #0000001a");
});

test("書体の行にはサイズ・行間・太さが出る", () => {
  const [row] = sectionOf(setupDocument(), "typography").rows;

  expect(row.valueText).toBe("16px / 1.6 / 400");
});

test("書体の行の見本は太さと解決済みのフォントを持つ", () => {
  const [row] = sectionOf(setupDocument(), "typography").rows;

  expect(row.preview).toEqual({
    kind: "letters",
    fontWeight: 400,
    fontFamily: Font.systemStack(),
  });
});

test("色を選ぶとカラーピッカーと不透明度の入力欄が並ぶ", () => {
  expect(fieldsOf("colors", "primary")).toEqual([
    {
      name: "value",
      label: "値",
      input: { kind: "color", value: "#3b82f6" },
      target: { kind: "colors", color: "#3b82f6" },
    },
    {
      name: "alpha",
      label: "不透明度",
      input: { kind: "alphaPercent", value: 100 },
      target: { kind: "colorsAlpha", color: "#3b82f6" },
    },
  ]);
});

test("alpha を持つ色でもカラーピッカーに渡るのは6桁だけになる", () => {
  expect(fieldOf("colors", "veil", "値").input).toEqual({
    kind: "color",
    value: "#3b82f6",
  });
});

test("長さを選ぶと数値の入力欄が1つ出る", () => {
  expect(fieldsOf("radius", "md")).toEqual([
    {
      name: "value",
      label: "値",
      input: { kind: "number", value: 8 },
      target: { kind: "radius" },
    },
  ]);
});

test("影を選ぶとフィールドごとの入力欄が仕様の順で並び、不透明度が色の直後に入る", () => {
  expect(fieldsOf("shadows", "sm").map((field) => field.label)).toEqual([
    "横のずれ",
    "縦のずれ",
    "ぼかし",
    "広がり",
    "色",
    "不透明度",
  ]);
});

test("影の色だけがカラーピッカーの入力欄になる", () => {
  const colorInputs = fieldsOf("shadows", "sm")
    .filter((field) => field.input.kind === "color")
    .map((field) => field.label);

  expect(colorInputs).toEqual(["色"]);
});

test("省略された影の広がりの欄には 0 が出る", () => {
  expect(fieldOf("shadows", "sm", "広がり").input).toEqual({
    kind: "number",
    value: 0,
  });
});

test("書体を選ぶとフィールドごとの入力欄が仕様の順で並ぶ", () => {
  expect(fieldsOf("typography", "body").map((field) => field.label)).toEqual([
    "サイズ",
    "行間",
    "太さ",
    "フォント",
  ]);
});

test("省略された書体のフォントの欄は空欄になる", () => {
  expect(fieldOf("typography", "body", "フォント").input).toEqual({
    kind: "text",
    value: "",
  });
});

test("選択が無いときは編集欄が出ない", () => {
  const selection = TokenSelection.create(setupDocument(), Option.none);

  expect(TokenControl.forSelection(selection)).toEqual(Option.none);
});

test("長さの入力欄に打った文字列は編集中のトークンの種別の値になる", () => {
  const field = fieldOf("radius", "md", "値");

  expect(TokenControl.valueFrom(field.target, "12")).toEqual(
    Option.some({ kind: "radius", value: 12 }),
  );
});

test("数値として読めない入力では値を変えない", () => {
  const field = fieldOf("spacing", "lg", "値");

  expect(TokenControl.valueFrom(field.target, "")).toEqual(Option.none);
  expect(TokenControl.valueFrom(field.target, "-")).toEqual(Option.none);
});

test("カラーピッカーが返した hex はそのまま色の値になる", () => {
  const field = fieldOf("colors", "primary", "値");

  expect(TokenControl.valueFrom(field.target, "#00ff00")).toEqual(
    Option.some({ kind: "colors", value: "#00ff00" }),
  );
});

test("影のぼかしに打った文字列はぼかしだけを変えた影の値になる", () => {
  const field = fieldOf("shadows", "sm", "ぼかし");

  expect(TokenControl.valueFrom(field.target, "8")).toEqual(
    Option.some({
      kind: "shadows",
      value: { x: 0, y: 1, blur: 8, color: "#0000001a" },
    }),
  );
});

test("影の数値の欄に数値として読めない入力が来ても値を変えない", () => {
  const field = fieldOf("shadows", "sm", "横のずれ");

  expect(TokenControl.valueFrom(field.target, "")).toEqual(Option.none);
});

test("書体のサイズに打った文字列はサイズだけを変えた書体の値になる", () => {
  const field = fieldOf("typography", "body", "サイズ");

  expect(TokenControl.valueFrom(field.target, "24")).toEqual(
    Option.some({
      kind: "typography",
      value: { fontSize: 24, lineHeight: 1.6, fontWeight: 400 },
    }),
  );
});

test("書体のフォントに打った文字列は書体の値になる", () => {
  const field = fieldOf("typography", "body", "フォント");

  expect(TokenControl.valueFrom(field.target, "Inter")).toEqual(
    Option.some({
      kind: "typography",
      value: {
        fontSize: 16,
        lineHeight: 1.6,
        fontWeight: 400,
        fontFamily: "Inter",
      },
    }),
  );
});

test("書体のフォントを空欄にすると指定が外れる", () => {
  const field = fieldOf("typography", "body", "フォント");

  expect(TokenControl.valueFrom(field.target, "")).toEqual(
    Option.some({
      kind: "typography",
      value: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
    }),
  );
});

test("6桁の hex として読めない入力では色を変えない", () => {
  const field = fieldOf("colors", "primary", "値");

  expect(TokenControl.valueFrom(field.target, "3b82f6")).toEqual(Option.none);
  expect(TokenControl.valueFrom(field.target, "#00ff0080")).toEqual(
    Option.none,
  );
});

test("影の色をピッカーで選び直しても元の alpha は残る", () => {
  const field = fieldOf("shadows", "sm", "色");

  expect(TokenControl.valueFrom(field.target, "#ff0000")).toEqual(
    Option.some({
      kind: "shadows",
      value: { x: 0, y: 1, blur: 3, color: "#ff00001a" },
    }),
  );
});

test("書体の太さの欄に値域の内側を打つと太さが変わる", () => {
  const field = fieldOf("typography", "body", "太さ");

  expect(TokenControl.valueFrom(field.target, "700")).toEqual(
    Option.some({
      kind: "typography",
      value: { fontSize: 16, lineHeight: 1.6, fontWeight: 700 },
    }),
  );
});

test("書体の太さの欄に値域の外を打っても値を変えない", () => {
  const field = fieldOf("typography", "body", "太さ");

  expect(TokenControl.valueFrom(field.target, "1000")).toEqual(Option.none);
});

test("書体のサイズの欄に 0 を打っても値を変えない", () => {
  const field = fieldOf("typography", "body", "サイズ");

  expect(TokenControl.valueFrom(field.target, "0")).toEqual(Option.none);
});

test("影のぼかしの欄に負の数を打っても値を変えない", () => {
  const field = fieldOf("shadows", "sm", "ぼかし");

  expect(TokenControl.valueFrom(field.target, "-1")).toEqual(Option.none);
});

test("影の横のずれの欄には負の数を打てる", () => {
  const field = fieldOf("shadows", "sm", "横のずれ");

  expect(TokenControl.valueFrom(field.target, "-4")).toEqual(
    Option.some({
      kind: "shadows",
      value: { x: -4, y: 1, blur: 3, color: "#0000001a" },
    }),
  );
});

test("余白の欄に負の数を打っても値を変えない", () => {
  const field = fieldOf("spacing", "lg", "値");

  expect(TokenControl.valueFrom(field.target, "-1")).toEqual(Option.none);
});

test("角丸の欄に負の数を打っても値を変えない", () => {
  const field = fieldOf("radius", "md", "値");

  expect(TokenControl.valueFrom(field.target, "-1")).toEqual(Option.none);
});
