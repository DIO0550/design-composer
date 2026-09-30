import type { Artboard } from "@/domains/dcmp/artboard";
import { ComponentSet } from "@/domains/dcmp/component";
import { Node } from "@/domains/dcmp/node";
import { ArrayEx } from "@/utils/ArrayEx";
import { CaseStyle } from "@/utils/CaseStyle";
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
 * 名前空間に属する名前が、ドキュメントのどこに書かれているか。名前が欠落していると名前自身では
 * 位置を示せないため、入れ物の中での位置で表す。
 *
 * - `component-key`: components のキー
 * - `artboard`: artboards の `index` 番目
 * - `child`: `ownerName` の配下の、兄弟の中で `index` 番目のノード。`ownerName` は名前が空で
 *   ない最も近い祖先のノード名で、そうした祖先が無ければ部品名・artboard 名（空でもそのまま）
 *
 * `child` を `ChildPosition`（直接の親と添字）で表さない。欠落した親は名前で指せないので、
 * 入れ物は直接の親ではなく名前を持つ最も近い祖先になる。
 */
export type NamePosition =
  | Readonly<{ kind: "component-key" }>
  | Readonly<{ kind: "artboard"; index: number }>
  | Readonly<{ kind: "child"; ownerName: string; index: number }>;

/**
 * 名前空間に属する名前のバリデーション違反（docs/03-schema.md「バリデーション仕様」の
 * 「識別子規則違反」と「`name` 欠落」）。
 *
 * - `missing`: 名前が欠落している。どこで欠落したかを `position` に持つ
 * - `invalid-identifier`: 名前が識別子の規則を満たさない。その名前を `name` に持つ
 */
export type NameViolation =
  | Readonly<{ kind: "missing"; position: NamePosition }>
  | Readonly<{ kind: "invalid-identifier"; name: string }>;

/** 名前空間に属する名前 1 つの出現。 */
type NameOccurrence = Readonly<{ name: string; position: NamePosition }>;

/**
 * ノードの並びとその子孫の名前の出現を、行きがけ順に並べる。
 *
 * @param nodes 並べるノードの兄弟の並び
 * @param ownerName 兄弟を収めている入れ物の名前
 * @returns 各ノードの名前の出現と、その子孫の出現を行きがけ順に並べたもの
 */
function collectNodeOccurrences(
  nodes: readonly Node[],
  ownerName: string,
): readonly NameOccurrence[] {
  return nodes.flatMap((node, index): readonly NameOccurrence[] => [
    { name: node.name, position: { kind: "child", ownerName, index } },
    ...collectNodeOccurrences(Node.children(node), node.name || ownerName),
  ]);
}

/**
 * ドキュメントの構成要素から、名前空間に属する名前の出現を集める。
 *
 * @param components ドキュメントの部品定義
 * @param artboards ドキュメントの artboard
 * @returns 部品ごとに部品名とその内部のノード、続いて artboard ごとに artboard 名と配下の
 *   ノードの名前の出現を、入れ物の中では行きがけ順に並べたもの
 */
function collectOccurrences(
  components: ComponentSet,
  artboards: readonly Artboard[],
): readonly NameOccurrence[] {
  const componentOccurrences = ComponentSet.toNamedComponents(
    components,
  ).flatMap(({ name, component }): readonly NameOccurrence[] => [
    { name, position: { kind: "component-key" } },
    ...collectNodeOccurrences(component.children ?? [], name),
  ]);
  const artboardOccurrences = artboards.flatMap(
    (artboard, index): readonly NameOccurrence[] => [
      { name: artboard.name, position: { kind: "artboard", index } },
      ...collectNodeOccurrences(artboard.children, artboard.name),
    ],
  );
  return [...componentOccurrences, ...artboardOccurrences];
}

/** 自動リネームが連番とみなす名前の末尾（`-` と数字）と、それを除いた基底名。 */
const SequencedNamePattern = /^(.+)-([0-9]+)$/;

/**
 * 自動リネームが付ける連番の最小値。
 *
 * 連番は `bigint` で数える。`number` では 2^53 を超えた番号が `+ 1` で進まず空きを探すループが
 * 止まらなくなり、10^21 以上は `1e+21` と綴られて識別子の規則を破る。
 */
const FirstSequenceNumber = 2n;

/** 連番を付ける基底名と、空きを探し始める番号。 */
type SequenceStart = Readonly<{ baseName: string; from: bigint }>;

/**
 * `<基底名>-<番号>` の形で、使用済みの名前と衝突しない最初の名前を探す。
 *
 * @param start 連番を付ける基底名と、探し始める番号
 * @param taken 既に使われている名前
 * @returns `start.from` から順に番号を増やして最初に空いていた `<基底名>-<番号>`
 */
