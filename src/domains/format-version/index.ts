import { Option } from "@/utils/Option";

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
