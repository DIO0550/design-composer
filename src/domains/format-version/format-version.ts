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

  parse(value: string): FormatVersion {
    const match = FORMAT_VERSION_PATTERN.exec(value);
    if (match === null) {
      throw new Error(`invalid formatVersion: "${value}"`);
    }
    return { major: Number(match[1]), minor: Number(match[2]) };
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
