// テストはフィクスチャを std::fs で直接用意・検査するので、file_io を通す縛りは本番コードにだけ掛ける。
// cfg(test) でない lib は clippy --all-targets がそのまま検査する。
#![cfg_attr(test, allow(clippy::disallowed_methods, clippy::disallowed_types))]
// テスト名は仕様の文として日本語で書き、DCMP / JSON のようなラテン文字を含むと snake case でなくなる。
#![cfg_attr(test, allow(non_snake_case))]

pub mod app_state;
pub mod app_window;
pub mod document;
pub mod file_io;
pub mod menu;

// 対象のモジュールをまたいで使うテスト支援。
#[cfg(test)]
mod test_support;

use std::sync::Arc;

use tauri::Manager;

use document::chosen_paths::{self, ChosenDocumentPaths};
use document::known_content::KnownContentRegistry;
use document::watch::DocumentWatchers;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // ファイルを開く / 保存するダイアログは Tauri 標準プラグインを Rust から使う
        // (`document/dialog.rs`)。webview からは呼ばせない(capabilities に `dialog:` を置かない)
        .plugin(tauri_plugin_dialog::init())
        // 開く / 新規作成は画面の帯ではなく OS のメニューに置く（#374）
        .menu(menu::build)
        .on_menu_event(menu::run_item)
        // watch のコールバックからも参照するため Arc で共有する
        .manage(Arc::new(KnownContentRegistry::new()))
        .manage(DocumentWatchers::new())
        // 選ばれたパスの記録は設定ディレクトリに置くので、パスを解決できる setup で読み戻す。
        // setup は IPC を受け付ける前に同期で走るので、空の集合で照合されることはない。
        // 設定ディレクトリを解決できなくても起動は止めず、記録なし(メモリ上の照合だけ)で動く。
        .setup(|app| {
            let chosen = match app.path().app_config_dir() {
                Ok(config_dir) => {
                    ChosenDocumentPaths::restore(chosen_paths::record_path(&config_dir))
                }
                Err(_) => ChosenDocumentPaths::in_memory(),
            };
            app.manage(chosen);
            Ok(())
        })
        .on_window_event(document::file_drop::on_window_event)
        .invoke_handler(tauri::generate_handler![
            document::canonical_path::canonicalize_document_path,
            document::dialog::choose_open_document_path,
            document::dialog::choose_save_document_path,
            document::io::load_document,
            document::io::save_document,
            document::watch::watch_document,
            document::watch::unwatch_document,
            app_state::load_app_state,
            app_state::save_app_state,
            app_window::close_current_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
