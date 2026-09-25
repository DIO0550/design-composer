import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
  type JsonRecordCursor,
} from "@/utils/Json";
import { Option } from "@/utils/Option";
import { RecordEx } from "@/utils/RecordEx";
import { Result } from "@/utils/Result";

/** prop が取りうる値。構造を持つ値は prop にしない（docs/01-file-format.md）。 */
export type PropValue = string | number | boolean;
/** 1 つのノードに設定された props。未設定の prop はキーごと持たない。 */
export type Props = Readonly<Record<string, PropValue>>;

/**
 * props の1件分の設定。prop 名と値は片方だけでは意味を持たない
 * （値が妥当かは prop 名で決まり、報告にも prop 名が要る）ため1つの型にまとめる。
 */
export type PropAssignment = Readonly<{
  name: string;
  value: PropValue;
}>;

/**
 * props への編集1件。値を消す編集(`none`)も同じ操作なので、
 * 設定と消去で別の型に分けない(どちらも「その prop を今どうするか」を表す)。
 *
 * 編集を分けて 2 回適用すると履歴も 2 段になり、1 回の undo で片側しか戻らない。
 *
 * 空の並びは「何も書かないのに履歴だけ積む」編集になるので、非空のタプルで受ける。
 */
export type PropEdit = Readonly<{
  names: readonly [string, ...string[]];
  value: Option<PropValue>;
}>;

export const PropEdit = {
  /**
   * 指した prop すべてに同じ値を設定する編集。
   *
   * @param names 設定する prop の名前
   * @param value それらの prop に設定する値
   * @returns `names` のすべてへ `value` を書く編集
   */
  set(names: readonly [string, ...string[]], value: PropValue): PropEdit {
    return { names, value: Option.some(value) };
  },

  /**
   * 指した prop すべてを未設定へ戻す編集。
   * 「未設定」は値が無いことではなくデフォルトが効く状態なので、
   * 空文字や 0 を入れて表さない(`Props.apply` がキーごと落とす)。
   *
   * @param names 未設定へ戻す prop の名前
   * @returns `names` のすべてを未設定へ戻す編集
   */
  clear(names: readonly [string, ...string[]]): PropEdit {
    return { names, value: Option.none };
  },
} as const;

/** prop の値の JSON 表現との相互変換。 */
export const PropValue = {
  /**
   * カーソルの位置の値を prop の値として読む。prop の値になれるのはスカラーだけ(構造を持つ値
   * は prop にしない)。
   *
   * @param cursor 読む値と、その位置
   * @returns 文字列・数値・真偽値ならその値。`null`・配列・オブジェクトなら `cursor` の位置を
   *   持つ `invalid-type` の `err`
   */
  fromJson(cursor: JsonCursor): JsonDecoded<PropValue> {
    const value = cursor.value;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return Result.ok(value);
    }
    const actual = value === null ? "null" : typeof value;
    return Json.error(
      "invalid-type",
      cursor.path,
      `expected string, number or boolean but got ${Array.isArray(value) ? "array" : actual}`,
    );
  },
} as const;

/** props の JSON 表現との相互変換と、1 件分の編集の適用。 */
export const Props = {
  /**
   * prop 名をキーとする辞書を props として読む。prop 名がスキーマにあるかは見ない。
   *
   * @param cursor 読む値と、その位置
   * @returns すべての値を読めたら props。失敗の条件は `Json.mapOf` と同じで、値の失敗は
   *   `PropValue.fromJson` の `err`
   */
  fromJson(cursor: JsonCursor): JsonDecoded<Props> {
    return Json.mapOf(cursor, PropValue.fromJson);
  },

  /**
   * prop 名の昇順で書き出す(編集した順に依存させない)。
   *
   * @param props 書き出す props
   * @returns `Json.sortedMap` の並びで、値をそのまま持つオブジェクト
   */
  toJson(props: Props): JsonObject {
    return Json.sortedMap(props, (value) => value);
  },

  /**
   * 1件ずつ扱う消費側のために、設定されている prop を並びへ展開する。
   *
   * @param props 展開する props
   * @returns 設定されている prop ごとの名前と値。並びは `Object.entries` の列挙順
   */
  toAssignments(props: Props): readonly PropAssignment[] {
    return Object.entries(props).map(([name, value]) => ({ name, value }));
  },

  /**
   * 編集を適用した props。値の消去は「未設定に戻す」ことなのでキーごと落とす(デフォルト解
   * 決は未設定かどうかを見るため、`undefined` を値として残せない)。
   *
   * 指した prop はすべて同じ値になる。
   *
   * @param props 編集する前の props
   * @param edit 適用する編集。指す prop 名がスキーマにあるかは見ない
   * @returns 値を設定する編集なら `edit.names` のすべてをその値にした props、消去する編集なら
   *   `edit.names` のキーを落とした props。指されていない prop はそのまま
   */
  apply(props: Props, edit: PropEdit): Props {
    if (Option.isSome(edit.value)) {
      const value = edit.value.value;
      const written = edit.names.map((name) => [name, value] as const);
      return { ...props, ...Object.fromEntries(written) };
    }
    return Object.fromEntries(
      Object.entries(props).filter(([name]) => !edit.names.includes(name)),
    );
  },
} as const;

