import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Interop } from "@/utils/Interop";
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
 * 値域を課すのは編集で受け取る側(`GradientStop.create` / `GradientToken.create` と、
 * 既にある値を差し替える `GradientToken.withAngle` / `withStopRatioPercent` / `withStopColor` /
 * `removeStop`)。
 */
export type GradientToken = Readonly<{
  shape: GradientShape;
  angle: number;
  stops: readonly GradientStop[];
}>;

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
 * 比率を % で綴るときの小数点以下の桁数(docs/04-tokens.md「gradients」)。
 *
 * 4 桁(比率の 6 桁)なら、丸めで残るずれはグラデーション線の長さ 1px あたり 1e-6px に
 * 満たず描画に出ない。
 */
const RatioPercentDigits = { fractionDigits: 4 } as const;

/** 比率そのものを丸める桁数。% の桁数から導き、二重に持たない。 */
const RatioDigits = {
  fractionDigits: RatioPercentDigits.fractionDigits + 2,
} as const;

/** 比率を % で受け取るときの範囲。0% が始点、100% が終点。 */
const RatioPercentRange = { min: 0, max: 100 } as const satisfies Range;

/** 1 件だけの色の変わり目を、終点側と始点側のどちらへ寄せて補うかの境目。 */
const SingleStopPivot = 0.5;

/** CSS の color stop 1 件の綴り。色と、始点からの位置（%）。 */
type ColorStopValue = `${ColorToken} ${number}%`;

/** `linear-gradient()` の綴り。角度（deg）と、color stop の並び。 */
export type LinearGradientValue = `linear-gradient(${number}deg, ${string})`;

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
   * 始点からの比率を % で表した値。0〜1 の外でも範囲へ収めない(docs/04-tokens.md「gradients」)。
   *
   * @param stop 比率を読む色の変わり目
   * @returns 比率を % にして小数 4 桁で丸めた値
   */
  ratioPercentOf(stop: GradientStop): number {
    return NumberEx.round(stop.ratio * 100, RatioPercentDigits);
  },

  /**
   * CSS の color stop として綴る。比率は 0〜1 の外でも範囲へ収めずそのまま % にする
   * (docs/04-tokens.md「gradients」)。
   *
   * @param stop 綴る色の変わり目
   * @returns 色と、比率を % にして小数 4 桁で丸めた位置
   */
  cssValue(stop: GradientStop): ColorStopValue {
    return `${stop.color} ${GradientStop.ratioPercentOf(stop)}%`;
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
} as const;

/**
 * 節見出しの + で作るグラデーション(docs/06-ui.md「節見出しの + で作るトークン」)。黒から白へ、
 * 左から右に変わる。色の変わり目が 1 件も無いところへ + を押したときも、この 2 件を入れる。
 *
 * feature から作るとドメインの `addStop` が同じ 2 件を参照できないので、ドメインに置く。
 */
const InitialGradient: GradientToken = {
  shape: GradientShapes.Linear,
  angle: 90,
  stops: [
    { color: "#000000", ratio: RatioRange.min },
    { color: "#ffffff", ratio: RatioRange.max },
  ],
};

/**
 * 1 件しかない色の変わり目に、同じ色の変わり目を補って 2 件にする。
 *
 * @param stop 今ある 1 件
 * @returns 比率が 0.5 未満なら同じ色を比率 1 で末尾へ、0.5 以上なら比率 0 で先頭へ足した 2 件
 */
function pairedWithSingleStop(stop: GradientStop): readonly GradientStop[] {
  return stop.ratio < SingleStopPivot
    ? [stop, { color: stop.color, ratio: RatioRange.max }]
    : [{ color: stop.color, ratio: RatioRange.min }, stop];
}

/**
 * 隣り合う 2 件のうち最も広い隙間の中央へ、左側の色で色の変わり目を差し込む
 * (docs/06-ui.md「Tokens の gradients」)。
 *
 * 広さは差の絶対値を比率の桁で丸めて比べる。丸めないと、浮動小数の誤差で同じ広さの隙間の
 * どちらを採るかが入力の綴りによって変わる。
 *
 * @param stops 2 件以上の色の変わり目
 * @returns 差し込んだ並び。並べ替えない。隣り合う組が無ければ `stops` のまま
 */
function withStopInWidestGap(
  stops: readonly GradientStop[],
): readonly GradientStop[] {
  const gaps = ArrayEx.adjacentPairs(stops).map((pair, index) => ({
    pair,
    index,
    width: NumberEx.round(
      Math.abs(pair.next.ratio - pair.previous.ratio),
      RatioDigits,
    ),
  }));
  const widest = ArrayEx.minBy(gaps, (gap) => -gap.width);
  if (!Option.isSome(widest)) {
    return stops;
  }
  const { pair, index } = widest.value;
  const middle: GradientStop = {
    color: pair.previous.color,
    ratio: NumberEx.round(
      (pair.previous.ratio + pair.next.ratio) / 2,
      RatioDigits,
    ),
  };
  return Result.unwrapOr(ArrayEx.insertAt(stops, index + 1, middle), stops);
}

/**
 * 1 件の色の変わり目だけを差し替えたグラデーション。
 *
 * @param gradient 差し替える前のグラデーション
 * @param edit 差し替える位置と、新しい色の変わり目
 * @returns 差し替えたもの。位置が並びの外なら `none`
 */
function withStopAt(
  gradient: GradientToken,
  edit: Readonly<{ stopIndex: number; stop: GradientStop }>,
): Option<GradientToken> {
  return Option.map(
    Interop.toOption(
      ArrayEx.replaceAt(gradient.stops, edit.stopIndex, edit.stop),
    ),
    (stops) => ({ ...gradient, stops }),
  );
}

