import type { ValueOf } from "@/types/ValueOf";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Range } from "@/utils/Range";
import { Result } from "@/utils/Result";
import { ColorToken } from "../color";

/**
 * 色を並べる形を名前で指すための対応表(docs/04-tokens.md「gradients」)。
 * `GradientShape` はここから導出し、形を二重管理しない。
 */
export const GradientShapes = {
  Linear: "linear",
} as const;

/** 色を並べる形。直線のみで、同心円・扇は持たない。 */
export type GradientShape = ValueOf<typeof GradientShapes>;

/** 色の変わり目1件。色と、始点からの比率は対でしか意味を持たない。 */
export type GradientStop = Readonly<{
  color: ColorToken;
  ratio: number;
}>;

/**
 * グラデーションのトークン(docs/04-tokens.md「gradients」)。
 *
 * 値域を課すのは編集で受け取る側(`GradientStop.create` / `GradientToken.create`)。
 */
export type GradientToken = Readonly<{
  shape: GradientShape;
  angle: number;
  stops: readonly GradientStop[];
}>;

/**
 * 色の変わり目が持つフィールドの対応表。
 *
 * `satisfies` が見るのは**キーの過不足と綴り**だけで、キーに割り当てた値がずれてもここでは
 * 落ちない。並びが要るときは `GradientStop.fields` を使い、`Object.values` をそこ 1 箇所に
 * 閉じる。
 */
const GradientStopFields = {
  Color: "color",
  Ratio: "ratio",
} as const satisfies Readonly<
  Record<Capitalize<keyof Required<GradientStop>>, keyof Required<GradientStop>>
>;

/**
 * グラデーションが持つフィールドの対応表。
 * 見方は `GradientStopFields` と同じ。
 */
const GradientFields = {
  Shape: "shape",
  Angle: "angle",
  Stops: "stops",
} as const satisfies Readonly<
  Record<
    Capitalize<keyof Required<GradientToken>>,
    keyof Required<GradientToken>
  >
>;

/** 始点からの比率が取りうる範囲。0 が始点、1 が終点。 */
const RatioRange = { min: 0, max: 1 } as const satisfies Range;

/** 色の変わり目として成立する最小の件数。これを下回ると色が変わらない。 */
const MinStopCount = 2;

/**
 * 形を読む。`"linear"` 以外は読めない。
 *
 * ここで閉じないと素の `string` が `GradientShape` として流通する。読み込みで未知の綴りを
 * 弾くのは、`TokenSet.fromJson` が未知の種別を弾いているのと同じ向き。
 *
 * @param cursor 読む位置の値
 * @returns 読めた形。文字列でない・`"linear"` でないときは `err`
 */
function shapeFromJson(cursor: JsonCursor): JsonDecoded<GradientShape> {
  return Result.flatMap(Json.string(cursor), (value) =>
    value === GradientShapes.Linear
      ? Result.ok(GradientShapes.Linear)
      : Json.error(
          "invalid-type",
          cursor.path,
          `expected "${GradientShapes.Linear}" but got "${value}"`,
        ),
  );
}

/** 色の変わり目の生成と、JSON 表現との相互変換。 */
export const GradientStop = {
  fields(): readonly string[] {
    return Object.values(GradientStopFields);
  },

  /**
   * 色の変わり目を作る。
   *
   * `ratio` をブランド型にしても `GradientToken` が持つ並びは `number` のままで、読み込み
   * は値域を見ない(docs/04-tokens.md「値域の扱い」)。型では弾けないので、この入口の
   * `Option` だけが境界になる。
   *
   * @param color その位置に置く色
   * @param ratio 始点からの比率
   * @returns 比率が 0 以上 1 以下のときだけ some
   */
  create(color: ColorToken, ratio: number): Option<GradientStop> {
    return Range.contains(RatioRange, ratio)
      ? Option.some({ color, ratio })
      : Option.none;
  },

  fromJson(cursor: JsonCursor): JsonDecoded<GradientStop> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine2(
          Json.required(record, "color", ColorToken.fromJson),
          Json.required(record, "ratio", Json.number),
          (color, ratio) => ({ color, ratio }),
        ),
        record,
        GradientStop.fields(),
      ),
    );
  },

  toJson(stop: GradientStop): JsonObject {
    return { color: ColorToken.toJson(stop.color), ratio: stop.ratio };
  },
} as const;

/** グラデーションの生成・正規化と、JSON 表現との相互変換。 */
export const GradientToken = {
  fields(): readonly string[] {
    return Object.values(GradientFields);
  },

  /**
   * グラデーションを作る。
   *
   * @param shape 色を並べる形
   * @param angle 色が変わっていく向き。度、時計回り
   * @param stops 色の変わり目の並び。書いた順がそのまま使われる
   * @returns 角度が有限で、色の変わり目が 2 件以上あるときだけ some。
   *   角度に値域を課さないのは、1 周を超える角度も「1 周と◯度」で意味が決まるため
   */
  create(
    shape: GradientShape,
    angle: number,
    stops: readonly GradientStop[],
  ): Option<GradientToken> {
    const isDrawable = Number.isFinite(angle) && stops.length >= MinStopCount;
    return isDrawable ? Option.some({ shape, angle, stops }) : Option.none;
  },

  /**
   * 値を正規形へ倒す。グラデーションが正規形を持つのは中の生 hex だけ
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

  fromJson(cursor: JsonCursor): JsonDecoded<GradientToken> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine3(
          Json.required(record, "shape", shapeFromJson),
          Json.required(record, "angle", Json.number),
          Json.required(record, "stops", (stops) =>
            Json.arrayOf(stops, GradientStop.fromJson),
          ),
          /*
           * 並びは書かれた順のまま保つ(docs/04-tokens.md「gradients」の「配列の並びが
           * そのまま CSS の stop の並びになる」)。比率の昇順へ倒すと、開いて別のトークン
           * を直しただけで触っていないグラデーションの書き出しが変わる。
           */
          (shape, angle, stops) => ({ shape, angle, stops }),
        ),
        record,
        GradientToken.fields(),
      ),
    );
  },

  toJson(gradient: GradientToken): JsonObject {
    return {
      shape: gradient.shape,
      angle: gradient.angle,
      stops: gradient.stops.map(GradientStop.toJson),
    };
  },
} as const;
