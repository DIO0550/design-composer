import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
  type JsonRecordCursor,
} from "@/utils/Json";
import { Option } from "@/utils/Option";
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
 */
export type PropEdit = Readonly<{
  name: string;
  value: Option<PropValue>;
}>;

export const PropEdit = {
  /** その prop に値を設定する編集。 */
  set(name: string, value: PropValue): PropEdit {
    return { name, value: Option.some(value) };
  },

  /**
   * その prop を未設定へ戻す編集。
   * 「未設定」は値が無いことではなくデフォルトが効く状態なので、
   * 空文字や 0 を入れて表さない(`Props.apply` がキーごと落とす)。
   */
  clear(name: string): PropEdit {
    return { name, value: Option.none };
  },
} as const;

/** prop の値の JSON 表現との相互変換。 */
export const PropValue = {
  /** prop の値になれるのはスカラーだけ(構造を持つ値は prop にしない)。 */
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
  fromJson(cursor: JsonCursor): JsonDecoded<Props> {
    return Json.mapOf(cursor, PropValue.fromJson);
  },

  /** prop 名の昇順で書き出す(編集した順に依存させない)。 */
  toJson(props: Props): JsonObject {
    return Json.sortedMap(props, (value) => value);
  },

  /** 1件ずつ扱う消費側のために、設定されている prop を並びへ展開する。 */
  toAssignments(props: Props): readonly PropAssignment[] {
    return Object.entries(props).map(([name, value]) => ({ name, value }));
  },

  /**
   * 編集を適用した props。値の消去は「未設定に戻す」ことなのでキーごと落とす
   * (デフォルト解決は未設定かどうかを見るため、`undefined` を値として残せない)。
   */
  apply(props: Props, edit: PropEdit): Props {
    if (edit.value.some) {
      return { ...props, [edit.name]: edit.value.value };
    }
    return Object.fromEntries(
      Object.entries(props).filter(([name]) => name !== edit.name),
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
const PRIMITIVE_NODE_FIELDS = ["name", "type", "props", "children"] as const;
const REF_NODE_FIELDS = ["name", "ref", "overrides"] as const;

/** ノードの判定・子の取り出し・JSON 表現との相互変換。 */
export const Node = {
  isRef(node: Node): node is RefNode {
    return "ref" in node;
  },

  isPrimitive(node: Node): node is PrimitiveNode {
    return "type" in node;
  },

  children(node: Node): readonly Node[] {
    return Node.isPrimitive(node) ? (node.children ?? []) : [];
  },

  collectNames(node: Node): readonly string[] {
    return [node.name, ...Node.children(node).flatMap(Node.collectNames)];
  },

  collectRefs(node: Node): readonly string[] {
    if (Node.isRef(node)) {
      return [node.ref];
    }
    return Node.children(node).flatMap(Node.collectRefs);
  },

  find(node: Node, name: string): Option<Node> {
    if (node.name === name) {
      return Option.some(node);
    }
    for (const child of Node.children(node)) {
      const found = Node.find(child, name);
      if (found.some) {
        return found;
      }
    }
    return Option.none;
  },

  /**
   * ノードの prop を書き換える。参照ノードが持つのは自分の props ではなく
   * 部品への上書き(`overrides`)なので、同じ編集でも書き込み先が変わる。
   */
  applyPropEdit(node: Node, edit: PropEdit): Node {
    if (Node.isRef(node)) {
      return { ...node, overrides: Props.apply(node.overrides ?? {}, edit) };
    }
    return { ...node, props: Props.apply(node.props ?? {}, edit) };
  },

  rename(node: Node, renameMap: Readonly<Record<string, string>>): Node {
    const newName = renameMap[node.name] ?? node.name;
    if (Node.isRef(node) || node.children === undefined) {
      return newName === node.name ? node : { ...node, name: newName };
    }
    return {
      ...node,
      name: newName,
      children: node.children.map((child) => Node.rename(child, renameMap)),
    };
  },

  /** `ref` を持てば参照ノード、`type` を持てばプリミティブノード(docs/01-file-format.md)。 */
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

  fromJsonArray(cursor: JsonCursor): JsonDecoded<readonly Node[]> {
    return Json.arrayOf(cursor, Node.fromJson);
  },

  /** 設定されていない props / children は書き出さない。 */
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

/** プリミティブのノードとして読む。未知のフィールドはエラーにする。 */
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
    PRIMITIVE_NODE_FIELDS,
  );
}

/** 部品インスタンスとして読む。未知のフィールドはエラーにする。 */
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
    REF_NODE_FIELDS,
  );
}
