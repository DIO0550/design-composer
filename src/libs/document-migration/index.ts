import { FormatVersion } from "@/domains/format-version";
import type { JsonRecord } from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * major ひとつ分の変換。1つの major を次の major の形へ写す（v1 → v2 の変換1つ分）。
 *
 * 受け取るのは JSON のデータモデルそのもの。旧 major のファイルは今のドメインの型では
 * 表せない（表せなくなる変更が major の定義）ため、デコード前の形で扱う。
 * 失敗しうる変換は理由を返す(docs/01-file-format.md「formatVersion」)。
 */
export type MigrationStep = (
  document: JsonRecord,
) => Result<JsonRecord, string>;

/**
 * 変換元の major から、その1つ分の変換を引く表。
 * major をキーにするので、同じ major の変換を2つ登録することはできない。
 */
export type MigrationSteps = Readonly<Partial<Record<number, MigrationStep>>>;

/** マイグレーションが進めない理由。呼び出し側が種類で分岐できるよう直和で列挙する。 */
export type DocumentMigrationError =
  | Readonly<{
      kind: "unsupported-format-version";
      fileVersion: FormatVersion;
      appVersion: FormatVersion;
    }>
  | Readonly<{ kind: "missing-migration-step"; fromMajor: number }>
  | Readonly<{
      kind: "migration-step-failed";
      fromMajor: number;
      reason: string;
    }>;

export const DocumentMigrationError = {
  /**
   * 診断用の英語メッセージ。
   * 利用者向けの文言は `kind` で分岐して表示層が組み立てる。
   */
  message(error: DocumentMigrationError): string {
    switch (error.kind) {
      case "unsupported-format-version":
        return `file format version ${FormatVersion.format(error.fileVersion)} is newer than this app (${FormatVersion.format(error.appVersion)}); update the app to open this file`;
      case "missing-migration-step":
        return `no migration step from format version major ${error.fromMajor}`;
      case "migration-step-failed":
        return `migration from format version major ${error.fromMajor} failed: ${error.reason}`;
    }
  },
} as const;

/**
 * 登録済みの変換ステップ。破壊的変更がまだ無いため空。
 * major を上げるときは変換元の major をキーにして1つ足す
 * (`1: migrateV1ToV2` のように、1つの major 分の変換を1つの塊として持つ)。
 */
const MIGRATION_STEPS: MigrationSteps = {};

/**
 * JSON のデータモデルから formatVersion を読む。
 * デコード前なので、フィールドの欠落・型違いはここでは報告せず「読めない」として扱う
 * (形の検証は `DesignDocument.fromJson` の担当。同じ不備を別の語彙で二重に報告しない)。
 *
 * @param document 読み出し元の JSON のデータモデル
 * @returns 読めた版。フィールドが無い・文字列でない・形式が違うなら `none`
 */
function readFormatVersion(document: JsonRecord): Option<FormatVersion> {
  const raw = document.formatVersion;
  if (typeof raw !== "string") {
    return Option.none;
  }
  return FormatVersion.parse(raw);
}

/**
 * 変換後の形が名乗る版を差し替える。版のスタンプはステップではなくパイプラインが行う。
 *
 * @param document 差し替える元の JSON のデータモデル
 * @param version 名乗らせる版
 * @returns formatVersion だけが入れ替わった JSON のデータモデル
 */
function withFormatVersion(
  document: JsonRecord,
  version: FormatVersion,
): JsonRecord {
  return { ...document, formatVersion: FormatVersion.format(version) };
}

/**
 * 読み込んだ値をオブジェクトとして読む。配列と `null` は含めない。
 *
 * @param value 読み込んだ値
 * @returns オブジェクトとして読めれば `some`、配列・`null`・それ以外なら `none`
 */
function asRecord(value: unknown): Option<JsonRecord> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return Option.none;
  }
  return Option.some(value as JsonRecord);
}

/**
 * アプリの major に届くまで、major ひとつ分の変換を順に適用する。
 *
 * 次に適用すべきステップは引数で持ち回さず、変換後のドキュメント自身が名乗る
 * formatVersion から読み直す(版のスタンプと適用位置が食い違わないため)。
 *
 * @param document 変換元の JSON のデータモデル
 * @param appVersion アプリが扱える版（ここまで引き上げる）
 * @param steps major ひとつ分の変換の一覧
 * @returns 変換後の JSON のデータモデル。版が読めない場合とアプリの版以上の場合は
 *   そのまま返す。途中の major に対応するステップが無ければ `missing-migration-step`
 */
function migrateUpTo(
  document: JsonRecord,
  appVersion: FormatVersion,
  steps: MigrationSteps,
): Result<JsonRecord, DocumentMigrationError> {
  const fileVersion = readFormatVersion(document);
  if (!fileVersion.some || fileVersion.value.major >= appVersion.major) {
    return Result.ok(document);
  }

  const fromMajor = fileVersion.value.major;
  const step = steps[fromMajor];
  if (step === undefined) {
    return Result.err({ kind: "missing-migration-step", fromMajor });
  }

  const migrated = Result.mapErr(
    step(document),
    (reason): DocumentMigrationError => ({
      kind: "migration-step-failed",
      fromMajor,
      reason,
    }),
  );
  // 変換後は major を1つ上げた形になっている。minor を 0 にするのは、
  // マイグレーションが作るのはその major の基本形であり、
  // 新しい minor で入った機能を足すわけではないため。
  const nextVersion: FormatVersion = { major: fromMajor + 1, minor: 0 };
  return Result.flatMap(migrated, (next) =>
    migrateUpTo(withFormatVersion(next, nextVersion), appVersion, steps),
  );
}

/**
 * 読み込んだ JSON を、必要ならアプリが読める形式へ揃える(docs/01-file-format.md の表)。
 *
 * - ファイルの major < アプリ: 最新形へマイグレーションする
 * - ファイルの major > アプリ / minor > アプリ: エラー(アプリの更新を促す)
 * - それ以外: そのまま通す
 *
 * formatVersion が読めない入力も素通しする。バージョンが分からないものを既定値で
 * 補って進めるのではなく、形の検証を担うデコード側にそのまま報告させる。
 *
 * `steps` / `appVersion` は既定値を持つ（`FormatVersion.compatibility` と同じ形）。
 * 登録済みステップが空のままでも枠組み自体を確かめられるよう、変換手段と
 * 到達先の版を差し替えられるようにしてある。
 */
export const DocumentMigration = {
  toCurrent(
    value: unknown,
    steps: MigrationSteps = MIGRATION_STEPS,
    appVersion: FormatVersion = FormatVersion.CURRENT,
  ): Result<unknown, DocumentMigrationError> {
    const document = asRecord(value);
    if (!document.some) {
      return Result.ok(value);
    }
    const fileVersion = readFormatVersion(document.value);
    if (!fileVersion.some) {
      return Result.ok(value);
    }

    const compatibility = FormatVersion.compatibility(
      fileVersion.value,
      appVersion,
    );
    if (compatibility === "unsupported") {
      return Result.err({
        kind: "unsupported-format-version",
        fileVersion: fileVersion.value,
        appVersion,
      });
    }
    if (compatibility === "compatible") {
      return Result.ok(value);
    }
    return migrateUpTo(document.value, appVersion, steps);
  },
} as const;