/** グラデーションの生成・正規化と、JSON 表現との相互変換。 */
export const GradientToken = {
  Initial: InitialGradient,

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
   * 色が正規形の hex でない色の変わり目(docs/04-tokens.md「colors」)。
   *
   * @param gradient 色を確かめるグラデーション
   * @returns `ColorToken.isValid` を満たさない色の変わり目の添字(0 始まり)を、並びの順で
   *   並べたもの
   */
  collectInvalidColorStopIndexes(gradient: GradientToken): readonly number[] {
    return gradient.stops.flatMap((stop, index) =>
      ColorToken.isValid(stop.color) ? [] : [index],
    );
  },

  /**
   * 角度だけを差し替えたグラデーション。値域で丸めず、打った値をそのまま持つ
   * (docs/06-ui.md「Tokens の gradients」)。
   *
   * @param gradient 差し替える前のグラデーション
   * @param angle 新しい角度(度)
   * @returns 角度だけが入れ替わったもの。角度が有限でなければ `none`
   */
  withAngle(gradient: GradientToken, angle: number): Option<GradientToken> {
    return Number.isFinite(angle)
      ? Option.some({ ...gradient, angle })
      : Option.none;
  },

  /**
   * 1 件の色の変わり目の比率を % で差し替え、比率の順に並べ直したグラデーション
   * (docs/06-ui.md「Tokens の gradients」)。比率が同じ色の変わり目同士は元の並びを保つ。
   *
   * 丸めた比率が今と同じなら並べ直さない。欄は同じ値のままフォーカスを外しても確定するので、
   * 並べ直すと、並んでいないファイルで欄を抜けただけで並びが変わる。
   *
   * @param gradient 差し替える前のグラデーション
   * @param edit 差し替える色の変わり目の位置(0 始まり)と、新しい比率(%。小数も取る)
   * @returns 比率を小数 6 桁(% の小数 4 桁)に丸めて差し替えたもの。位置が並びの外、
   *   比率が 0〜100 の外なら `none`
   */
  withStopRatioPercent(
    gradient: GradientToken,
    edit: Readonly<{ stopIndex: number; percent: number }>,
  ): Option<GradientToken> {
    if (!Range.contains(RatioPercentRange, edit.percent)) {
      return Option.none;
    }
    const ratio = NumberEx.round(edit.percent / 100, RatioDigits);
    return Option.flatMap(
      Option.fromNullable(gradient.stops[edit.stopIndex]),
      (current) => {
        const replaced = withStopAt(gradient, {
          stopIndex: edit.stopIndex,
          stop: { ...current, ratio },
        });
        if (current.ratio === ratio) {
          return replaced;
        }
        return Option.map(replaced, (next) => ({
          ...next,
          stops: ArrayEx.sortBy(next.stops, (stop) => stop.ratio),
        }));
      },
    );
  },

  /**
   * 1 件の色の変わり目の色を差し替えたグラデーション。並べ直さない。
   *
   * @param gradient 差し替える前のグラデーション
   * @param edit 差し替える色の変わり目の位置(0 始まり)と、新しい色
   * @returns 色だけが入れ替わったもの。位置が並びの外なら `none`
   */
  withStopColor(
    gradient: GradientToken,
    edit: Readonly<{ stopIndex: number; color: ColorToken }>,
  ): Option<GradientToken> {
    return Option.flatMap(
      Option.fromNullable(gradient.stops[edit.stopIndex]),
      (current) =>
        withStopAt(gradient, {
          stopIndex: edit.stopIndex,
          stop: { ...current, color: edit.color },
        }),
    );
  },

  /**
   * stop の + で色の変わり目を 1 件足したグラデーション(docs/06-ui.md「Tokens の gradients」)。
   *
   * @param gradient 足す前のグラデーション
   * @returns 2 件以上なら最も広い隙間の中央に 1 件足したもの。1 件なら同じ色を反対の端へ
   *   補ったもの、0 件なら角度を保って `Initial` の 2 件にしたもの。いずれも並べ替えない
   */
  addStop(gradient: GradientToken): GradientToken {
    switch (gradient.stops.length) {
      case 0:
        return { ...gradient, stops: InitialGradient.stops };
      case 1:
        return { ...gradient, stops: pairedWithSingleStop(gradient.stops[0]) };
      default:
        return { ...gradient, stops: withStopInWidestGap(gradient.stops) };
    }
  },

  /**
   * stop の − で色の変わり目を 1 件除いたグラデーション。
   *
   * @param gradient 除く前のグラデーション
   * @param stopIndex 除く色の変わり目の位置(0 始まり)
   * @returns 除いたもの。色の変わり目が 2 件以下(除くと描けなくなる)・位置が並びの外なら `none`
   */
  removeStop(
    gradient: GradientToken,
    stopIndex: number,
  ): Option<GradientToken> {
    if (gradient.stops.length <= MinStopCount) {
      return Option.none;
    }
    return Option.map(
      Interop.toOption(ArrayEx.removeAt(gradient.stops, stopIndex)),
      (stops) => ({ ...gradient, stops }),
    );
  },

  /**
   * CSS の `background` に置ける値として綴る（docs/04-tokens.md「gradients」）。
   *
   * 色の変わり目は書かれた順のまま並べ、2 件に満たなくてもそのまま綴る。
   *
   * @param gradient 綴るグラデーション
   * @returns 角度を deg、色の変わり目を color stop にした `linear-gradient()`
   */
  cssValue(gradient: GradientToken): LinearGradientValue {
    switch (gradient.shape) {
      case GradientShapes.Linear:
        return `linear-gradient(${gradient.angle}deg, ${gradient.stops
          .map(GradientStop.cssValue)
          .join(", ")})`;
    }
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
} as const;
