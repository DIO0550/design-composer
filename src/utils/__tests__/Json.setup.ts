import { Json, type JsonRecordCursor } from "@/utils/Json";
import { Result } from "@/utils/Result";

/**
 * レコードを期待する位置にレコードがある状態のカーソル。
 *
 * @param record カーソルが指すレコード
 * @param path そのレコードが在る位置。省略すると根
 * @returns そのレコードを指すカーソル。レコードとして読めなければテストを落とす
 */
export function recordCursor(
  record: Readonly<Record<string, unknown>>,
  path = "",
): JsonRecordCursor {
  return Result.unwrap(Json.record(Json.create(record, path)));
}