function firstAvailableSequencedName(
  start: SequenceStart,
  taken: ReadonlySet<string>,
): string {
  let sequenceNumber = start.from;
  while (taken.has(`${start.baseName}-${sequenceNumber}`)) {
    sequenceNumber += 1n;
  }
  return `${start.baseName}-${sequenceNumber}`;
}

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
  return firstAvailableSequencedName(
    { baseName, from: FirstSequenceNumber },
    taken,
  );
}

/**
 * 既にある名前の複製に、使用済みの名前と衝突しない名前を付ける。規則は `renameSubtree` の
 * `@returns` のとおり。
 *
 * 剥がした基底名そのものは返さない。`12-3` から数字だけの `12` を作ると識別子の規則を破り、
 * `title-2` の複製が元の `title` と取り違えられる。
 *
 * @param name 複製元の名前
 * @param taken 既に使われている名前
 * @returns 衝突しなければ `name` そのまま、衝突すれば連番を付け直した名前
 */
function nextAvailableCopyName(
  name: string,
  taken: ReadonlySet<string>,
): string {
  const sequenced = SequencedNamePattern.exec(name);
  if (sequenced === null) {
    return nextAvailableName(name, taken);
  }
  if (!taken.has(name)) {
    return name;
  }
  const [, baseName, sequenceNumber] = sequenced;
  const next = BigInt(sequenceNumber) + 1n;
  const from = next < FirstSequenceNumber ? FirstSequenceNumber : next;
  return firstAvailableSequencedName({ baseName, from }, taken);
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
    return collectOccurrences(components, artboards).map(
      (occurrence) => occurrence.name,
    );
  },

  /**
   * 名前空間に属する名前のうち、欠落しているものと識別子の規則を満たさないものを集める。
   * 欠落した名前は識別子の規則違反としては数えない。
   *
   * @param components ドキュメントの部品定義
   * @param artboards ドキュメントの artboard
   * @returns 違反を `collectNames` と同じ並びで並べたもの。違反が無ければ空
   */
  collectNameViolations(
    components: ComponentSet,
    artboards: readonly Artboard[],
  ): readonly NameViolation[] {
    return collectOccurrences(components, artboards).flatMap(
      ({ name, position }): readonly NameViolation[] => {
        if (!name) {
          return [{ kind: "missing", position }];
        }
        if (!DocumentNames.isValidIdentifier(name)) {
          return [{ kind: "invalid-identifier", name }];
        }
        return [];
      },
    );
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
    return DocumentNames.newlyDuplicatedNames({
      before: DocumentNames.create([]),
      after: documentNames,
    });
  },

  /**
   * 編集の前後を比べて、新しく重複した名前を返す。既にある重複は、出現が増えない限り
   * 返さない（docs/03-schema.md「不正ファイル時の挙動」では重複したドキュメントでも編集を
   * 続けられる）。
   *
   * @param names 編集前（`before`）と編集後（`after`）の名前空間
   * @returns `after` で 2 回以上現れ、`before` より出現が増えた名前を、`after` で最初に
   *   現れた順に 1 つずつ。無ければ空
   */
  newlyDuplicatedNames({
    before,
    after,
  }: Readonly<{
    before: DocumentNames;
    after: DocumentNames;
  }>): readonly string[] {
    const beforeCounts = ArrayEx.countOccurrences(before.names);
    const afterCounts = ArrayEx.countOccurrences(after.names);
    return [...afterCounts].flatMap(([name, count]) => {
      const isNewlyDuplicated =
        count >= 2 && count > (beforeCounts.get(name) ?? 0);
      return isNewlyDuplicated ? [name] : [];
    });
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
   * `baseName` の末尾の `-<数字>` は、`renameSubtree` と違って連番とみなさない。基底名には部品名
   * がそのまま来るので、剥がすと部品 `icon-24` のインスタンスが `icon-25` のような別の部品の名前
   * に見える名前になる。
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
   * @returns 自分と子孫の名前を行きがけ順に 1 つずつ付け替えたノードの並び。衝突する名前は、
   *   末尾の `-<数字>` を連番とみなしてその番号 + 1（2 未満なら 2）から空きを探し
   *   （`title-2` → `title-3`）、連番の無い名前には `uniqueName` と同じく `-2` から付ける
   *   （docs/01-file-format.md「ノードの識別（name）」）。先に付け替えた名前とも衝突しないので、
   *   部分木に同じ名前が複数あっても別々の名前になる。衝突しない名前はそのまま残る
   */
  renameSubtree(
    documentNames: DocumentNames,
    nodes: readonly Node[],
  ): readonly Node[] {
    return Node.renameEach(
      nodes,
      DocumentNames.toSet(documentNames),
      nextAvailableCopyName,
    );
  },
} as const;
