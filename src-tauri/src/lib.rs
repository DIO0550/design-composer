pub mod document;
pub mod menu;

use std::sync::Arc;

use document::known_content::KnownContentRegistry;
use document::watch::DocumentWatchers;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // ファイルを開く / 保存するダイアログは Tauri 標準プラグインを使う
        .plugin(tauri_plugin_dialog::init())
        // 開く / 新規作成は画面の帯ではなく OS のメニューに置く（#374）
        .menu(menu::build)
        .on_menu_event(menu::emit_command)
        // watch のコールバックからも参照するため Arc で共有する
        .manage(Arc::new(KnownContentRegistry::new()))
        .manage(DocumentWatchers::new())
        .invoke_handler(tauri::generate_handler![
            document::io::load_document,
            document::io::save_document,
            document::watch::watch_document,
            document::watch::unwatch_document
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
