//! .dcmp を選ばせるダイアログを Rust から出し、選ばれたパスを選ばれた集合(`chosen_paths.rs`)へ
//! 載せる(`docs/05-architecture.md`「選ばれたファイルの記録」)。

use tauri::{Runtime, State, Window};
use tauri_plugin_dialog::{DialogExt, FileDialogBuilder, FilePath};

use super::chosen_paths::ChosenDocumentPaths;
use super::io::DocumentIoError;

/// ダイアログの絞り込みに出す名前。1 ドキュメント = 1 ファイル(docs/01-file-format.md「ファイル」)。
const DOCUMENT_FILTER_NAME: &str = "Design Composer ドキュメント";

/// ダイアログの絞り込みで選ばせる拡張子。
const DOCUMENT_EXTENSIONS: &[&str] = &["dcmp"];

/// 新規作成の保存ダイアログに入れておく名前。
const DEFAULT_FILE_NAME: &str = "untitled.dcmp";

/// .dcmp に絞ったダイアログを組み立てる。
fn document_dialog<R: Runtime>(window: &Window<R>) -> FileDialogBuilder<R> {
    window
        .dialog()
        .file()
        .add_filter(DOCUMENT_FILTER_NAME, DOCUMENT_EXTENSIONS)
}

// 親ウィンドウの付け方は plugin-dialog 自身のコマンドに揃える。開く `open` は Windows / macOS
// だけで、保存の `save` はデスクトップすべてで付ける。
#[cfg(any(windows, target_os = "macos"))]
fn with_open_parent<R: Runtime>(
    builder: FileDialogBuilder<R>,
    window: &Window<R>,
) -> FileDialogBuilder<R> {
    builder.set_parent(window)
}

#[cfg(not(any(windows, target_os = "macos")))]
fn with_open_parent<R: Runtime>(
    builder: FileDialogBuilder<R>,
    _window: &Window<R>,
) -> FileDialogBuilder<R> {
    builder
}

#[cfg(desktop)]
fn with_save_parent<R: Runtime>(
    builder: FileDialogBuilder<R>,
    window: &Window<R>,
) -> FileDialogBuilder<R> {
    builder.set_parent(window)
}

#[cfg(not(desktop))]
fn with_save_parent<R: Runtime>(
    builder: FileDialogBuilder<R>,
    _window: &Window<R>,
) -> FileDialogBuilder<R> {
    builder
}

/// ダイアログが返したものを、選ばれた集合へ載せる。
///
/// @param picked ダイアログが返したもの(閉じたなら `None`)
/// @returns 載せた綴り(閉じたなら `None`)。パスとして・UTF-8 として読めないときと、
/// ドキュメントのパスとして寄せられないとき(`.dcmp` 以外を選んだときなど)は `InvalidPath`
fn accept_picked(
    chosen: &ChosenDocumentPaths,
    picked: Option<FilePath>,
) -> Result<Option<String>, DocumentIoError> {
    let Some(picked) = picked else {
        return Ok(None);
    };
    let described = picked.to_string();
    let path = picked.into_path().map_err(|error| {
        DocumentIoError::invalid_path(described.as_ref(), &format!("パスとして読めない: {error}"))
    })?;
    let spelled = path
        .to_str()
        .ok_or_else(|| DocumentIoError::invalid_path(&path, "UTF-8 で表せない"))?;
    chosen.record_chosen(spelled).map(Some)
}

// ダイアログは閉じられるまで戻らない。同期コマンドはメインスレッドで動くので、async で
// 別スレッドへ出す(plugin-dialog の `blocking_*` はメインスレッドで呼ぶと固まる)。
#[tauri::command(async)]
pub fn choose_open_document_path(
    window: Window,
    chosen: State<'_, ChosenDocumentPaths>,
) -> Result<Option<String>, DocumentIoError> {
    let picked = with_open_parent(document_dialog(&window), &window).blocking_pick_file();
    accept_picked(chosen.inner(), picked)
}

#[tauri::command(async)]
pub fn choose_save_document_path(
    window: Window,
    chosen: State<'_, ChosenDocumentPaths>,
) -> Result<Option<String>, DocumentIoError> {
    let picked = with_save_parent(document_dialog(&window), &window)
        .set_file_name(DEFAULT_FILE_NAME)
        .blocking_save_file();
    accept_picked(chosen.inner(), picked)
}
