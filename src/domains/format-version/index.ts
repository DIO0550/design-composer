import { Json, type JsonDecoded } from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

export type FormatVersion = Readonly<{
  major: number;
  minor: number;
}>;

export type FormatVersionCompatibility =
  | "compatible"
  | "needs-migration"
  | "unsupported";

const CURRENT: FormatVersion = { major: 1, minor: 0 };

const FORMAT_VERSION_PATTERN = /^(\d+)\.(\d+)$/;

export const FormatVersion = {
  CURRENT,

  /**
   * 形式が不正なら none を返す。
   * 不正な formatVersion を「エラーの一覧」として報告する側
   * (ファイル読み込み)は、例外ではなく値で受け取る必要があるため。
   */
  tryParse(value: string): Option<FormatVersion> {
    const match = FORMAT_VERSION_PATTERN.exec(value);
    if (match === null) {
      return Option.none;
    }
    return Option.some({ major: Number(match[1]), minor: Number(match[2]) });
  },

  parse(value: string): FormatVersion {
    const parsed = FormatVersion.tryParse(value);
    if (!parsed.some) {
      throw new Error(`invalid formatVersion: "${value}"`);
    }
    return parsed.value;
  },

  /** JSON 上の表現は `"major.minor"` の文字列(docs/01-file-format.md)。 */
  fromJson(value: unknown, path: string): JsonDecoded<FormatVersion> {
    return Result.flatMap(Json.string(value, path), (text) => {
      const parsed = FormatVersion.tryParse(text);
      if (!parsed.some) {
        return Json.error(
          "invalid-type",
          path,
          `expected "major.minor" but got "${text}"`,
        );
      }
      return Result.ok(parsed.value);
    });
  },

  format(version: FormatVersion): string {
    return `${version.major}.${version.minor}`;
  },

  compatibility(
    fileVersion: FormatVersion,
    appVersion: FormatVersion = CURRENT,
  ): FormatVersionCompatibility {
    if (fileVersion.major !== appVersion.major) {
      return fileVersion.major < appVersion.major
        ? "needs-migration"
        : "unsupported";
    }
    return fileVersion.minor <= appVersion.minor ? "compatible" : "unsupported";
  },
} as const;
