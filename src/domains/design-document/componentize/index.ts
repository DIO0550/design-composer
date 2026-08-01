import type { Component } from "@/domains/component";
import { Node, type RefNode } from "@/domains/node";
import { Result } from "@/utils/Result";
import { type DesignDocumentEditError, findNode, replaceNode } from "../edit";
import { usedNames } from "../naming";
import type { DesignDocumentV1 as DesignDocument } from "../v1";

/**
 * ノードを部品の中身に変換する。
 * ref ノード（既に他の部品を指しているノード）は部品の実体を持たないため変換できない。
 */
function toComponent(node: Node): Result<Component, DesignDocumentEditError> {
  if (!Node.isPrimitive(node)) {
    return Result.err({ kind: "ref-node-not-supported", name: node.name });
  }
  return Result.ok({
    type: node.type,
    ...(node.props !== undefined ? { props: node.props } : {}),
    ...(node.children !== undefined ? { children: node.children } : {}),
  });
}

/**
 * ノードを部品として切り出し、元の位置をその部品への参照に置き換える。
 * 部品名はドキュメントの単一名前空間に加わるため、既存の名前と衝突したら失敗させる。
 */
export function createComponent(
  document: DesignDocument,
  name: string,
  componentName: string,
): Result<DesignDocument, DesignDocumentEditError> {
  const found = findNode(document, name);
  if (!found.some) {
    return Result.err({ kind: "node-not-found", name });
  }
  if (usedNames(document).has(componentName)) {
    return Result.err({ kind: "duplicate-name", name: componentName });
  }
  return Result.flatMap(toComponent(found.value), (component) => {
    const refNode: RefNode = { name, ref: componentName };
    return Result.map(replaceNode(document, name, refNode), (replaced) => ({
      ...replaced,
      components: { ...replaced.components, [componentName]: component },
    }));
  });
}