/** プリミティブ（Box / Text）のノード。型と props を持ち、子を持てる。 */
export type PrimitiveNode = Readonly<{
  name: string;
  type: string;
  props?: Props;
  children?: readonly Node[];
}>;

/** 部品のインスタンス。参照先の名前と、公開 prop への上書きを持つ。 */
export type RefNode = Readonly<{
  name: string;
  ref: string;
  overrides?: Props;
}>;

/** ツリーに並ぶノード。プリミティブか部品インスタンスのどちらか。 */
export type Node = PrimitiveNode | RefNode;

/** ノードが JSON 上で持ちうるフィールド(docs/01-file-format.md)。 */
const PrimitiveNodeFields = ["name", "type", "props", "children"] as const;
const RefNodeFields = ["name", "ref", "overrides"] as const;

/** ノードの判定・子の取り出し・JSON 表現との相互変換。 */
export const Node = {
  /**
   * 部品を参照するインスタンスのノードか。
   *
   * @param node 見るノード
   * @returns 部品の参照ノードなら `true`
   */
  isRef(node: Node): node is RefNode {
    return "ref" in node;
  },

  /**
   * 型と props を持つプリミティブのノードか。
   *
   * @param node 見るノード
   * @returns プリミティブのノードなら `true`
   */
  isPrimitive(node: Node): node is PrimitiveNode {
    return "type" in node;
  },

  /**
   * ノード直下の子。
   *
   * @param node 子を取り出すノード
   * @returns プリミティブなら直下の子の並び。子を持たないプリミティブと参照ノードは空
   *   (参照ノードの中身は部品の側にあり、このノードの子ではない)
   */
  children(node: Node): readonly Node[] {
    return Node.isPrimitive(node) ? (node.children ?? []) : [];
  },

  /**
   * 自分と子孫の名前を集める。
   *
   * @param node 走査の起点になるノード
   * @returns 自分の名前を先頭に、子孫の名前を深さ優先の行きがけ順で並べたもの。同じ名前は
   *   現れた回数だけ入る
   */
  collectNames(node: Node): readonly string[] {
    return [node.name, ...Node.children(node).flatMap(Node.collectNames)];
  },

  /**
   * 自分か子孫のどれかの名前が条件に合うか（docs/06-ui.md「絞り込み」）。
   *
   * 条件を述語で受け取るのは、絞り込みの語彙が編集中の状態の側（`session`）にあり、
   * ここからは import できないため（rules/architecture.md「依存方向のルール」）。
   *
   * @param node 走査の起点になるノード
   * @param matches 名前を判定する条件
   * @returns 自分か子孫に 1 つでも合う名前があれば true
   */
  hasMatchingName(node: Node, matches: (name: string) => boolean): boolean {
    return Node.collectNames(node).some(matches);
  },

  /**
   * 自分と子孫の参照ノードが指している部品の名前を集める。
   *
   * @param node 走査の起点になるノード
   * @returns 参照先の部品の名前を深さ優先の行きがけ順で並べたもの。同じ部品を指す参照ノード
   *   が複数あれば、その回数だけ入る。参照ノードが無ければ空
   */
  collectRefs(node: Node): readonly string[] {
    if (Node.isRef(node)) {
      return [node.ref];
    }
    return Node.children(node).flatMap(Node.collectRefs);
  },

  /**
   * その部品を指しているインスタンス自身の名前を、自分と子孫から集める。
   *
   * @param node 走査の起点になるノード
   * @param componentName 参照先として探す部品の名前
   * @returns その部品を指す参照ノードの名前。1 つも無ければ空
   */
  collectInstanceNames(node: Node, componentName: string): readonly string[] {
    if (Node.isRef(node)) {
      return node.ref === componentName ? [node.name] : [];
    }
    return Node.children(node).flatMap((child) =>
      Node.collectInstanceNames(child, componentName),
    );
  },

  /**
   * 名前でノードを探す。自分から始めて、子孫を深さ優先の行きがけ順で辿る。
   *
   * @param node 走査の起点になるノード
   * @param name 探すノードの名前
   * @returns その名前を持つノード。名前が重複した不正なドキュメントでは行きがけ順で先に見つ
   *   かったもの。自分にも子孫にも無ければ `none`
   */
  find(node: Node, name: string): Option<Node> {
    if (node.name === name) {
      return Option.some(node);
    }
    for (const child of Node.children(node)) {
      const found = Node.find(child, name);
      if (Option.isSome(found)) {
        return found;
      }
    }
    return Option.none;
  },

  /**
   * ノードの prop を書き換える。参照ノードが持つのは自分の props ではなく
   * 部品への上書き(`overrides`)なので、同じ編集でも書き込み先が変わる。
   *
   * @param node 書き換えるノード
   * @param edit 適用する編集
   * @returns 参照ノードなら `overrides`、プリミティブなら `props` に `Props.apply` で編集を
   *   適用したノード
   */
  applyPropEdit(node: Node, edit: PropEdit): Node {
    if (Node.isRef(node)) {
      return { ...node, overrides: Props.apply(node.overrides ?? {}, edit) };
    }
    return { ...node, props: Props.apply(node.props ?? {}, edit) };
  },

  /**
   * 自分と子孫の名前を対応表に従って付け替える。参照ノードが指す部品の名前(`ref`)は書き
   * 換えない。
   *
   * @param node 走査の起点になるノード
   * @param renameMap 今の名前から新しい名前への対応。載っていない名前はそのまま
   * @returns 名前を付け替えたノード。`children` を持たず名前も変わらないノードは渡したもの
   *   そのもの
   */
  rename(node: Node, renameMap: Readonly<Record<string, string>>): Node {
    const newName = Option.unwrapOr(
      RecordEx.get(renameMap, node.name),
      node.name,
    );
    if (Node.isRef(node) || node.children === undefined) {
      return newName === node.name ? node : { ...node, name: newName };
    }
    return {
      ...node,
      name: newName,
      children: node.children.map((child) => Node.rename(child, renameMap)),
    };
  },

  /**
   * `ref` を持てば参照ノード、`type` を持てばプリミティブノード(docs/01-file-format.md)。
   *
   * @param cursor 読む値と、その位置
   * @returns 読めたノード。オブジェクトでなければ `invalid-type`、`ref` と `type` のどちらも
   *   無ければ `cursor` の位置の `missing-field`。どちらかがあれば、必須フィールドの欠落は
   *   `missing-field`、型違いは `invalid-type`、そのノードの形に無いフィールドは
   *   `unknown-field` を 1 件で打ち切らずすべて集めた `err`(両方あれば参照ノードとして読み、
   *   `type` が `unknown-field` になる)
   */
  fromJson(cursor: JsonCursor): JsonDecoded<Node> {
    return Result.flatMap(Json.record(cursor), (record) => {
      const keys = Object.keys(record.record);
      if (keys.includes("ref")) {
        return refNodeFromJson(record);
      }
      if (keys.includes("type")) {
        return primitiveNodeFromJson(record);
      }
      return Json.error(
        "missing-field",
        cursor.path,
        'node must have either "type" or "ref"',
      );
    });
  },

  /**
   * ノードの配列を読む。
   *
   * @param cursor 読む値と、その位置
   * @returns すべての要素を読めたらノードの並び。失敗の条件は `Json.arrayOf` と同じで、要素の
   *   失敗は `Node.fromJson` の `err`
   */
  fromJsonArray(cursor: JsonCursor): JsonDecoded<readonly Node[]> {
    return Json.arrayOf(cursor, Node.fromJson);
  },

  /**
   * 設定されていない props / children は書き出さない。
   *
   * @param node 書き出すノード(子孫も含めて書き出す)
   * @returns ノードの JSON 表現。`props` / `overrides` / `children` は未設定か空なら現れない。
   *   `props` / `overrides` のキーは `Props.toJson` のとおり昇順
   */
  toJson(node: Node): JsonObject {
    if (Node.isRef(node)) {
      return {
        name: node.name,
        ref: node.ref,
        ...Json.nonEmptyField(
          "overrides",
          node.overrides === undefined
            ? undefined
            : Props.toJson(node.overrides),
        ),
      };
    }
    return {
      name: node.name,
      type: node.type,
      ...Json.nonEmptyField(
        "props",
        node.props === undefined ? undefined : Props.toJson(node.props),
      ),
      ...Json.nonEmptyField("children", node.children?.map(Node.toJson)),
    };
  },
} as const;

