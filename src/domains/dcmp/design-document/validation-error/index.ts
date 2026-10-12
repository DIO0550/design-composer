import type { PublicPropBinding } from "@/domains/dcmp/component";
import type {
  BindingViolation,
  PublicPropRef,
} from "@/domains/dcmp/component-binding";
import type {
  NamePosition,
  NameViolation,
} from "@/domains/dcmp/document-names";
import type { RefNode } from "@/domains/dcmp/node";
import type { PropValidationError } from "@/domains/dcmp/primitive-schema";
import type { InstanceViolation } from "@/domains/dcmp/reference-context";
import { Size } from "@/domains/dcmp/size";
import type { TokenColorPosition, TokenRef } from "@/domains/dcmp/token";
import type { Axis } from "@/domains/unit/axis";
import { Json } from "@/utils/Json";
import type { DesignDocumentV1 as DesignDocument } from "../v1";

/** ノード（名前を持つ部品・artboard と子ノード）を指す不正の理由。 */
type NodeValidationErrorKind =
  | PropValidationError["kind"]
  | "unknown-type"
  | "dangling-ref"
  | "circular-ref"
  | "undeclared-override"
  | "invalid-public-prop-name"
  | "dangling-binding-node"
  | "dangling-binding-prop"
  | "missing-name"
  | "invalid-identifier"
  | "duplicate-name"
  | "fill-in-free-parent"
  | "inverted-size-limits";

/** トークンを指す不正の理由。 */
type TokenValidationErrorKind =
  | "invalid-identifier"
  | "conflicting-token-name"
  | "invalid-color";

/** ドキュメントが不正になる理由（docs/03-schema.md「バリデーション仕様」）。 */
export type DesignDocumentValidationErrorKind =
  | NodeValidationErrorKind
  | TokenValidationErrorKind;

/** ノードを指す不正 1 件。どのノードのどの prop かと、診断用のメッセージを持つ。 */
type NodeValidationError = Readonly<{
  kind: NodeValidationErrorKind;
  nodeName: string;
  prop?: string;
  message: string;
}>;

/**
 * トークンを指す不正 1 件。どのトークンの（あれば）トークンの中のどこかと、診断用のメッセージを
 * 持つ。
 */
type TokenValidationError = Readonly<{
  kind: TokenValidationErrorKind;
  tokenName: string;
  prop?: string;
  message: string;
}>;

/** トークンでのエラーの発生位置。`prop` はトークンの中の位置（影の `color` 等）。 */
type TokenErrorLocation = Readonly<{ tokenName: string; prop?: string }>;

/**
 * 名前の無いルート（部品定義・artboard）を指す不正 1 件。どのルートかをドキュメント内のパスで
 * 持ち、診断用のメッセージを持つ。
 */
type UnnamedRootValidationError = Readonly<{
  kind: "missing-name";
  documentPath: string;
  message: string;
}>;

/** 部品定義を収めるトップレベルフィールド。型で版のフィールド名に結び、綴りを二重に持たない。 */
const ComponentsField = "components" satisfies keyof DesignDocument;

/** artboard を収めるトップレベルフィールド。 */
const ArtboardsField = "artboards" satisfies keyof DesignDocument;

/**
 * 不正 1 件。ノードを指すもの・トークンを指すもの・名前の無いルートを指すものがある。
 *
 * トークン名やルートを収めるフィールドの名前（`components` / `artboards`）をノード名の位置に
 * 入れない。ノードとは別の名前空間なので、入れると同名のノードを指しているのと区別できなくなる。
 */
export type DesignDocumentValidationError =
  | NodeValidationError
  | TokenValidationError
  | UnnamedRootValidationError;

/**
 * 名前が欠落した位置を、報告用のエラーにする。
 *
 * @param position 名前が欠落した位置
 * @returns 部品のキー・artboard の欠落はそのルートをドキュメント内のパス（`components` /
 *   `artboards[<添字>]`）で指す missing-name、子ノードの欠落は名前を持つ最も近い祖先のノードを
 *   指す missing-name
 *
 * キーが空の部品は、デコード失敗の綴り（`components.`）ではなく `components` で指す。末尾の
 * `.` は綴りが欠けて見えるため。
 */
function toMissingNameError(
  position: NamePosition,
): NodeValidationError | UnnamedRootValidationError {
  switch (position.kind) {
    case "component-key":
      return {
        kind: "missing-name",
        documentPath: ComponentsField,
        message: `key "" of "${ComponentsField}" has no name`,
      };
    case "artboard":
      return {
        kind: "missing-name",
        documentPath: Json.elementPath(ArtboardsField, position.index),
        message: `artboard ${position.index} of "${ArtboardsField}" has no name`,
      };
    case "child":
      return {
        kind: "missing-name",
        nodeName: position.ownerName,
        message: `child ${position.index} of "${position.ownerName}" has no name`,
      };
  }
}

