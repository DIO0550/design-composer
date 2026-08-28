import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { PropEdit } from "@/domains/dcmp/node";
import { Result } from "@/utils/Result";

/**
 * テストで開くドキュメント。
 *
 * 雛形のトークン・部品に artboard を 2 枚足したもので、ツリービュー・キャンバス・
 * プロパティパネルのどれからでも同じ中身を辿れる状態にしてある。
 */
export const SampleDocument = DesignDocument.create({
  tokens: DocumentTemplate.Default.tokens,
  components: DocumentTemplate.Default.components,
  artboards: [
    Artboard.create({
      name: "home",
      width: 360,
      height: 240,
      props: {
        direction: "column",
        gap: "md",
        paddingTop: "lg",
        paddingRight: "lg",
        paddingBottom: "lg",
        paddingLeft: "lg",
        background: "white",
      },
      children: [
        {
          name: "home-title",
          type: "Text",
          props: { content: "ホーム", typography: "heading" },
        },
        {
          name: "home-login",
          ref: "primary-button",
          overrides: { label: "ログイン" },
        },
      ],
    }),
    Artboard.create({
      name: "settings",
      width: 360,
      height: 240,
      props: {
        direction: "column",
        gap: "md",
        paddingTop: "lg",
        paddingRight: "lg",
        paddingBottom: "lg",
        paddingLeft: "lg",
        background: "gray-100",
      },
      children: [
        {
          name: "settings-card",
          ref: "card",
          overrides: { title: "設定", body: "通知とテーマを変更できます" },
        },
      ],
    }),
  ],
});

/** どのトークン一式にも入っていない typography トークンの名前。 */
const MissingTypography = "居ないタイポグラフィ";

/**
 * `home-title` が居ないトークンを指している `SampleDocument`。
 *
 * パースは通り、スキーマ検証だけが落ちる。指す先が `SampleDocument` にも在るので、
 * エラー行から該当ノードへ飛ぶ経路が成立する（#136）。
 * トークン参照は `var()` に落ちるだけなのでコンパイルは通り、キャンバスも普通に描ける。
 */
export const SampleDocumentWithDanglingToken = Result.unwrap(
  DesignDocument.applyPropEdit(
    SampleDocument,
    "home-title",
    PropEdit.set(["typography"], MissingTypography),
  ),
);

/**
 * `home-login` が居ない部品を指している `SampleDocument`。
 *
 * こちらは `DocumentHtml.compile` が失敗するため、キャンバスが 1 枚も描けない
 * （`canvas-body` がコンパイルの失敗を 1 行で出す）。開いた直後からこの状態に
 * なりうるようになったので（#158）、そこでも直せることを確かめる側が使う。
 */
export const SampleDocumentWithMissingComponent = DesignDocument.create({
  tokens: SampleDocument.tokens,
  components: SampleDocument.components,
  artboards: SampleDocument.artboards.map((artboard) => ({
    ...artboard,
    children: artboard.children.map((node) =>
      node.name === "home-login" ? { ...node, ref: "居ない部品" } : node,
    ),
  })),
});
