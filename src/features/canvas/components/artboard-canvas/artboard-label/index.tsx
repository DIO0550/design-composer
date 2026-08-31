import type { PointerEvent as ReactPointerEvent } from "react";
import type { CompiledArtboard } from "@/domains/compiled/compiled-artboard";

/**
 * 掴み口を指す目印。掴めることは `onPointerDown` にしか出ないので、テストから
 * 引く手掛かりが他に無い（見た目の class で引くと Tailwind の綴りに縛られる）。
 * 名前を付けるのは、1 枚のキャンバスに artboard の枚数だけ並ぶため。
 */
export const ArtboardHandleTestId = "artboard-handle";

/**
 * artboard の見出し（UI 案 docs/Design Composer.html。名前の右に大きさが並ぶ）。
 *
 * 名前が青く太くなるのは「今ツリーが映している 1 枚」のとき（#184）。UI 案で色が
 * 付いているのは 10 行中 1 行だけで、その画面では artboard 自身ではなく配下のノードが
 * 選択されている。一方その画面は `Artboards` 一覧が `login` をハイライトしている
 * 唯一の画面でもあるので、青が指しているのは選択ではなく「今見ている 1 枚」と読んだ。
 * Why not: 選ばれているか（`DocumentSelection.isSelected`）では色を決めない。
 * UI 案の唯一の色付きを再現できない。
 *
 * Why not: 大きさの綴りを `artboard-list` と共通化しない。UI 案はツリー側が
 * `720×900`、キャンバス側が `720 × 900` で空白の有無が違う。
 *
 * 見出しは artboard を動かす掴み口の 1 つ（docs/06-ui.md「キャンバス直接操作」）。
 * もう 1 つは枠の背景で、掴み分けは `ArtboardFrame` の `onPointerDown` にある。
 * 見出しを残すのは、**子が全面を覆う artboard**では背景を押せないため。
 *
 * @returns 名前と大きさを並べた見出しの 1 行
 */
export function ArtboardLabel({
  artboard,
  isCurrent,
  onGrab,
}: Readonly<{
  artboard: CompiledArtboard;
  isCurrent: boolean;
  onGrab: (event: ReactPointerEvent<HTMLElement>) => void;
}>) {
  return (
    <span
      data-testid={`${ArtboardHandleTestId}:${artboard.element.name}`}
      /*
       * 掴んで動かすドラッグが文字の範囲選択にならないようにする（`select-none`）。
       * 幅は器（`ArtboardFrame`）が枠に合わせるので、ここでは絞らない。名前の右の余白でも
       * 動くが、背景でも動くようになった今はそちらのほうが一貫する。
       */
      className="flex h-[18px] cursor-grab select-none items-center gap-2 text-[11px]"
      onPointerDown={(event) => {
        // 見出しの上で始めたドラッグはパンにしない（掴んだものが動かないと操作が読めない）
        event.stopPropagation();
        onGrab(event);
      }}
    >
      {/*
        **この出し分けを潰してもテストは 1 件も落ちない。** happy-dom は Tailwind を
        解決せず、class 名を assert するのは実装詳細のテストになる。気づく手段は
        `ArtboardCanvas` の視覚差分（選択なし / artboard を選択中）だけ。
      */}
      <span
        className={isCurrent ? "font-medium text-[#0d99ff]" : "text-[#8c8c8c]"}
      >
        {artboard.element.name}
      </span>
      {/* 選択中の artboard でも大きさは太くしない（UI 案が font-weight を明示している） */}
      <span className="font-normal text-[#b3b3b3]">
        {artboard.width} × {artboard.height}
      </span>
    </span>
  );
}
