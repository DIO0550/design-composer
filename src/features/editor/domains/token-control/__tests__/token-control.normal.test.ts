import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import type { TokenSet } from "@/domains/token";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { TokenControl, TokenRow, TokenSection } from "../index";

/** 5 種別すべてに 1 件ずつ持つドキュメントの編集状態。 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: {
        colors: { primary: "#3b82f6" },
        spacing: { lg: 24 },
        radius: { md: 8 },
        shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
        typography: {
          body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
        },
      },
    }),
  );
}

function sectionOf(
  state: EditorState,
  kind: Parameters<typeof TokenSet.names>[1],
): TokenSection {
  return Option.unwrap(
    Option.fromNullable(
      TokenSection.forDocument(state).find((section) => section.kind === kind),
    ),
  );
}

test("一覧には5種別すべてのセクションが仕様の順で並ぶ", () => {
  const sections = TokenSection.forDocument(setupState());

  expect(sections.map((section) => section.kind)).toEqual([
    "colors",
    "spacing",
    "radius",
    "shadows",
    "typography",
  ]);
});

test("トークンを1つも持たない種別も見出しだけ並ぶ", () => {
  const state = EditorState.create(DesignDocument.create({}));

  expect(TokenSection.forDocument(state)).toHaveLength(5);
});

test("色の行には色見本と hex が出る", () => {
  const [row] = sectionOf(setupState(), "colors").rows;

  expect(row.preview).toEqual({ kind: "swatch", color: "#3b82f6" });
  expect(row.valueText).toBe("#3b82f6");
});

test("長さの行には値に比例した幅の見本と px 付きの値が出る", () => {
  const [row] = sectionOf(setupState(), "radius").rows;

  expect(row.preview).toEqual({ kind: "bar", widthPx: 8 });
  expect(row.valueText).toBe("8px");
});

test("上限より長い長さの見本は同じ幅で頭打ちになる", () => {
  const [row] = sectionOf(setupState(), "spacing").rows;

  expect(row.preview).toEqual({ kind: "bar", widthPx: 20 });
});

test("影の行には box-shadow に渡せる値が出る", () => {
  const [row] = sectionOf(setupState(), "shadows").rows;

  expect(row.preview).toEqual({ kind: "none" });
  expect(row.valueText).toBe("0px 1px 3px 0px #0000001a");
});

test("書体の行にはサイズ・行間・太さが出る", () => {
  const [row] = sectionOf(setupState(), "typography").rows;

  expect(row.valueText).toBe("16px / 1.6 / 400");
});

test("値が1つの値で表せる種別の行は選んで直せる", () => {
  const state = setupState();

  expect(TokenRow.isEditable(sectionOf(state, "colors").rows[0])).toBe(true);
  expect(TokenRow.isEditable(sectionOf(state, "spacing").rows[0])).toBe(true);
});

test("複合オブジェクトの種別の行は直せない", () => {
  const state = setupState();

  expect(TokenRow.isEditable(sectionOf(state, "shadows").rows[0])).toBe(false);
  expect(TokenRow.isEditable(sectionOf(state, "typography").rows[0])).toBe(
    false,
  );
});

test("値が1つの値で表せる種別にはトークンを足せる", () => {
  expect(TokenSection.addTemplate(sectionOf(setupState(), "colors"))).toEqual(
    Option.some({ kind: "colors" }),
  );
});

test("複合オブジェクトの種別にはトークンを足せない", () => {
  expect(TokenSection.addTemplate(sectionOf(setupState(), "shadows"))).toEqual(
    Option.none,
  );
});

test("色を選ぶとカラーピッカーの入力欄になる", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "colors",
    name: "primary",
  });

  expect(Option.unwrap(TokenControl.forSelection(state)).input).toEqual({
    kind: "color",
    value: "#3b82f6",
  });
});

test("長さを選ぶと数値の入力欄になる", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "radius",
    name: "md",
  });

  expect(Option.unwrap(TokenControl.forSelection(state)).input).toEqual({
    kind: "length",
    value: 8,
  });
});

test("複合オブジェクトの種別を選んでも編集欄は出ない", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "shadows",
    name: "sm",
  });

  expect(TokenControl.forSelection(state)).toEqual(Option.none);
});

test("長さの入力欄に打った文字列は編集中のトークンの種別の値になる", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "radius",
    name: "md",
  });
  const control = Option.unwrap(TokenControl.forSelection(state));

  expect(TokenControl.valueFrom(control, "12")).toEqual(
    Option.some({ kind: "radius", value: 12 }),
  );
});

test("数値として読めない入力では値を変えない", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "spacing",
    name: "lg",
  });
  const control = Option.unwrap(TokenControl.forSelection(state));

  expect(TokenControl.valueFrom(control, "")).toEqual(Option.none);
  expect(TokenControl.valueFrom(control, "-")).toEqual(Option.none);
});

test("カラーピッカーが返した hex はそのまま色の値になる", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "colors",
    name: "primary",
  });
  const control = Option.unwrap(TokenControl.forSelection(state));

  expect(TokenControl.valueFrom(control, "#00ff00")).toEqual(
    Option.some({ kind: "colors", value: "#00ff00" }),
  );
});
