import { type ReactElement, useState } from "react";
import { Componentization } from "@/features/editor/domains/componentization";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";

/**
 * フッターの綴りは UI 案 docs/Design Composer.html の `Assets` / `Assets · Instance`
 * 画面から採る。`artboard` と `unselected` の 2 行は UI 案が描いていない状態なので、
 * インスタンスの行と同じ言い回しに揃えてここで決めた（#131）。
 */
const LABELS = {
  create: "Create component",
  fromSelection: "from selection ·",
  instance: "an instance can't be componentized",
  artboard: "an artboard can't be componentized",
  unselected: "select a node to componentize",
  nameField: "部品名",
  namePlaceholder: "component-name",
} as const;

/**
 * 打った名前では作れないときに、ボタンの `title` へ出す理由（挿入・解除のボタンと同じ扱い）。
 *
 * 規則違反と重複を書き分けないのは、`EditorState.createComponent` が
 * 「その部品化は存在しない」を `Option` で返すだけで理由を持たないため。
 * 書き分けるには失敗の種別を UI まで運ぶことになり、押せるかを部品化そのものに
 * 答えさせている形（`isCreatable`）を崩す。
 */
const UNUSABLE_NAME_REASON = "使える部品名を入れると作成できます";

/** 部品にできないときの 1 行（UI 案の淡い灰色）。 */
const UNAVAILABLE_CAPTION_CLASS = "text-center text-[#c4c4c4] text-xs";

/**
 * 部品にできない理由の 1 行。
 *
 * 戻り値を素の `string` にしているのは、状態を足して `case` を足し忘れたときに
 * 「返さない経路がある」としてコンパイルエラーにするため。
 *
 * @param componentization 部品にできないと分かっている今の状態
 * @returns その状態で部品にできない理由
 */
function unavailableReason(
  componentization: Exclude<Componentization, { kind: "ready" }>,
): string {
  switch (componentization.kind) {
    case "instance":
      return LABELS.instance;
    case "artboard":
      return LABELS.artboard;
    case "unselected":
      return LABELS.unselected;
  }
}

/**
 * ボタンの下に出す 1 行。
 *
 * @returns 部品にできるなら元にするものの名前、できないならその理由
 */
function Caption({
  componentization,
}: Readonly<{ componentization: Componentization }>): ReactElement {
  if (componentization.kind === "ready") {
    return (
      <p className="text-center text-[#b3b3b3] text-xs">
        {LABELS.fromSelection}{" "}
        <span className="font-mono text-gray-500">
          {componentization.sourceName}
        </span>
      </p>
    );
  }

  return (
    <p className={UNAVAILABLE_CAPTION_CLASS}>
      {unavailableReason(componentization)}
    </p>
  );
}

/**
 * 部品化のボタン。
 *
 * `◆` に `TypeGlyph` を使わないのは、UI 案がこのボタンだけ `#c9a6ff` を置いているため
 * （`TypeGlyph` の `component` は `#9747ff` で、`#1e1e1e` の黒地に沈む）。
 * 無効時の配色も、他のボタンの `opacity-50` ではなく UI 案がここだけ明示している値を使う。
 */
function CreateButton({
  isEnabled,
  reason,
  onClick,
}: Readonly<{ isEnabled: boolean; reason?: string; onClick?: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isEnabled}
      title={reason}
      className="flex h-8 w-full items-center justify-center gap-2 rounded-md bg-[#1e1e1e] font-medium text-white text-xs disabled:border disabled:border-[#ebebeb] disabled:bg-[#fafafa] disabled:font-normal disabled:text-[#c4c4c4]"
    >
      <span aria-hidden="true" className={isEnabled ? "text-[#c9a6ff]" : ""}>
        ◆
      </span>
      {LABELS.create}
    </button>
  );
}

/**
 * 部品にできる選択のときの中身。名前を打って作るところまでを持つ。
 *
 * 押す前と打っている最中を `Option<string>` 1 つで持つ（`none` = まだ押していない /
 * `some` = 下書き）。真偽値と文字列に分けると「打っていないのに下書きがある」が
 * 表現できてしまい、取り消しのたびに setter が 2 つ並ぶ（rules/hooks.md）。
 *
 * 作れたあとに下書きを捨てる処理を持たないのは、作れた時点で選択がインスタンスに変わり
 * この部品ごと消えるため。選択を別のものへ移したときの取り直しは、呼び出し側が
 * `key` に元の名前を混ぜて行う（rules/hooks.md「state リセット目的の Effect 禁止」）。
 */
function ReadyBody({
  state,
  onCreate,
}: Readonly<{
  state: EditorState;
  onCreate: (componentName: string) => void;
}>): ReactElement {
  const [draft, setDraft] = useState<Option<string>>(Option.none);

  if (!draft.some) {
    return <CreateButton isEnabled onClick={() => setDraft(Option.some(""))} />;
  }

  const componentName = draft.value;
  /*
   * その名前で作れるかは、部品化そのものに答えさせる。失敗の条件（識別子の規則・
   * 名前空間での重複）を書き写すと `DesignDocument.createComponent` と二重管理になり、
   * 片方だけ変わったときにボタンの出方と結果が食い違う
   * （`SelectionControls` の `isDetachEnabled` と同じ扱い）。
   */
  const isCreatable = EditorState.createComponent(state, componentName).some;

  return (
    <>
      <input
        type="text"
        aria-label={LABELS.nameField}
        placeholder={LABELS.namePlaceholder}
        value={componentName}
        onChange={(event) => setDraft(Option.some(event.target.value))}
        onKeyDown={(event) => {
          if (event.key !== "Enter") {
            return;
          }
          if (!isCreatable) {
            return;
          }
          onCreate(componentName);
        }}
        className="w-full rounded border border-gray-300 px-2 py-1 text-xs placeholder:text-gray-400"
      />
      <CreateButton
        isEnabled={isCreatable}
        reason={isCreatable ? undefined : UNUSABLE_NAME_REASON}
        onClick={() => onCreate(componentName)}
      />
    </>
  );
}

/**
 * 選択したサブツリーを部品にするフッター（UI 案 docs/Design Composer.html が
 * `Assets` パネルの下端に固定している `Create component` / docs/06-ui.md「部品化・解除」）。
 *
 * 名前を打たせるのは仕様（「操作時に部品名のみを入力させる」）による。UI 案は入力欄を
 * 描いていないので、押す前の見た目を UI 案のまま（ボタン + 1 行）に保てるよう、
 * 入力欄はボタンを押してから出す。
 */
export function CreateComponent({
  state,
  onCreate,
}: Readonly<{
  state: EditorState;
  onCreate: (componentName: string) => void;
}>) {
  const componentization = Componentization.forSelection(state);

  return (
    // `shrink-0` を外すと一覧が長いときにフッターが潰れるが、happy-dom は Tailwind を
    // 解決しないためテストでは落ちない。気づく手段は Storybook の視覚差分だけ。
    <div className="flex shrink-0 flex-col gap-2 border-[#f0f0f0] border-t p-3">
      {componentization.kind === "ready" ? (
        <ReadyBody
          key={componentization.sourceName}
          state={state}
          onCreate={onCreate}
        />
      ) : (
        <CreateButton isEnabled={false} />
      )}
      <Caption componentization={componentization} />
    </div>
  );
}
