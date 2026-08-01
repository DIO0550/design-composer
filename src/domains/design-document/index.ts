import type { Artboard } from "@/domains/artboard";
import type { ComponentSet } from "@/domains/component";
import {
  FormatVersion,
  type FormatVersionCompatibility,
  type FormatVersionOf,
} from "@/domains/format-version";
import { TokenSet } from "@/domains/token";
import type { JsonCursor, JsonDecoded, JsonObject } from "@/utils/Json";
import { createComponent } from "./componentize";
import {
  findNode,
  insertArtboard,
  insertNode,
  moveNode,
  removeArtboard,
  removeNode,
  reorderArtboard,
  reorderNode,
  replaceNode,
} from "./edit";
import {
  isValidIdentifier,
  renameSubtree,
  uniqueName,
  usedNames,
} from "./naming";
import { DesignDocumentV1 } from "./v1";
import { collectErrors } from "./validation";

export type { ChildPosition } from "./edit";
export { DesignDocumentEditError } from "./edit";
export type { DesignDocumentV1 } from "./v1";
export type {
  DesignDocumentValidationError,
  DesignDocumentValidationErrorKind,
} from "./validation";

/**
 * アプリが読み書きするドキュメント。今は major 1 のみ。
 *
 * 版ごとの型と JSON 表現は版のフォルダ（`v1/`）が持つ。
 * major を上げるときは隣に `v2/` を作ってここを差し替え、旧版のフォルダは残す。
 * 旧版の型が残ることで、マイグレーション（`libs/document-migration`）が
 * 「どの形から どの形へ」を型で書ける。
 * アプリ本体が旧版の形を扱うことはないので、ここを版の直和にはしない
 * （消費側に版の分岐を強いないため）。
 */
export type DesignDocument = DesignDocumentV1;

/**
 * ドキュメントのコンパニオンオブジェクト。
 * ツリー編集は `edit/`、名前の規則は `naming/`、検証は `validation/`、
 * 部品化は `componentize/`、版ごとの JSON 表現は `v1/` にあり、
 * ここは公開APIとしての組み立てに徹する。
 */
export const DesignDocument = {
  create(params: {
    formatVersion?: FormatVersionOf<1>;
    tokens?: TokenSet;
    components?: ComponentSet;
    artboards?: readonly Artboard[];
  }): DesignDocument {
    return {
      formatVersion: params.formatVersion ?? FormatVersion.CURRENT,
      tokens: params.tokens ?? TokenSet.empty(),
      components: params.components ?? {},
      artboards: params.artboards ?? [],
    };
  },

  compatibility(document: DesignDocument): FormatVersionCompatibility {
    return FormatVersion.compatibility(document.formatVersion);
  },

  /**
   * 現在の形式を名乗るドキュメントにする。
   * 書き出しは常に現在の形式で行う（旧形式へのダウングレード書き出しは持たない・
   * マイグレーションは一方向）ため、書き出す値はこれを通したものになる。
   */
  withCurrentFormatVersion(document: DesignDocument): DesignDocument {
    return { ...document, formatVersion: FormatVersion.CURRENT };
  },

  /**
   * JSON のデータモデルからドキュメントを組み立てる。
   * どのフィールドをどう読むかは版ごとの知識なので、現在の版のモジュールが持つ。
   */
  fromJson(cursor: JsonCursor): JsonDecoded<DesignDocument> {
    return DesignDocumentV1.fromJson(cursor);
  },

  /** ドキュメントを JSON のデータモデルへ落とす。表現は現在の版のモジュールが持つ。 */
  toJson(document: DesignDocument): JsonObject {
    return DesignDocumentV1.toJson(document);
  },

  insertNode,
  removeNode,
  findNode,
  replaceNode,
  reorderNode,
  moveNode,
  createComponent,
  insertArtboard,
  removeArtboard,
  reorderArtboard,
  usedNames,
  isValidIdentifier,
  uniqueName,
  renameSubtree,
  collectErrors,
} as const;
