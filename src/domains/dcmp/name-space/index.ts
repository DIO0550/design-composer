import type { Artboard } from "@/domains/dcmp/artboard";
import { ComponentSet } from "@/domains/dcmp/component";
import { Node } from "@/domains/dcmp/node";
import { CaseStyle } from "@/utils/CaseStyle";

/**
 * ドキュメント全体で一意でなければならない名前の集まり（単一名前空間）。
 *
 * 属するのは components のキー・artboard 名・全ノードの `name`（部品内部を含む）。
 * トークン名は種別の中で一意なだけなので、この名前空間には含めない。
 * 重複の検出には出現の重なりが要るため、集合ではなく出現順の並びで持つ。
 */
export type NameSpace = Readonly<{ names: readonly string[] }>;

/**
 * 使用済みの名前と衝突しない名前を作る。衝突するなら連番を付ける。
 *
 * @param baseName 付けたい名前
 * @param taken 既に使われている名前
 * @returns 衝突しなければ `baseName` そのまま、衝突すれば `baseName-2` から順に空いた名前
 */
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
   * ドキュメントの構成要素から、名前空間に属する名前を集める。
   * 何が名前空間に属するかはこの名前空間自身の性質なので、集める規則もここが持つ。
   * 生成は `create` に一本化しているため、ここは名前を集めるところまでを担う。
   */
  collectNames(
    components: ComponentSet,
    artboards: readonly Artboard[],
  ): readonly string[] {
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
    return [...componentNames, ...artboardNames];
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

  /**
   * その名前が識別子の規則を満たすか。
   * 規則は kebab-case そのもので、将来のパス修飾のために予約された `/` `#` `.` は
   * この綴りで弾かれる（docs/01-file-format.md「ノードの識別（name）」）。
   * トークン名も同じ規則に従う（docs/04-tokens.md「命名規則」）ため、
   * 綴りの判定自体は `CaseStyle` に置いて両者で共有する。
   */
  isValidIdentifier(name: string): boolean {
    return CaseStyle.isKebabCase(name);
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
