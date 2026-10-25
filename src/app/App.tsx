import { EditorScreen } from "@/features/editor";
import { createAppMenu } from "@/libs/app-menu";
import { createAppStateIpc } from "@/libs/app-state-ipc";
import { createAppWindow } from "@/libs/app-window";
import { Clock } from "@/libs/clock";
import { createDocumentDialog } from "@/libs/document-dialog";
import { createDocumentIpc } from "@/libs/document-ipc";
import { createFileDrop } from "@/libs/file-drop";
import { TauriDialog } from "@/libs/tauri-dialog";
import { TauriIpc } from "@/libs/tauri-ipc";

/*
 * 外部世界への口はモジュールスコープで 1 度だけ組み立てる。
 * レンダーのたびに作り直すと参照が毎回変わり、自動保存・file watch・メニューと
 * ドロップの購読がその都度張り直される（どれも口の同一性で購読の続きを判断している）。
 * 時計も同じで、参照が変わると経過時間の購読が張り直される。
 *
 * Tauri の口（`TauriIpc`）を 1 つにまとめるのは、コマンドもイベントも同じ webview へ
 * 向くため。分けて作っても届く先は同じで、口の数だけ同一性の管理が増える。
 */
const tauriIpc = TauriIpc.create();
const ports = {
  ipc: createDocumentIpc(tauriIpc),
  dialog: createDocumentDialog(TauriDialog.create()),
  menu: createAppMenu(tauriIpc),
  drop: createFileDrop(tauriIpc),
  appState: createAppStateIpc(tauriIpc),
  appWindow: createAppWindow(tauriIpc),
} as const;
const clock = Clock.create();

/** アプリの入口。Tauri の口を包んだ実体を編集画面へ渡すだけに徹する。 */
export function App() {
  return <EditorScreen clock={clock} ports={ports} />;
}
