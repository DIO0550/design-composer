import type { ReactElement, ReactNode } from "react";
import type { DocumentError } from "@/domains/session/document-error";
import { DocumentSaveState } from "@/domains/session/document-save-state";
import { FileValidity } from "@/domains/session/file-validity";
import type { NodeTemplate } from "@/domains/session/node-template";
import type { TokenSelection } from "@/domains/session/token-selection";
import {
  DocumentErrorList,
  DocumentErrorOrigins,
} from "@/features/editor/components/document-error-list";
import { EditorState } from "@/features/editor/domains/editor-state";
import { CanvasToolbar } from "@/features/editor/features/canvas";
import type { FileRevertControl } from "@/features/editor/features/document-sync";
import { TokenDashedNodes } from "@/features/editor/features/tokens";
import type { ArtboardActions } from "@/features/editor/hooks/use-artboard-actions";
import type { NodeActions } from "@/features/editor/hooks/use-node-actions";
import type { Option } from "@/utils/Option";

/** キャンバス下端に出すもの。ファイルが不正な状態と、編集を続けられる状態の 2 つ。 */
type CanvasDock =
  | Readonly<{ kind: "file-invalid"; errors: readonly DocumentError[] }>
  | Readonly<{ kind: "editable"; errors: readonly DocumentError[] }>;

/**
 * 今どちらの状態かと、そこで出すエラーを決める。
 *
 * ファイルが不正な間は表示自体がファイルと食い違っているので、そちらの一覧だけを出す。2
 * つの一覧を並べると、外部エディタでしか直せないファイルの一覧が、アプリ内で直せるドキ
 * ュメントの一覧の場所を奪う。
 *
 * @param state エラーの出どころになるエディタの状態
 * @returns ファイルが不正ならそのエラー、そうでなければ編集で作ったエラー
 */
function canvasDock(state: EditorState): CanvasDock {
  const fileValidity = state.fileValidity;
  if (FileValidity.isInvalid(fileValidity)) {
    return { kind: "file-invalid", errors: fileValidity.errors };
  }
  return { kind: "editable", errors: EditorState.documentErrors(state) };
}

/**
 * 下端に積む器。エラー一覧とキャンバスのツールバーが同じ場所を取り合うため、順序と間隔
 * はここが持つ（各部品が浮くと重なる）。帯はキャンバスの幅いっぱいに広がるので、ポイン
 * タを受け取るのは積んだものだけにして、透明な余白はキャンバスへ通す。
 *
 * **この位置指定を落としてもテストは落ちない** — happy-dom はレイアウトを解決しない。気づ
 * く手段は `OpenedDocumentEditor` のストーリーの視覚差分だけで、それが成り立つのは**ストー
 * リーが高さの決まった器に入っているとき**に限る（器を外すと撮影範囲の外へ出る）。
 *
 * 当たり判定のほうは、テストが見られるのはクラスの綴りまで。happy-dom は Tailwind を読ま
 * ず（`user-event` が見るのは計算済みの `pointer-events`）、色も変わらないので視覚差分に
 * も映らない。実際の当たり先はブラウザで測るしかない。
 *
 * 受け取り直す指定を部品ごとではなく直下の子すべてに掛けるのは、あとから積む部品が何も
 * 書かずに受け取れるようにするため。**子が全面に広がる透明なラッパーになると症状は黙って
 * 戻る**。ラッパーを 1 枚挟んで配る形は採らない（空のラッパーが `gap-3` を食い、`self-start`
 * も効かなくなる）。
 *
 * ドックだけのストーリーを立てないのは、積み方そのものがこのモジュールの判断で、ストーリー側へ写
 * すと本物の積み方が壊れても気づけないため。
 *
 * @returns 子を縦に積み、キャンバスの下端に寄せる器
 */
function CanvasDockStack({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div
      data-testid="canvas-dock-stack"
      className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 px-4 [&>*]:pointer-events-auto"
    >
      {children}
    </div>
  );
}

/** 下端に並べるものを決めるのに要るもの。 */
type CanvasDockContentProps = Readonly<{
  /** 何をどちらの状態で出すかの出どころ。 */
  state: EditorState;
  tokenSelection: TokenSelection;
  node: NodeActions;
  artboard: ArtboardActions;
  dragged: Option<NodeTemplate>;
  onReveal: (nodeName: string) => void;
  fileRevert: FileRevertControl;
}>;

/**
 * 下端の出し分け。
 *
 * 編集を続けたまま直せる。一覧は 0 件なら何も出さない。
 *
 * @returns ファイルが不正ならエラー一覧と破線の帯、そうでなければそれにキャンバスの
 *   ツールバーを足したもの
 */
function canvasDockParts({
  state,
  tokenSelection,
  node,
  artboard,
  dragged,
  onReveal,
  fileRevert,
}: CanvasDockContentProps): ReactElement {
  const dock = canvasDock(state);
  switch (dock.kind) {
    case "file-invalid":
      return (
        <>
          <DocumentErrorList
            errors={dock.errors}
            origin={DocumentErrorOrigins.OpenedFile}
            onReveal={onReveal}
            onRevertFile={fileRevert.revert}
            isReverting={DocumentSaveState.isSaving(fileRevert.saveState)}
          />
          {/*
            ファイルが不正な間は左ペインが凍るので選び直しはできないが、
            壊れる前に選んでいたトークンの破線はキャンバスに残る。ここへ出さないと、
            破線だけが出て何を指しているか読めない状態が画面に残る。
          */}
          <TokenDashedNodes selection={tokenSelection} onReveal={onReveal} />
        </>
      );
    case "editable":
      return (
        <>
          <DocumentErrorList
            errors={dock.errors}
            origin={DocumentErrorOrigins.Document}
            onReveal={onReveal}
          />
          <TokenDashedNodes selection={tokenSelection} onReveal={onReveal} />
          <CanvasToolbar
            isInsertEnabled={node.isInsertEnabled}
            dragged={dragged}
            onAddArtboard={artboard.add}
            onInsert={node.insert}
          />
        </>
      );
  }
}

/**
 * 下端に積んだもの一式。
 *
 * 器を出し分けの外に置くのは、どちらの状態でも積み方（順序・間隔・当たり判定）が同じで、
 * 枝ごとに書くと片方だけ器を失っても誰も気づかないため。
 *
 * @param props 中身の出し分けへそのまま渡すもの
 * @returns 状態に応じた中身を積んだ、キャンバス下端の器
 */
export function CanvasDockContent(props: CanvasDockContentProps): ReactElement {
  return <CanvasDockStack>{canvasDockParts(props)}</CanvasDockStack>;
}
