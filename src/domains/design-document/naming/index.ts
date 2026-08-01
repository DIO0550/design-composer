import { ComponentSet } from "@/domains/component";
import { Node } from "@/domains/node";
import type { DesignDocumentV1 as DesignDocument } from "../v1";

/*
 * このフォルダは「名前がどうあるべきか」（識別子の規則と、衝突しない名前の作り方）を持つ。
 * 規則に反する名前をエラーとして報告するのは検証の関心なので `validation/` にある。
 */

/**
 * 識別子の規則: kebab-case（使用可能文字は `[a-z0-9-]`）。
 * 先頭・末尾のハイフンと連続ハイフンは許さない。
 * 将来のパス修飾のために予約された `/` `#` `.` はこのパターンで弾かれる。
 */
const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * ドキュメント全体の単一名前空間に属する名前を集める。
 * 対象は components のキー・artboard 名・全ノードの `name`（部品内部を含む）。
 * トークン名は種別内で一意なだけなので、この名前空間には含めない。
 */
export function collectAllNames(document: DesignDocument): readonly string[] {
  const componentNames = ComponentSet.names(document.components).flatMap(
    (name): readonly string[] => {
      const component = ComponentSet.get(document.components, name);
      return [name, ...(component?.children ?? []).flatMap(Node.collectNames)];
    },
  );
  const artboardNames = document.artboards.flatMap(
    (artboard): readonly string[] => [
      artboard.name,
      ...artboard.children.flatMap(Node.collectNames),
    ],
  );
  return [...componentNames, ...artboardNames];
}

function nextAvailableName(
  baseName: string,
  usedNames: ReadonlySet<string>,
): string {
  if (!usedNames.has(baseName)) {
    return baseName;
  }
  let suffix = 2;
  while (usedNames.has(`${baseName}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseName}-${suffix}`;
}

function generateRenameMap(
  names: readonly string[],
  usedNames: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  const taken = new Set(usedNames);
  const renameMap: Record<string, string> = {};
  for (const name of names) {
    const newName = nextAvailableName(name, taken);
    renameMap[name] = newName;
    taken.add(newName);
  }
  return renameMap;
}

/** ドキュメントの単一名前空間で使われている名前。 */
export function usedNames(document: DesignDocument): ReadonlySet<string> {
  return new Set(collectAllNames(document));
}

/** その名前が識別子の規則（kebab-case）を満たすか。 */
export function isValidIdentifier(name: string): boolean {
  return IDENTIFIER_PATTERN.test(name);
}

/** 使用済みの名前と衝突しない名前。衝突する場合は連番を付ける。 */
export function uniqueName(
  baseName: string,
  usedNames: ReadonlySet<string>,
): string {
  return nextAvailableName(baseName, usedNames);
}

/** 部分木のノード名を、使用済みの名前と衝突しないよう付け替える。 */
export function renameSubtree(
  nodes: readonly Node[],
  usedNames: ReadonlySet<string>,
): { nodes: readonly Node[]; renameMap: Readonly<Record<string, string>> } {
  const renameMap = generateRenameMap(
    nodes.flatMap(Node.collectNames),
    usedNames,
  );
  return {
    nodes: nodes.map((node) => Node.rename(node, renameMap)),
    renameMap,
  };
}
