import { act, renderHook } from "@testing-library/react";
import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "@/domains/design-document";
import type { DocumentReload } from "@/features/editor/domains/document-reload";
import type { DocumentIpc, DocumentIpcError } from "@/libs/document-ipc";
import type { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import type { Option } from "@/utils/Option";
import { useDocumentReload } from "../index";

/** 開いているファイル。テストの中で開いているファイルは常に 1 つ。 */
export const PATH = "/work/login.dcmp";

/** 外部エディタが書いた、正しいドキュメントのテキスト。 */
export function artboardContent(name: string): string {
  return DocumentJson.serialize(
    DesignDocument.create({
      artboards: [Artboard.create({ name, width: 360, height: 240 })],
    }),
  );
}

export type ReloadObserver = Readonly<{
  /** 取り込み結果が届いた順に入る。 */
  reloads: readonly DocumentReload[];
  /** 直近の IPC の失敗。 */
  failure: () => Option<DocumentIpcError>;
  unmount: () => void;
}>;

/**
 * 監視を始めたフックを描画する。監視と購読は非同期に成立するので、
 * 外部変更を起こす前にここで待ち合わせる。
 */
export async function renderDocumentReload(
  ipc: DocumentIpc,
  path: string = PATH,
): Promise<ReloadObserver> {
  const reloads: DocumentReload[] = [];
  const { result, unmount } = renderHook(() =>
    useDocumentReload({
      ipc,
      path,
      onReload: (reload) => {
        reloads.push(reload);
      },
    }),
  );
  await act(async () => {});

  return { reloads, failure: () => result.current, unmount };
}

/** 外部エディタがファイルを書き換え、通知が届くまで待つ。 */
export async function changeExternally(
  fake: DocumentIpcFake,
  content: string,
  path: string = PATH,
): Promise<void> {
  await act(async () => {
    fake.changeExternally(path, content);
  });
}
