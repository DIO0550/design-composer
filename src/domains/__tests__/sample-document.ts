import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { OpenedDocument } from "@/domains/session/opened-document";
import { DocumentJson } from "@/libs/document-json";

/*
 * カテゴリの中ではなくカテゴリと並べて置くのは、消費側が `session` のテストと
 * feature のテストにまたがるため（`rules/architecture.md`「domains のカテゴリ」）。
 */

/** artboard を 1 枚だけ持つドキュメント。名前の違いがドキュメントの違いになる。 */
export function artboardDocument(name: string): DesignDocument {
  return DesignDocument.create({
    artboards: [Artboard.create({ name, width: 360, height: 240 })],
  });
}

/**
 * ファイルに載っている状態の `artboardDocument`。
 *
 * `src/domains/` の側で `libs/` に触れるのは、フィクスチャとテストが「ファイルに載っている
 * 綴り」を要るときだけ（`opened-document` のテストも同じ理由で触れている）。
 * production からの libs 依存は 0 件のまま。
 *
 * @param name 収める artboard の名前
 * @returns そのドキュメントを保存したときのファイルの中身
 */
export function artboardContent(name: string): string {
  return DocumentJson.serialize(artboardDocument(name));
}

/**
 * どのトークン一式にも入っていない typography トークンの名前。
 *
 * 不正の作り方を**部品**ではなく**トークン**の dangling に揃えるための綴り。部品の
 * dangling は `DocumentHtml.compile` が失敗してキャンバスが 1 枚も描けなくなるので、
 * 「開けて、見えて、直せる」を確かめる側からは外れる（トークン参照は `var()` に落ちるだけ）。
 */
export const MissingTypography = "居ないタイポグラフィ";

/**
 * 存在しないトークンを指しているドキュメント。パースは通り、スキーマ検証だけが落ちる。
 *
 * @param name 収める artboard の名前
 * @returns 中の Text が `MissingTypography` を指しているドキュメント
 */
export function danglingTokenDocument(name: string): DesignDocument {
  return DesignDocument.create({
    // 雛形のトークンを入れるのは、スキーマが既定値で指すトークン（Text の `color`）まで
    // dangling になり、確かめたい 1 件が埋もれるため。
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      Artboard.create({
        name,
        width: 360,
        height: 240,
        children: [
          {
            name: `${name}-title`,
            type: "Text",
            props: { content: "ホーム", typography: MissingTypography },
          },
        ],
      }),
    ],
  });
}

/**
 * ファイルに載っている状態の `danglingTokenDocument`（`artboardContent` と同じ理由で
 * `libs/` に触れる）。
 *
 * 自動保存が書き出す綴りと、開き直すときに読む綴りを同じものにするため、往復を
 * 確かめる側はこれを使う（別々に組むと、書いた綴りが読み直せることを誰も見ない）。
 *
 * @param name 収める artboard の名前
 * @returns そのドキュメントを保存したときのファイルの中身
 */
export function danglingTokenContent(name: string): string {
  return DocumentJson.serialize(danglingTokenDocument(name));
}

/**
 * 保存先だけが違う、開いているドキュメント。
 * パスの分解（`OpenedDocument.fileName` / `folderName`）と上部バーの表示は
 * どちらも中身に依らないので、同じものを両方から使う。
 *
 * @param path 保存先のパス
 * @returns そのパスに置かれている、中身が固定のドキュメント
 */
export function openedAt(path: string): OpenedDocument {
  return { path, document: artboardDocument("home") };
}
