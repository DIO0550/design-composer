import { JsonText } from "@/libs/json-text";
import { Json, type JsonDecodeError } from "@/utils/Json";
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
 * 位置つきのデコードの失敗を、1 行の原文にまとめる。
 *
 * @param errors 読み取れなかった箇所
 * @returns 位置と文言を連ねた 1 行を持つ失敗
 */
function toAppStateJsonError(
  errors: readonly JsonDecodeError[],
): AppStateJsonError {
  return {
    message: errors
      .map((error) => `${error.path}: ${error.message}`)
      .join(" / "),
  };
}

/**
 * JSON の値をアプリ自身の状態として読む。
 *
 * @param value `JsonText.parse` が返した値
 * @returns 読み取れた状態。オブジェクトでない / `recentPaths` が文字列の並びでない
 *   ときは、その位置と理由を持つ失敗
 */
function toAppState(value: unknown): Result<AppState, AppStateJsonError> {
  const decoded = Result.flatMap(Json.record(Json.create(value)), (cursor) =>
    Result.map(
      Json.required(cursor, "recentPaths", (field) =>
        Json.arrayOf(field, Json.string),
      ),
      (recentPaths): AppState => ({ recentPaths }),
    ),
  );
  return Result.mapErr(decoded, toAppStateJsonError);
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
    return Result.flatMap(
      Result.mapErr(JsonText.parse(text), (message) => ({ message })),
      toAppState,
    );
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
