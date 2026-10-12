//! 画面からウィンドウそのものを操作する Tauri コマンド。
//!
//! 開いているドキュメントが無いときの「タブを閉じる」（⌘W）でウィンドウを閉じるのに使う。
//! 閉じるかどうかの判断は TS 側が持つ（`docs/05-architecture.md`「Tauri IPC」）。

/// 呼び出し元のウィンドウを閉じる。
///
/// メニューの「ウィンドウを閉じる」（`CloseWindow`）のように前面のウィンドウを探さない。
#[tauri::command]
pub fn close_current_window(window: tauri::WebviewWindow) -> tauri::Result<()> {
    window.close()
}
