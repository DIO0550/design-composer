import { EditorScreen } from "@/features/editor";
import { Clock } from "@/libs/clock";
import { DocumentDialog } from "@/libs/document-dialog";
import { DocumentIpc } from "@/libs/document-ipc";
import { TauriDialog } from "@/libs/tauri-dialog";
import { TauriIpc } from "@/libs/tauri-ipc";

/*
 * 外部世界への口はモジュールスコープで 1 度だけ組み立てる。
 * レンダーのたびに作り直すと参照が毎回変わり、自動保存と file watch が
 * その都度張り直される（どちらも口の同一性で購読の続きを判断している）。
 * 時計も同じで、参照が変わると経過時間の購読が張り直される。
 */
const documentIpc = DocumentIpc.create(TauriIpc.create());
const documentDialog = DocumentDialog.create(TauriDialog.create());
const clock = Clock.create();

/** アプリの入口。Tauri の口を包んだ実体を編集画面へ渡すだけに徹する。 */
export function App() {
  return (
    <EditorScreen clock={clock} ipc={documentIpc} dialog={documentDialog} />
  );
}