/**
 * プリミティブのノードとして読む。未知のフィールドはエラーにする。
 *
 * @param record 読み出し元のオブジェクトを指しているカーソル
 * @returns 読めたノード。必須フィールドの欠落・型違い・未知のフィールドは
 *   位置つきのエラーの並び
 */
function primitiveNodeFromJson(record: JsonRecordCursor): JsonDecoded<Node> {
  return Json.knownFields(
    Json.combine4(
      Json.required(record, "name", Json.string),
      Json.required(record, "type", Json.string),
      Json.optional(record, "props", Props.fromJson),
      Json.optional(record, "children", Node.fromJsonArray),
      (name, type, props, children) => ({
        name,
        type,
        ...(props !== undefined ? { props } : {}),
        ...(children !== undefined ? { children } : {}),
      }),
    ),
    record,
    PrimitiveNodeFields,
  );
}

/**
 * 部品インスタンスとして読む。未知のフィールドはエラーにする。
 *
 * @param record 読み出し元のオブジェクトを指しているカーソル
 * @returns 読めたノード。必須フィールドの欠落・型違い・未知のフィールドは
 *   位置つきのエラーの並び
 */
function refNodeFromJson(record: JsonRecordCursor): JsonDecoded<Node> {
  return Json.knownFields(
    Json.combine3(
      Json.required(record, "name", Json.string),
      Json.required(record, "ref", Json.string),
      Json.optional(record, "overrides", Props.fromJson),
      (name, ref, overrides) => ({
        name,
        ref,
        ...(overrides !== undefined ? { overrides } : {}),
      }),
    ),
    record,
    RefNodeFields,
  );
}
