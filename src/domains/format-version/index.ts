import { Json, type JsonCursor, type JsonDecoded } from "@/utils/Json";
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

  /** `"major.minor"` 形式でなければ none を返す。 */
  parse(value: string): Option<FormatVersion> {
    const match = FORMAT_VERSION_PATTERN.exec(value);
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
