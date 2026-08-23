import { ExpandedNodeError } from "@/domains/expanded-node";
import type { NodeTreeEditError } from "@/domains/node-tree";
import { TokenEditError } from "@/domains/token";

/**
 * ドキュメントの編集操作（挿入・削除・並べ替え・移動・部品化・解除・tokens 編集）が
 * 失敗する理由。
 * 呼び出し側が種類で分岐できるよう、メッセージ文字列ではなく直和で列挙する。
 *
 * `NodeTreeEditError`（ツリー1階層の編集失敗）と `TokenEditError`（トークンの
 * 編集失敗）と `ExpandedNodeError`（部品の展開失敗）をそのまま含む。いずれの失敗も
 * ドキュメントの失敗でもあるので、部分型として受け取れるよう同じ形のメンバを
 * 並べている（変換を挟まずに伝播できる）。
 */
export type DesignDocumentEditError =
  | NodeTreeEditError
  | TokenEditError
  | ExpandedNodeError
  | Readonly<{ kind: "node-not-found"; name: string }>
  | Readonly<{ kind: "parent-not-found"; name: string }>
  | Readonly<{ kind: "artboard-not-found"; name: string }>
  | Readonly<{ kind: "move-into-descendant"; name: string; parentName: string }>
  | Readonly<{ kind: "ref-node-not-supported"; name: string }>
  | Readonly<{ kind: "ref-node-required"; name: string }>
  | Readonly<{ kind: "duplicate-name"; name: string }>
  | Readonly<{ kind: "invalid-name"; name: string }>;

export const DesignDocumentEditError = {
  /**
   * 診断用の英語メッセージ。
   * 利用者向けの文言は `kind` で分岐して表示層が組み立てる。
   */
  message(error: DesignDocumentEditError): string {
    switch (error.kind) {
      case "node-not-found":
        return `node "${error.name}" not found`;
      case "parent-not-found":
        return `parent "${error.name}" not found`;
      case "artboard-not-found":
        return `artboard "${error.name}" not found`;
      case "children-not-allowed":
        return `node "${error.name}" cannot have children`;
      case "move-into-descendant":
        return `cannot move node "${error.name}" into "${error.parentName}" because it is the node itself or its descendant`;
      case "ref-node-not-supported":
        return `cannot create a component from ref node "${error.name}"`;
      case "ref-node-required":
        return `node "${error.name}" is not a ref node`;
      case "duplicate-name":
        return `name "${error.name}" is already used`;
      case "invalid-name":
        return `name "${error.name}" is not a valid identifier`;
      case "index-out-of-range":
        return `index ${error.index} is out of bounds for length ${error.length}`;
      case "invalid-token-name":
      case "duplicate-token-name":
      case "token-not-found":
        return TokenEditError.message(error);
      case "component-not-found":
      case "circular-component-reference":
        return ExpandedNodeError.message(error);
    }
  },
} as const;
