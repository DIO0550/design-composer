import { Artboard } from "@/domains/dcmp/artboard";
import { ComponentSet } from "@/domains/dcmp/component";
import {
  FormatVersion,
  type FormatVersionOf,
} from "@/domains/dcmp/format-version";
import { TokenSet } from "@/domains/dcmp/token";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { Result } from "@/utils/Result";

/** この版が JSON 上で持つトップレベルフィールド(docs/01-file-format.md)。 */
const DocumentFields = [
  "formatVersion",
  "tokens",
  "components",
  "artboards",
] as const;

/** この版の major。型にもデコードの検証にもこの1箇所から与える。 */
const Major = 2;

/**
 * major 2 の仕様で書かれたドキュメント(docs/01-file-format.md)。
 *
 * `formatVersion` の major が型に固定されているので、この型の値は
 * 2 以外の major を名乗れない（中身の形と名乗る版が食い違う状態を作れない）。
 * minor は後方互換な追加なので幅を持つ（2.0 のファイルも 2.3 のファイルもこの形）。
 *
 * 版を上げるときはこのフォルダを**改名**し、旧版の型は残さない。
 * Why not: 旧版の型を隣に残さない。マイグレーション（`libs/document-migration`）が
 * 受け渡すのはデコード前の `JsonRecord` なので、旧版のドメインの型は参照されず
 * 死んだモジュールになる（`MigrationStep` の doc「旧 major のファイルは今のドメインの
 * 型では表せない…デコード前の形で扱う」）。
 */
export type DesignDocumentV2 = Readonly<{
  formatVersion: FormatVersionOf<typeof Major>;
  tokens: TokenSet;
  components: ComponentSet;
  artboards: readonly Artboard[];
}>;

export const DesignDocumentV2 = {
  /**
   * JSON のデータモデルからこの版のドキュメントを組み立てる。
   * 検証するのは形（必須フィールド・型・未知フィールド）だけで、
   * スキーマ検証は `DesignDocument.collectErrors` の担当。
   *
   * `formatVersion` はこの版の major を名乗っているかまで見る。
   * 違う major のテキストをこの型の値にしないための境界で、
   * 互換性判定とマイグレーション自体はデコードより前
   * （JSON のデータモデルの段階）で `libs/document-migration` が済ませている。
   */
  fromJson(cursor: JsonCursor): JsonDecoded<DesignDocumentV2> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine4(
          Json.required(record, "formatVersion", (version) =>
            FormatVersion.fromJsonOf(version, Major),
          ),
          Json.required(record, "tokens", TokenSet.fromJson),
          Json.required(record, "components", ComponentSet.fromJson),
          Json.required(record, "artboards", (artboards) =>
            Json.arrayOf(artboards, Artboard.fromJson),
          ),
          (formatVersion, tokens, components, artboards) => ({
            formatVersion,
            tokens,
            components,
            artboards,
          }),
        ),
        record,
        DocumentFields,
      ),
    );
  },

  /**
   * この版のドキュメントを JSON のデータモデルへ落とす。
   * 明示的に設定された値だけを書き、スキーマのデフォルト値は書かない
   * （ドキュメントはそもそも明示的な props しか保持しない）。
   */
  toJson(document: DesignDocumentV2): JsonObject {
    return {
      formatVersion: FormatVersion.format(document.formatVersion),
      tokens: TokenSet.toJson(document.tokens),
      components: ComponentSet.toJson(document.components),
      artboards: document.artboards.map(Artboard.toJson),
    };
  },
} as const;
