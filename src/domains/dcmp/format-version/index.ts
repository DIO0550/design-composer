import { Json, type JsonCursor, type JsonDecoded } from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * major を特定の版に固定した形式版。
 * 「この値はこの major の仕様で書かれている」を型に出すために使う
 * （版ごとに型を持つドキュメントが、自分の版以外を名乗れないようにするため）。
 * minor は後方互換な追加なので、同じ major の中で幅を持つ。
 */
export type FormatVersionOf<Major extends number> = Readonly<{
  major: Major;
  minor: number;
}>;

/**
 * major を問わない形式版。
 * ファイルから読んだ直後など、まだどの版か絞れていない段階で使う。
 */
export type FormatVersion = FormatVersionOf<number>;

/** ファイルの版がアプリにとってどういう関係にあるか(docs/01-file-format.md の表)。 */
export type FormatVersionCompatibility =
  | "compatible"
  | "needs-migration"
  | "unsupported";

/** アプリが読み書きする仕様の major。ドメインの型はこの major に固定される。 */
const CurrentMajor = 1;

/**
 * アプリが書き出す版。
 * minor は後方互換な追加のたびに上げる(docs/01-file-format.md「formatVersion」。
 * どの版で何が加わったかの内訳もそこの表が持つ)。
 */
const Current: FormatVersionOf<typeof CurrentMajor> = {
  major: CurrentMajor,
  minor: 3,
};

const FormatVersionPattern = /^(\d+)\.(\d+)$/;

export const FormatVersion = {
  Current,

  /** `"major.minor"` 形式でなければ none を返す。 */
  parse(value: string): Option<FormatVersion> {
    const match = FormatVersionPattern.exec(value);
    if (match === null) {
      return Option.none;
    }
    return Option.some({ major: Number(match[1]), minor: Number(match[2]) });
  },

  /** JSON 上の表現は `"major.minor"` の文字列(docs/01-file-format.md)。 */
  fromJson(cursor: JsonCursor): JsonDecoded<FormatVersion> {
    return Result.flatMap(Json.string(cursor), (text) => {
      const parsed = FormatVersion.parse(text);
      if (!parsed.some) {
        return Json.error(
          "invalid-type",
          cursor.path,
          `expected "major.minor" but got "${text}"`,
        );
      }
      return Result.ok(parsed.value);
    });
  },

  /**
   * 指定した major の版として読む。違う major を名乗る値は読み込みエラーにする。
   * 版ごとに型を持つドキュメントのデコード境界で使い、
   * 「その型の値は必ずその major を名乗る」を成立させる。
   */
  fromJsonOf<Major extends number>(
    cursor: JsonCursor,
    major: Major,
  ): JsonDecoded<FormatVersionOf<Major>> {
    return Result.flatMap(FormatVersion.fromJson(cursor), (version) => {
      if (version.major !== major) {
        return Json.error(
          "invalid-type",
          cursor.path,
          `expected format version major ${major} but got ${version.major}`,
        );
      }
      return Result.ok({ ...version, major });
    });
  },

  format(version: FormatVersion): string {
    return `${version.major}.${version.minor}`;
  },

  compatibility(
    fileVersion: FormatVersion,
    appVersion: FormatVersion = Current,
  ): FormatVersionCompatibility {
    if (fileVersion.major !== appVersion.major) {
      return fileVersion.major < appVersion.major
        ? "needs-migration"
        : "unsupported";
    }
    return fileVersion.minor <= appVersion.minor ? "compatible" : "unsupported";
  },
} as const;
