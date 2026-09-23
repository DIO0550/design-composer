import type { ValueOf } from "@/types/ValueOf";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { NumberEx } from "@/utils/NumberEx";
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

/** `background` に渡せる直線グラデーションの値。 */
export type LinearGradientValue = `linear-gradient(${number}deg, ${string})`;

/** 色の変わり目が持つフィールドの名前。型から導出し、綴りを二重管理しない。 */
const GradientStopFieldNames = Object.values({
  Color: "color",
  Ratio: "ratio",
} as const satisfies Readonly<
  Record<Capitalize<keyof GradientStop>, keyof GradientStop>
>);

/** グラデーションが持つフィールドの名前。 */
const GradientFieldNames = Object.values({
  Shape: "shape",
  Angle: "angle",
  Stops: "stops",
} as const satisfies Readonly<
  Record<Capitalize<keyof GradientToken>, keyof GradientToken>
>);

/** 始点からの比率が取りうる範囲。0 が始点、1 が終点。 */
const RatioRange = { min: 0, max: 1 } as const satisfies Range;

/** 色の変わり目として成立する最小の件数。これを下回ると色が変わらない。 */
const MinStopCount = 2;

/**
 * 始点からの比率を % にしたときに残す小数の桁数(docs/04-tokens.md「gradients」)。
 *
 * 丸めないと `0.007` が `0.7000000000000001%` になる。二進小数で表せない比率は
 * 100 倍した時点で端数が出るため、綴る側で落とす。
 */
const RatioPercentDecimals = 4;

/**
 * 形を読む。`"linear"` 以外は読めない。
 *
 * ここで閉じないと素の `string` が `GradientShape` として流通する。
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

  /**
   * 色は読み込んだ時点で正規形(小文字の hex)へ倒れる。
   *
   * @param cursor 読む位置の値
   * @returns 読めた色の変わり目。オブジェクトでない・`color` / `ratio` が欠ける・
   *   知らないフィールドがあるときは `err`
   */
  fromJson(cursor: JsonCursor): JsonDecoded<GradientStop> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine2(
          Json.required(record, "color", ColorToken.fromJson),
          Json.required(record, "ratio", Json.number),
          (color, ratio) => ({ color, ratio }),
        ),
        record,
        GradientStopFieldNames,
      ),
    );
  },

  /**
   * 色は正規形で書き出す。
   *
   * @param stop 書き出す色の変わり目
   * @returns 正規形の色と、始点からの比率
   */
  toJson(stop: GradientStop): JsonObject {
    return { color: ColorToken.toJson(stop.color), ratio: stop.ratio };
  },

  /**
   * `linear-gradient` の 1 stop の綴り。比率は 100 倍して % にする
   * (docs/04-tokens.md「gradients」)。
   *
   * @param stop 綴る色の変わり目
   * @returns 色と % を空白で繋いだもの。0〜1 の外の比率もそのまま % になる
   *   (docs/04-tokens.md「値域の扱い」)
   */
  cssValue(stop: GradientStop): string {
    const percent = NumberEx.round(stop.ratio * 100, RatioPercentDecimals);
    return `${stop.color} ${percent}%`;
  },
} as const;

/** グラデーションの生成・正規化と、JSON 表現との相互変換。 */
export const GradientToken = {
  /**
   * グラデーションを作る。
   *
   * @param shape 色を並べる形
   * @param angle 色が変わっていく向き。度、時計回りで、`0` は下から上
   *   （03-schema「回転」の `rotation` と違い `0` は無回転ではない）
   * @param stops 色の変わり目の並び。書いた順がそのまま使われる
   * @returns 角度が有限で、色の変わり目が 2 件以上あるときだけ some
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
   *
   * @param gradient 倒す元のグラデーション
   * @returns 色の変わり目の色だけを正規形へ倒したもの。形・角度・並びは変わらない
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
   * 色の変わり目の並びは書かれた順のまま読む(docs/04-tokens.md「gradients」の「配列の
   * 並びがそのまま CSS の stop の並びになる」)。
   *
   * 比率の昇順へ倒すと、開いて別のトークンを直しただけで触っていないグラデーションの
   * 書き出しが変わる。
   *
   * @param cursor 読む位置の値
   * @returns 読めたグラデーション。`shape` / `angle` / `stops` が欠ける・`shape` が
   *   `linear` でない・知らないフィールドがあるときは `err`
   */
  fromJson(cursor: JsonCursor): JsonDecoded<GradientToken> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine3(
          Json.required(record, "shape", shapeFromJson),
          Json.required(record, "angle", Json.number),
          Json.required(record, "stops", (stops) =>
            Json.arrayOf(stops, GradientStop.fromJson),
          ),
          (shape, angle, stops) => ({ shape, angle, stops }),
        ),
        record,
        GradientFieldNames,
      ),
    );
  },

  /**
   * 色の変わり目は持っている並びのまま書き出す。
   *
   * @param gradient 書き出すグラデーション
   * @returns 形・角度・色の変わり目の並びを仕様の順で並べたもの
   */
  toJson(gradient: GradientToken): JsonObject {
    return {
      shape: gradient.shape,
      angle: gradient.angle,
      stops: gradient.stops.map(GradientStop.toJson),
    };
  },

  /**
   * CSS の `background` に渡せる綴り。色の変わり目は持っている並びのまま並べる
   * (docs/04-tokens.md「gradients」)。
   *
   * @param gradient 綴るグラデーション
   * @returns 角度と色の変わり目を並べた `linear-gradient(...)`。色の変わり目が
   *   2 件に満たなくても綴りは作り、解釈はブラウザに委ねる
   *   (docs/04-tokens.md「値域の扱い」)
   */
  cssValue(gradient: GradientToken): LinearGradientValue {
    switch (gradient.shape) {
      case "linear":
        return `linear-gradient(${gradient.angle}deg, ${gradient.stops
          .map(GradientStop.cssValue)
          .join(", ")})`;
    }
  },
} as const;
