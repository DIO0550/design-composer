import type { PrimitiveSchema as PrimitiveSchemaShape } from "./schema";
import { allowsChildren, forType, isPrimitiveType } from "./schema";
import { tokenKind } from "./token-props";

export type {
  EnabledWhen,
  EnumPropDefinition,
  LiteralPropDefinition,
  PropValidationError,
  PropValidationErrorKind,
  TokenPropDefinition,
} from "./prop-definition";
export { PropDefinition, PropDefinitionRecord } from "./prop-definition";
export type { PrimitiveType } from "./schema";
export {
  BOX_SCHEMA,
  PRIMITIVE_SCHEMAS,
  PRIMITIVE_TYPES,
  TEXT_SCHEMA,
} from "./schema";
export type { TokenPropKinds, TokenPropName } from "./token-props";

/*
 * 型は `schema/` の定義をそのまま公開する。
 * 同名の const をこのファイルで宣言する都合で `export ... from` が使えないため、
 * import して export し直している（別の型を新設しているわけではない）。
 */
export type PrimitiveSchema = PrimitiveSchemaShape;

/**
 * primitive の仕様に問い合わせるコンパニオンオブジェクト。
 * スキーマ本体は `schema/`、トークン参照 prop の種別の導出は `token-props/` にあり、
 * ここは公開APIとしての組み立てに徹する。
 */
export const PrimitiveSchema = {
  forType,
  isPrimitiveType,
  allowsChildren,
  tokenKind,
} as const;
