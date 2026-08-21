import type { ReactNode } from "react";
import { TypeGlyph } from "@/components/type-glyph";
import { NodeTemplate } from "@/domains/node-template";
import type { PrimitiveType } from "@/domains/primitive-schema";
import type { AssetGrab } from "@/features/assets/types/AssetGrab";

/**
 * 掴んでいないときに行へ付く強調。
 *
 * 掴んでいることは行が自分で判断できる（掴んでいる指定と自分の指定を突き合わせるだけ）
 * ので、ここで受けるのは掴んでいないときに出す強調だけにしてある。
 */
export type AssetRowAccent = "source-of-selection" | "none";

/**
 * 強調ごとの背景と左端の帯（UI 案 docs/Design Composer.html）。
 *
 * 掴んでいる青（`3a · ASSETS`）と、選択中のインスタンスの出どころを示す紫
 * （`3a · ASSETS · INSTANCE`）は別物で、UI 案も別の画面で描き分けている。
 * UI 案はプリミティブを掴んでいる画面を持たないが、同じパレットの行が種別ごとに
 * 違う掴まれ方をする理由が無いので、`Primitives` にも同じ青を使う。
 */
const AccentClasses = {
  grabbed: "bg-[#e5f4ff] shadow-[inset_2px_0_0_#0d99ff]",
  "source-of-selection": "bg-purple-50 shadow-[inset_2px_0_0_#9747ff]",
  none: "",
} as const;

/**
 * パレット（`Assets`）の 1 行。型アイコンと名前を出し、掴んでキャンバスへ落とす起点になる。
 *
 * 押しても何も挿さらない。UI 案は `Assets` を browse-only とし、挿入をドラッグだけの
 * 入口にしている（#203）。
 *
 * `Primitives` と `Components` の両方がこの形を使う。掴んでいるかの判定・掴んでいる行の
 * 見え方・文字を選択させない理由が 2 つの一覧で同じで、片方だけ直ると食い違うため。
 * 違うのは右端に何を出すかだけなので、そこを `children` で受ける。
 *
 * 掴んでいる間は掴んでいることを優先して出す。出どころは選択が変わらない限り残るので、
 * 掴んでいる最中に両方出すとどちらの意味の色か読めなくなる。
 *
 * @returns 型アイコン・名前・右端の余りを並べた 1 行
 */
export function AssetRow({
  kind,
  name,
  template,
  grab,
  accent,
  children,
}: Readonly<{
  kind: PrimitiveType | "component";
  /** 行が指しているものの見え方。名前だけの行も、名前の下に補足が付く行もある。 */
  name: ReactNode;
  /** この行を掴んだときに運ぶもの。掴まれているのが自分かの判定にも使う。 */
  template: NodeTemplate;
  grab: AssetGrab;
  accent: AssetRowAccent;
  /** 右端に出すもの（使用数・掴めることの知らせなど）。 */
  children: ReactNode;
}>) {
  const isGrabbed =
    grab.dragged.some && NodeTemplate.isSame(grab.dragged.value, template);

  return (
    <li
      /*
       * 文字を選択させないのは、掴んで運ぶドラッグが範囲選択に化けるため
       * （キャンバスの artboard の枠と同じ理由）。掴んだまま画面を横断するので、
       * 選択の帯は左ペインだけでなく通り道の全体に残る。
       */
      className={`flex select-none items-center gap-1.5 rounded px-2 py-1 hover:bg-gray-100 ${
        AccentClasses[isGrabbed ? "grabbed" : accent]
      }`}
      onPointerDown={(event) => grab.onGrab(template, event)}
    >
      <TypeGlyph kind={kind} />
      {/* 名前が余りを占める。flex の子は既定で内容幅より縮まないため省略には min-w-0 が要る */}
      <span className="min-w-0 flex-1">{name}</span>
      {children}
    </li>
  );
}
