import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
  type JsonRecordCursor,
} from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

export type PropValue = string | number | boolean;
export type Props = Readonly<Record<string, PropValue>>;

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

export const Props = {
  fromJson(cursor: JsonCursor): JsonDecoded<Props> {
    return Json.mapOf(cursor, PropValue.fromJson);
  },

  /** prop 名の昇順で書き出す(編集した順に依存させない)。 */
  toJson(props: Props): JsonObject {
    return Json.sortedMap(props, (value) => value);
  },
} as const;

export type PrimitiveNode = Readonly<{
  name: string;
  type: string;
  props?: Props;
  children?: readonly Node[];
}>;

export type RefNode = Readonly<{
  name: string;
  ref: string;
  overrides?: Props;
}>;

export type Node = PrimitiveNode | RefNode;

/** ノードが JSON 上で持ちうるフィールド(docs/01-file-format.md)。 */
const PRIMITIVE_NODE_FIELDS = ["name", "type", "props", "children"] as const;
const REF_NODE_FIELDS = ["name", "ref", "overrides"] as const;

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
