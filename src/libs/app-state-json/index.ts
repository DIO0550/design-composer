import { Result } from "@/utils/Result";

/**
 * アプリ自身の状態として `app-state.json` に書かれている中身
 * （`docs/05-architecture.md`「アプリ自身の状態」）。
 */
export type AppState = Readonly<{
  /** 最近開いたファイルのパス（新しい順）。 */
  recentPaths: readonly string[];
}>;

/** アプリ自身の状態として読み取れなかったことと、診断用の原文。 */
export type AppStateJsonError = Readonly<{ message: string }>;

/**
 * テキストを JSON の値として読む。
 *
 * @param text 読み込んだテキスト
 * @returns 読み込んだ値。`JSON.parse` が投げたらその文言を持つ失敗
 */
function parseJson(text: string): Result<unknown, AppStateJsonError> {
  try {
    const value: unknown = JSON.parse(text);
    return Result.ok(value);
  } catch (error) {
    return Result.err({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * 値がオブジェクトか（配列と `null` は含めない）。
 *
 * @param value 判定する値
 * @returns フィールドを引けるオブジェクトなら true
 */
function isJsonObject(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 値が文字列だけの並びか。
 *
 * @param value 判定する値
 * @returns すべての要素が文字列の配列なら true
 */
function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => typeof item === "string")
  );
}

/**
 * JSON の値をアプリ自身の状態として読む。
 *
 * @param value `JSON.parse` が返した値
 * @returns 読み取れた状態。オブジェクトでない / `recentPaths` が文字列の並びでない
 *   ときは、その理由を持つ失敗
 */
function toAppState(value: unknown): Result<AppState, AppStateJsonError> {
  if (!isJsonObject(value)) {
    return Result.err({ message: `オブジェクトではない: ${String(value)}` });
  }
  const { recentPaths } = value;
  if (!isStringArray(recentPaths)) {
    return Result.err({
      message: `recentPaths が文字列の並びではない: ${JSON.stringify(recentPaths)}`,
    });
  }
  return Result.ok({ recentPaths });
}

/** アプリ自身の状態と、保存するテキストの相互変換。 */
export const AppStateJson = {
  /**
   * 保存されていたテキストをアプリ自身の状態として読む。
   *
   * @param text 保存されていたテキスト
   * @returns 読み取れた状態。JSON として読めない / 形が合わないときは、その理由を持つ失敗
   */
  parse(text: string): Result<AppState, AppStateJsonError> {
    return Result.flatMap(parseJson(text), toAppState);
  },

  /**
   * アプリ自身の状態を、保存するテキストにする。
   *
   * @param state 書き出す状態
   * @returns `app-state.json` に書くテキスト
   */
  serialize(state: AppState): string {
    return JSON.stringify({ recentPaths: state.recentPaths });
  },
} as const;
