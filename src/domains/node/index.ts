import { Json, type JsonDecoded, type JsonObject } from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

export type PropValue = string | number | boolean;
export type Props = Readonly<Record<string, PropValue>>;

export const PropValue = {
  /** prop の値になれるのはスカラーだけ(構造を持つ値は prop にしない)。 */
  fromJson(value: unknown, path: string): JsonDecoded<PropValue> {
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
      path,
      `expected string, number or boolean but got ${Array.isArray(value) ? "array" : actual}`,
    );
  },
} as const;

export const Props = {
  fromJson(value: unknown, path: string): JsonDecoded<Props> {
    return Json.mapOf(value, path, PropValue.fromJson);
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
  fromJson(value: unknown, path: string): JsonDecoded<Node> {
    return Result.flatMap(Json.record(value, path), (record) => {
      if (Object.keys(record).includes("ref")) {
        return refNodeFromJson(record, path);
      }
      if (Object.keys(record).includes("type")) {
        return primitiveNodeFromJson(record, path);
      }
      return Json.error(
        "missing-field",
        path,
        'node must have either "type" or "ref"',
      );
    });
  },

  fromJsonArray(value: unknown, path: string): JsonDecoded<readonly Node[]> {
    return Json.arrayOf(value, path, Node.fromJson);
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

function primitiveNodeFromJson(
  record: Readonly<Record<string, unknown>>,
  path: string,
): JsonDecoded<Node> {
  return Json.knownFields(
    Json.combine4(
      Json.required(record, path, "name", Json.string),
      Json.required(record, path, "type", Json.string),
      Json.optional(record, path, "props", Props.fromJson),
      Json.optional(record, path, "children", Node.fromJsonArray),
      (name, type, props, children) => ({
        name,
        type,
        ...(props !== undefined ? { props } : {}),
        ...(children !== undefined ? { children } : {}),
      }),
    ),
    record,
    path,
    PRIMITIVE_NODE_FIELDS,
  );
}

function refNodeFromJson(
  record: Readonly<Record<string, unknown>>,
  path: string,
): JsonDecoded<Node> {
  return Json.knownFields(
    Json.combine3(
      Json.required(record, path, "name", Json.string),
      Json.required(record, path, "ref", Json.string),
      Json.optional(record, path, "overrides", Props.fromJson),
      (name, ref, overrides) => ({
        name,
        ref,
        ...(overrides !== undefined ? { overrides } : {}),
      }),
    ),
    record,
    path,
    REF_NODE_FIELDS,
  );
}
