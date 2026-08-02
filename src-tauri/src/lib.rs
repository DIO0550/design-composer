pub mod document_io;

use document_io::SelfWriteRegistry;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // ファイルを開く / 保存するダイアログは Tauri 標準プラグインを使う
        .plugin(tauri_plugin_dialog::init())
        .manage(SelfWriteRegistry::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            document_io::load_document,
            document_io::save_document
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
