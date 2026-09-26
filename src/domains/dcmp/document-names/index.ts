import { Artboard } from "@/domains/dcmp/artboard";
import { ComponentSet } from "@/domains/dcmp/component";
import { Node } from "@/domains/dcmp/node";
import { CaseStyle } from "@/utils/CaseStyle";
import { Option } from "@/utils/Option";
import { StringEx } from "@/utils/StringEx";

/**
 * ドキュメント全体で一意でなければならない名前の集まり。仕様書の「単一名前空間」
 * （docs/01-file-format.md「ノードの識別（name）」）に当たり、トークン名は含まない
 * （トークン名は種別の中で一意なだけ / docs/04-tokens.md「命名規則」）。
 *
 * 属するのは components のキー・artboard 名・全ノードの `name`（部品内部を含む）。
 * 重複の検出には出現の重なりが要るため、集合ではなく出現順の並びで持つ。
 */
export type DocumentNames = Readonly<{ names: readonly string[] }>;

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

export const DocumentNames = {
  /**
   * 集めた名前を名前空間として持つ。
   *
   * @param names 名前空間に属する名前を出現順に並べたもの
   * @returns `names` を重複も畳まずにそのまま持つ名前空間（重複は `duplicatedNames` が
   *   見つける）
   */
  create(names: readonly string[]): DocumentNames {
    return { names };
  },

  /**
   * ドキュメントの構成要素から、名前空間に属する名前を集める。何が名前空間に属するかはこ
   * の名前空間自身の性質なので、集める規則もここが持つ。
   *
   * 生成は `create` に一本化しているため、ここは名前を集めるところまでを担う。
   *
   * @param components ドキュメントの部品定義
   * @param artboards ドキュメントの artboard
   * @returns 部品ごとに部品名とその内部のノードの名前、続いて artboard ごとに artboard 名と
   *   配下のノードの名前を並べたもの。同じ名前は現れた回数だけ入る
   */
  collectNames(
    components: ComponentSet,
    artboards: readonly Artboard[],
  ): readonly string[] {
    const componentNames = ComponentSet.names(components).flatMap(
      (name): readonly string[] => {
        const children = Option.flatMap(
          ComponentSet.get(components, name),
          (component) => Option.fromNullable(component.children),
        );
        return [
          name,
          ...Option.unwrapOr(children, []).flatMap(Node.collectNames),
        ];
      },
    );
    const artboardNames = artboards.flatMap(Artboard.collectNames);
    return [...componentNames, ...artboardNames];
  },

  /**
   * 名前の集合。同じ名前が複数回現れても1つに畳まれる。
   *
   * @param documentNames 畳む名前空間
   * @returns 名前空間に属する名前の集合
   */
  toSet(documentNames: DocumentNames): ReadonlySet<string> {
    return new Set(documentNames.names);
  },

  /**
   * その名前が既に使われているか。
   *
   * @param documentNames 探す先の名前空間
   * @param name 使われているかを見る名前
   * @returns 名前空間に 1 回以上現れていれば `true`
   */
  has(documentNames: DocumentNames, name: string): boolean {
    return documentNames.names.includes(name);
  },

  /**
   * 2回以上現れる名前を、最初に現れた順で1つずつ返す。
   *
   * @param documentNames 重複を探す名前空間
   * @returns 重複している名前。重複が無ければ空
   */
  duplicatedNames(documentNames: DocumentNames): readonly string[] {
    const { names } = documentNames;
    return names.filter(
      (name, index) =>
        names.indexOf(name) === index && names.lastIndexOf(name) !== index,
    );
  },

  /**
   * その名前が識別子の規則を満たすか（docs/01-file-format.md「識別子の規則」）。予約された
   * `/` `#` `.` は kebab-case の綴りで弾かれる。
   *
   * トークン名も同じ規則に従い、`TokenSet.isValidName` が同じ条件を持つ（共有しない理由は
   * そちらの doc）。
   *
   * @param name 判定する名前
   * @returns `CaseStyle.isKebabCase` が認める綴りで、数字だけの綴りではなければ `true`
   */
  isValidIdentifier(name: string): boolean {
    return CaseStyle.isKebabCase(name) && !StringEx.isAllDigits(name);
  },

  /**
   * この名前空間と衝突しない名前。衝突する場合は連番を付ける。
   *
   * @param documentNames 衝突を避ける名前空間
   * @param baseName 付けたい名前。識別子の規則を満たすかは見ない
   * @returns 衝突しなければ `baseName` そのまま、衝突すれば `baseName-2` から順に空いている
   *   名前
   */
  uniqueName(documentNames: DocumentNames, baseName: string): string {
    return nextAvailableName(baseName, DocumentNames.toSet(documentNames));
  },

  /**
   * 部分木のノード名を、この名前空間と衝突しないよう付け替える。
   *
   * @param documentNames 衝突を避ける名前空間
   * @param nodes 付け替える部分木の根の並び
   * @returns 自分と子孫の名前を行きがけ順に 1 つずつ `uniqueName` と同じ規則で付け替えた
   *   ノードの並び。先に付け替えた名前とも衝突しないので、部分木に同じ名前が複数あっても
   *   別々の名前になる。衝突しない名前はそのまま残る
   */
  renameSubtree(
    documentNames: DocumentNames,
    nodes: readonly Node[],
  ): readonly Node[] {
    return Node.renameEach(
      nodes,
      DocumentNames.toSet(documentNames),
      nextAvailableName,
    );
  },
} as const;
