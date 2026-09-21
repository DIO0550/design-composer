import { type ReactElement, useCallback, useState } from "react";
import { TypeGlyph } from "@/components/type-glyph";
import type { SelectionKind } from "@/domains/session/selection";
import { KeyNames } from "@/utils/KeyName";

/** 編集を終えるキー（docs/06-ui.md「名前の変更」）。 */
const CommitKey = KeyNames.Enter;
const CancelKey = KeyNames.Escape;

/** 入力欄の読み上げ名。どの行から開いても同じ操作なので 1 つに固定する。 */
const FieldLabel = "名前を編集";

/**
 * ツリーと artboard 一覧の行で、名前をその場で打ち替える入力欄
 * （docs/06-ui.md「名前の変更」）。型アイコンと余白は行のボタンと揃える。
 *
 * 下書きはここだけで持ち、終えるときにだけ外へ渡す（理由は `token-editor` の `DraftField`
 * と同じ）。
 *
 * `TextInlineEditor`（キャンバス）・`DraftField`（トークン）と 3 つに分かれているのは、前者
 * が下書きを全体の状態に持って実測した矩形へ重ねる作りで、後者が取り消しを持たないため。
 *
 * @returns 行の名前の位置に収まる、型アイコン付きの入力欄
 */
export function RowNameField({
  name,
  glyph,
  onCommit,
  onFinish,
  onCancel,
}: Readonly<{
  name: string;
  /** 名前の左に出す型アイコン。行が種別を出さないなら不在 */
  glyph: SelectionKind | undefined;
  /** Enter で確定する。使えない名前なら入力欄は開いたまま（打ち直せる） */
  onCommit: (newName: string) => void;
  /** フォーカスを失って終える。使えない名前なら取り消して閉じる */
  onFinish: (newName: string) => void;
  onCancel: () => void;
}>): ReactElement {
  const [draft, setDraft] = useState(name);

  /*
   * 開いた先で打てないと「その場で編集する」操作にならないので、繋がった時点で選ぶ。
   * `autoFocus` を使わないのは lint 抑制が要るため。識別子を安定させないと打鍵のたびに
   * 呼ばれ、選び直しでキャレットが飛ぶ。
   */
  const focusOnMount = useCallback((element: HTMLInputElement | null) => {
    element?.focus();
    element?.select();
  }, []);

  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      {glyph === undefined ? null : <TypeGlyph kind={glyph} />}
      <input
        ref={focusOnMount}
        type="text"
        aria-label={FieldLabel}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        /*
         * 行の器は掴んで並べ替えるための `onPointerDown` を持ったままなので、
         * ここで止めないと入力欄を押しただけで行を運び始める（範囲選択もできない）。
         */
        onPointerDown={(event) => event.stopPropagation()}
        onBlur={() => onFinish(draft)}
        onKeyDown={(event) => {
          if (event.key === CommitKey) {
            // 打ち替えていないなら編集をやめただけ（渡すと自分の名前と重複して弾かれる）
            if (draft === name) {
              onCancel();
              return;
            }
            onCommit(draft);
          }
          if (event.key === CancelKey) {
            onCancel();
          }
        }}
        /*
         * 行の高さを変えないよう、枠は外側に足さず outline で描いて余白を名前のボタンと
         * 揃える（UI 案 docs/Design Composer.html は編集中の行を描いていない）。
         */
        className="min-w-0 flex-1 rounded-sm bg-white px-1 py-0 text-sm outline outline-blue-500"
      />
    </span>
  );
}
