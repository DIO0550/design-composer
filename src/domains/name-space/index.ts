import type { Artboard } from "@/domains/artboard";
import { ComponentSet } from "@/domains/component";
import { Node } from "@/domains/node";

/**
 * ドキュメント全体で一意でなければならない名前の集まり（単一名前空間）。
 *
 * 属するのは components のキー・artboard 名・全ノードの `name`（部品内部を含む）。
 * トークン名は種別の中で一意なだけなので、この名前空間には含めない。
 * 重複の検出には出現の重なりが要るため、集合ではなく出現順の並びで持つ。
 */
export type NameSpace = Readonly<{ names: readonly string[] }>;

/**
 * 名前として使える識別子の規則: kebab-case（使用可能文字は `[a-z0-9-]`）。
 * 先頭・末尾のハイフンと連続ハイフンは許さない。
 * 将来のパス修飾のために予約された `/` `#` `.` はこのパターンで弾かれる。
 */
const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 使用済みの名前と衝突しない名前を作る。衝突するなら連番を付ける。 */
function nextAvailableName(
  baseName: string,
  taken: ReadonlySet<string>,
): string {
  if (!taken.has(baseName)) {
    return baseName;
  }
  let suffix = 2;
  while (taken.has(`${baseName}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseName}-${suffix}`;
}

export const NameSpace = {
  create(names: readonly string[]): NameSpace {
    return { names };
  },

  /**
   * ドキュメントの構成要素から名前空間を組み立てる。
   * 何が名前空間に属するかはこの名前空間自身の性質なので、集める規則もここが持つ。
   */
  of(components: ComponentSet, artboards: readonly Artboard[]): NameSpace {
    const componentNames = ComponentSet.names(components).flatMap(
      (name): readonly string[] => {
        const component = ComponentSet.get(components, name);
        return [
          name,
          ...(component?.children ?? []).flatMap(Node.collectNames),
        ];
      },
    );
    const artboardNames = artboards.flatMap((artboard): readonly string[] => [
      artboard.name,
      ...artboard.children.flatMap(Node.collectNames),
    ]);
    return NameSpace.create([...componentNames, ...artboardNames]);
  },

  /** 名前の集合。同じ名前が複数回現れても1つに畳まれる。 */
  toSet(space: NameSpace): ReadonlySet<string> {
    return new Set(space.names);
  },

  /** その名前が既に使われているか。 */
  has(space: NameSpace, name: string): boolean {
    return space.names.includes(name);
  },

  /** 2回以上現れる名前を、最初に現れた順で1つずつ返す。 */
  duplicatedNames(space: NameSpace): readonly string[] {
    const { names } = space;
    return names.filter(
      (name, index) =>
        names.indexOf(name) === index && names.lastIndexOf(name) !== index,
    );
  },

  /** その名前が識別子の規則（kebab-case）を満たすか。 */
  isValidIdentifier(name: string): boolean {
    return IDENTIFIER_PATTERN.test(name);
  },

  /** この名前空間と衝突しない名前。衝突する場合は連番を付ける。 */
  uniqueName(space: NameSpace, baseName: string): string {
    return nextAvailableName(baseName, NameSpace.toSet(space));
  },

  /**
   * 渡した名前をこの名前空間と衝突しない名前へ対応づける。
   * 生成した名前どうしも衝突しないよう、割り当て済みを足しながら決める。
   */
  renameMap(
    space: NameSpace,
    names: readonly string[],
  ): Readonly<Record<string, string>> {
    const taken = new Set(NameSpace.toSet(space));
    const renameMap: Record<string, string> = {};
    for (const name of names) {
      const newName = nextAvailableName(name, taken);
      renameMap[name] = newName;
      taken.add(newName);
    }
    return renameMap;
  },
} as const;
