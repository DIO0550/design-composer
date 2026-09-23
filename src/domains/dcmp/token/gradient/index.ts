import type { ValueOf } from "@/types/ValueOf";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { NumberEx } from "@/utils/NumberEx";
import { Result } from "@/utils/Result";
import { ColorToken } from "../color";

/**
 * グラデーションの形を名前で指すための対応表(docs/04-tokens.md「gradients」の `shape`)。
 * `GradientShape` はここから導出し、形を二重管理しない。
 */
export const GradientShapes = {
  Linear: "linear",
} as const;

/** グラデーションの形。 */
export type GradientShape = ValueOf<typeof GradientShapes>;

/** 色の変わり目 1 件(docs/04-tokens.md「gradients」の `stops`)。 */
export type GradientStop = Readonly<{
  color: ColorToken;
  ratio: number;
}>;

/**
 * グラデーションのトークン(docs/04-tokens.md「gradients」)。
 * `stops` の並びがそのまま CSS の stop の並びになる。
 *
 * 値域(`ratio` は 0〜1、`stops` は 2 件以上)を課すのは編集で受け取る側。読み込みでは
 * 弾かない(docs/04-tokens.md「値域の扱い」)。
 */
export type GradientToken = Readonly<{
  shape: GradientShape;
  angle: number;
  stops: readonly GradientStop[];
}>;

/**
 * グラデーションが持つフィールドの名前。
 * 型のキーから導出するので、フィールドを足したときに書き漏らすとここが落ちる。
 */
const GradientFields = {
  Shape: "shape",
  Angle: "angle",
  Stops: "stops",
} as const satisfies Readonly<
  Record<Capitalize<keyof GradientToken>, keyof GradientToken>
>;

/** stop 1 件が持つフィールドの名前。 */
const GradientStopFields = {
  Color: "color",
  Ratio: "ratio",
} as const satisfies Readonly<
  Record<Capitalize<keyof GradientStop>, keyof GradientStop>
>;

/**
 * `ratio` を % にしたときに残す小数の桁。
 *
 * 100 倍すると二進小数の誤差が綴りに出る(`0.007` が `0.7000000000000001%`)。
 * 0.0001% のずれは 1px あたり 1e-6 px にも満たず画面では見分けられないので、ここで止める。
 */
const RatioDecimals = 4;

/**
 * `linear-gradient(角度deg, 色 割合%, …)` の綴り。
 *
 * 型が閉じているのは先頭の `linear-gradient(<数値>deg, ` と末尾の `)` までで、中身の
 * 色と割合は閉じていない。`stops` が空のときは `linear-gradient(90deg, )` になり、
 * この型を満たしたままブラウザが宣言ごと捨てる値になる(下記 `cssValue`)。
 */
export type LinearGradientValue = `linear-gradient(${number}deg, ${string})`;

/**
 * stop 1 件を `色 割合%` の綴りにする。
 *
 * @param stop 綴りにしたい変わり目
 * @returns `色 割合%` の 1 件分
 */
function stopText(stop: GradientStop): string {
  return `${stop.color} ${NumberEx.round(stop.ratio * 100, RatioDecimals)}%`;
}

/**
 * stop 1 件を読む。
 *
 * @param cursor 読み出し元のカーソル
 * @returns 読めた変わり目。フィールドの欠け・型違い・知らないフィールドでは `err`
 */
function stopFromJson(cursor: JsonCursor): JsonDecoded<GradientStop> {
  return Result.flatMap(Json.record(cursor), (record) =>
    Json.knownFields(
      Json.combine2(
        Json.required(record, "color", ColorToken.fromJson),
        Json.required(record, "ratio", Json.number),
        (color, ratio) => ({ color, ratio }),
      ),
      record,
      Object.values(GradientStopFields),
    ),
  );
}

/**
 * 形を読む。語彙は `linear` だけに閉じている(docs/04-tokens.md「gradients」)。
 *
 * @param cursor 読み出し元のカーソル
 * @returns 読めた形。`linear` 以外の綴りでは `err`
 */
function shapeFromJson(cursor: JsonCursor): JsonDecoded<GradientShape> {
  return Result.flatMap(Json.string(cursor), (text) => {
    if (text !== GradientShapes.Linear) {
      return Json.error(
        "invalid-type",
        cursor.path,
        `expected "${GradientShapes.Linear}" but got "${text}"`,
      );
    }
    return Result.ok(GradientShapes.Linear);
  });
}

/** グラデーションの読み書き・CSS への展開と、JSON 表現との相互変換。 */
export const GradientToken = {
  /**
   * 値を正規形へ倒す。グラデーションが正規形を持つのは stop の中の生 hex だけ
   * (docs/04-tokens.md「gradients」の `color`)。
   *
   * 保存形式の規則なので、書き込みの境界(`Token.normalized`)からだけ通す。
   */
  normalized(gradient: GradientToken): GradientToken {
    return {
      ...gradient,
      stops: gradient.stops.map((stop) => ({
        ...stop,
        color: ColorToken.normalize(stop.color),
      })),
    };
  },

  /**
   * CSS の値。角度は度をそのまま書く(docs/04-tokens.md「gradients」の `angle` が CSS の
   * `linear-gradient` と同じ向きで定義されている)。
   *
   * @param gradient 綴りにしたいグラデーション
   * @returns 角度と変わり目を仕様の並びで書いた `linear-gradient(…)`。
   *   `stops` が 1 件以上あれば `background` に渡せる(1 件なら単色として描かれる)。
   *   0 件のときはブラウザが宣言ごと捨てる綴りになる(docs/04-tokens.md「値域の扱い」が
   *   2 件に満たないファイルを読み込みで弾かないため起こりうる)
   */
  cssValue(gradient: GradientToken): LinearGradientValue {
    switch (gradient.shape) {
      case "linear":
        return `linear-gradient(${gradient.angle}deg, ${gradient.stops
          .map(stopText)
          .join(", ")})`;
    }
  },

  /**
   * 値域は見ない。`ratio` が 0〜1 の外にある / `stops` が 2 件に満たないファイルも
   * 読める(docs/04-tokens.md「値域の扱い」)。
   */
  fromJson(cursor: JsonCursor): JsonDecoded<GradientToken> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine3(
          Json.required(record, "shape", shapeFromJson),
          Json.required(record, "angle", Json.number),
          Json.required(record, "stops", (stops) =>
            Json.arrayOf(stops, stopFromJson),
          ),
          (shape, angle, stops) => ({ shape, angle, stops }),
        ),
        record,
        Object.values(GradientFields),
      ),
    );
  },

  toJson(gradient: GradientToken): JsonObject {
    return {
      shape: gradient.shape,
      angle: gradient.angle,
      stops: gradient.stops.map((stop) => ({
        color: ColorToken.toJson(stop.color),
        ratio: stop.ratio,
      })),
    };
  },
} as const;
