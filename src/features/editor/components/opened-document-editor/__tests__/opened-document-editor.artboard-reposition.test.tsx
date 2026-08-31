import { expect, test } from "vitest";
import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import {
  artboardFrameContainer,
  artboardHandle,
  drag,
} from "@/features/canvas/__tests__";
import { canvasPane, renderOpenedDocument } from "./setup";

/*
 * 見出しを掴んで運んだ結果がドキュメントへ届き、描き直されるまでを編集画面の配線ごと
 * 確かめる（#390）。
 *
 * ここでしか通らないのは、`onRepositionArtboard` → `reposition_artboard` →
 * 再コンパイルまでを通して `li` の `left` / `top` が動くところを見るため。
 * キャンバス単体（`artboard-canvas.artboard-drag.test.tsx`）は届く値までは固定するが、
 * それがドキュメントへ届いて描き直されるところは見ない。**配線が切れていても
 * 単体テストは全部緑になる。**
 */

/**
 * 幅 200 の artboard が 3 枚並ぶドキュメント
 * （3 枚置く理由は `artboard-canvas.artboard-drag.test.tsx` の `setupSelection`）。
 *
 * @returns 3 枚の artboard を持つドキュメント
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      Artboard.create({ name: "first", width: 200, height: 140 }),
      Artboard.create({ name: "second", width: 200, height: 140 }),
      Artboard.create({ name: "third", width: 200, height: 140 }),
    ],
  });
}

/**
 * artboard が描かれている位置。
 *
 * @param name 引く artboard の名前
 * @returns その artboard の器のインラインの `left` / `top`
 */
function drawnAt(name: string): Readonly<{ left: string; top: string }> {
  const { style } = artboardFrameContainer(canvasPane(), name);
  return { left: style.left, top: style.top };
}

/** `second` の見出しを掴んで運び、離すまで。 */
function dragSecondLabel(): void {
  drag(artboardHandle("second"), {
    from: { x: 0, y: 0 },
    to: { x: 60, y: 40 },
  });
}

test("artboard の見出しをキャンバスで運ぶと、描かれる位置が縦横ともその分だけ動く", async () => {
  await renderOpenedDocument(setupDocument());

  dragSecondLabel();

  // 既定の位置 x=232（200 + 32）から 60 / 40 動いた先
  expect(drawnAt("second")).toEqual({ left: "292px", top: "40px" });
});

test("1 枚を運んでも他の artboard が描かれる位置は変わらない", async () => {
  /*
   * 既定の位置を「座標を持たないものだけを詰めて並べる」形にすると、1 枚に座標が
   * 付いた瞬間に後続が原点へ飛ぶ。配列順と幅だけで決めているのでそうならない。
   */
  await renderOpenedDocument(setupDocument());

  dragSecondLabel();

  expect(drawnAt("third")).toEqual({ left: "464px", top: "0px" });
});