/**
 * 不正な色の場所を、エラーの位置とメッセージの主語にする。
 *
 * @param position `TokenSet.collectInvalidColorPositions` が返した場所
 * @returns 位置にはトークン名を入れる。影は `color`、グラデーションは `stops[<添字>].color`
 *   を prop に持ち、colors トークンは prop を持たない
 */
function toColorErrorLocation(
  position: TokenColorPosition,
): Readonly<{ location: TokenErrorLocation; subject: string }> {
  switch (position.kind) {
    case "colors":
      return {
        location: { tokenName: position.name },
        subject: `color token "${position.name}"`,
      };
    case "shadows":
      return {
        location: { tokenName: position.name, prop: "color" },
        subject: `the color of shadow token "${position.name}"`,
      };
    case "gradients":
      return {
        location: {
          tokenName: position.name,
          prop: `${Json.elementPath("stops", position.stopIndex)}.color`,
        },
        subject: `the stop ${position.stopIndex} color of gradient token "${position.name}"`,
      };
  }
}

export const DesignDocumentValidationError = {
  /**
   * prop の検証エラー 1 件を、ノードを位置にしたエラーにする。
   *
   * @param error スキーマ・公開 prop の宣言に照らして見つかった prop の検証エラー
   * @param nodeName エラーの位置にするノード名
   * @returns 検証エラーの種類・prop・メッセージをそのまま持ち、`nodeName` を位置にしたエラー
   */
  fromPropError(
    error: PropValidationError,
    nodeName: string,
  ): DesignDocumentValidationError {
    return {
      kind: error.kind,
      nodeName,
      prop: error.prop,
      message: error.message,
    };
  },

  /**
   * 型が未知のノードを、エラーにする。
   *
   * @param params `nodeName` はそのノードの名前、`type` はノードが名乗っている型名
   * @returns そのノードを指す unknown-type。prop は持たない
   */
  fromUnknownType(
    params: Readonly<{ nodeName: string; type: string }>,
  ): DesignDocumentValidationError {
    return {
      kind: "unknown-type",
      nodeName: params.nodeName,
      message: `unknown type "${params.type}"`,
    };
  },

  /**
   * 最小が最大を超えている軸を、エラーにする。
   *
   * @param axis 逆転している軸
   * @param nodeName 逆転を持つノードの名前
   * @returns その軸の `max*` を prop に持つ inverted-size-limits
   */
  fromInvertedLimitAxis(
    axis: Axis,
    nodeName: string,
  ): DesignDocumentValidationError {
    const { min, max } = Size.limitProps(axis);
    return {
      kind: "inverted-size-limits",
      nodeName,
      prop: max,
      message: `prop "${max}" is less than "${min}"; the minimum wins`,
    };
  },

  /**
   * 子を並べない親の下で `fill` になっている軸を、エラーにする。
   *
   * @param axis `fill` になっている軸
   * @param nodeName `fill` を持つノードの名前
   * @returns その軸のモード（`widthMode` / `heightMode`）を prop に持つ fill-in-free-parent
   */
  fromFillAxisInFreeParent(
    axis: Axis,
    nodeName: string,
  ): DesignDocumentValidationError {
    const modeProp = Size.modeProp(axis);
    return {
      kind: "fill-in-free-parent",
      nodeName,
      prop: modeProp,
      message: `prop "${modeProp}" cannot be "fill" inside a parent that does not arrange its children`,
    };
  },

  /**
   * インスタンスの違反 1 件を、そのインスタンスを位置にしたエラーにする。
   *
   * @param violation `ReferenceContext.collectInstanceViolations` が返した違反
   * @param refNode 違反を持つインスタンス
   * @returns 参照先が無ければ prop を持たない dangling-ref、未宣言の上書きならその prop の
   *   undeclared-override、値が宣言に適合しなければその prop の検証エラー
   */
  fromInstanceViolation(
    violation: InstanceViolation,
    refNode: RefNode,
  ): DesignDocumentValidationError {
    switch (violation.kind) {
      case "missing-component":
        return {
          kind: "dangling-ref",
          nodeName: refNode.name,
          message: `unknown component "${refNode.ref}"`,
        };
      case "undeclared-override":
        return {
          kind: "undeclared-override",
          nodeName: refNode.name,
          prop: violation.prop,
          message: `component "${refNode.ref}" does not declare public prop "${violation.prop}"`,
        };
      case "invalid-override":
        return DesignDocumentValidationError.fromPropError(
          violation.error,
          refNode.name,
        );
    }
  },

  /**
   * binding の違反 1 件を、その公開 prop を位置にしたエラーにする。
   *
   * @param violation `ComponentBinding.violation` が返した違反
   * @param publicProp binding を宣言している部品名と公開 prop 名
   * @param binding 違反を持つ公開 prop の binding
   * @returns 指し先のノードが無ければ dangling-binding-node、指し先の prop が無ければ
   *   dangling-binding-prop。どちらも部品名を位置、公開 prop 名を prop に持つ
   */
  fromBindingViolation(
    violation: BindingViolation,
    publicProp: PublicPropRef,
    binding: PublicPropBinding,
  ): DesignDocumentValidationError {
    const location = { nodeName: publicProp.component, prop: publicProp.prop };
    switch (violation.kind) {
      case "missing-node":
        return {
          kind: "dangling-binding-node",
          ...location,
          message: `unknown node "${binding.node}"`,
        };
      case "missing-public-prop":
        return {
          kind: "dangling-binding-prop",
          ...location,
          message: `"${binding.prop}" is not a public prop of component "${violation.ref}"`,
        };
      case "missing-prop":
        return {
          kind: "dangling-binding-prop",
          ...location,
          message: `node "${binding.node}" has no prop "${binding.prop}"`,
        };
    }
  },

  /**
   * 宣言名の規則を満たさない公開 prop を、エラーにする。
   *
   * @param publicProp 規則を満たさない公開 prop と、それを宣言している部品名
   * @returns 部品名を位置、公開 prop 名を prop に持つ invalid-public-prop-name
   */
  fromInvalidPublicPropName(
    publicProp: PublicPropRef,
  ): DesignDocumentValidationError {
    return {
      kind: "invalid-public-prop-name",
      nodeName: publicProp.component,
      prop: publicProp.prop,
      message: `public prop name "${publicProp.prop}" is not a valid public prop name`,
    };
  },

  /**
   * 参照の輪に含まれる部品を、エラーにする。
   *
   * @param name 輪に含まれる部品の名前
   * @returns その部品を指す circular-ref。prop は持たない
   */
  fromCircularName(name: string): DesignDocumentValidationError {
    return {
      kind: "circular-ref",
      nodeName: name,
      message: `component "${name}" is part of a circular reference`,
    };
  },

  /**
   * 単一の名前空間の中で重複している名前（docs/02-data-model.md「名前の一意性」）を、
   * エラーにする。
   *
   * @param name 重複している名前
   * @returns その名前を位置にした duplicate-name。prop は持たない
   */
  fromDuplicatedName(name: string): DesignDocumentValidationError {
    return {
      kind: "duplicate-name",
      nodeName: name,
      message: `name "${name}" is not unique in the document`,
    };
  },

  /**
   * 名前空間に属する名前の違反 1 件を、エラーにする。
   *
   * @param violation `DocumentNames.collectNameViolations` が返した違反
   * @returns 欠落なら `toMissingNameError` の missing-name、識別子違反ならその名前を位置にした
   *   invalid-identifier
   */
  fromNameViolation(violation: NameViolation): DesignDocumentValidationError {
    switch (violation.kind) {
      case "missing":
        return toMissingNameError(violation.position);
      case "invalid-identifier":
        return {
          kind: "invalid-identifier",
          nodeName: violation.name,
          message: `name "${violation.name}" is not a valid identifier`,
        };
    }
  },

  /**
   * 名前がトークン名の規則（docs/04-tokens.md「命名規則」）を満たさないトークンを、エラーに
   * する。
   *
   * @param ref 規則を満たさないトークンの種別と名前
   * @returns そのトークン名を位置にした invalid-identifier
   */
  fromInvalidNameRef(ref: TokenRef): DesignDocumentValidationError {
    return {
      kind: "invalid-identifier",
      tokenName: ref.name,
      message: `token name "${ref.name}" in ${ref.kind} is not a valid identifier`,
    };
  },

  /**
   * 塗り用の 2 種別（colors と gradients）の両方にある名前（docs/04-tokens.md「命名規則」）を、
   * エラーにする。
   *
   * @param name 両方にあるトークン名
   * @returns その名前を位置にした conflicting-token-name
   */
  fromPaintNameConflict(name: string): DesignDocumentValidationError {
    return {
      kind: "conflicting-token-name",
      tokenName: name,
      message: `token name "${name}" is used in both colors and gradients`,
    };
  },

  /**
   * 色が正規形の hex でない場所（docs/04-tokens.md「colors」）を、エラーにする。
   *
   * @param position `TokenSet.collectInvalidColorPositions` が返した場所
   * @returns トークン名を位置にした invalid-color。prop の有無は `toColorErrorLocation` のとおり
   */
  fromInvalidColorPosition(
    position: TokenColorPosition,
  ): DesignDocumentValidationError {
    const { location, subject } = toColorErrorLocation(position);
    return {
      kind: "invalid-color",
      ...location,
      message: `${subject} is not a hex color in normal form (#rrggbb / #rrggbbaa)`,
    };
  },
} as const;
