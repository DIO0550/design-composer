//! ドキュメントの永続化 I/O(読み込みとアトミックな書き込み)。

mod atomic_write;
mod error;

use std::fs;
use std::sync::Arc;

use tauri::State;

use super::chosen_paths::{ChosenDocumentPath, ChosenDocumentPaths};
use super::known_content::KnownContentRegistry;

pub use error::DocumentIoError;

/// ドキュメントのコマンドが照合と自書き込みの識別に使う、管理状態の組。
#[derive(Debug, Clone, Copy)]
pub struct DocumentManagedState<'a> {
    /// 利用者が選んだパスの集合。
    pub chosen: &'a ChosenDocumentPaths,
    /// アプリが把握している内容。file watch のコールバックからも参照するので `Arc` で持つ。
    pub known: &'a Arc<KnownContentRegistry>,
}

impl<'a> DocumentManagedState<'a> {
    /// 照合に使う集合と、把握している内容から組を作る。
    pub fn new(chosen: &'a ChosenDocumentPaths, known: &'a Arc<KnownContentRegistry>) -> Self {
        Self { chosen, known }
    }
}

/// ファイルを UTF-8 文字列として読み込む。
pub fn load(path: &ChosenDocumentPath) -> Result<String, DocumentIoError> {
    let bytes = fs::read(path).map_err(|error| DocumentIoError::from_io(path, &error))?;
    String::from_utf8(bytes).map_err(|_| DocumentIoError::invalid_utf8(path))
}

/// アトミックに書き込み、書き込んだ内容を把握済みとして記録する。
///
/// 記録を `KnownContentRegistry` に任せるのは、rename と記録の間に file watch が
/// 割り込むと自アプリの書き込みを外部変更と誤判定するため(#27)。
pub fn save(
    known: &KnownContentRegistry,
    path: &ChosenDocumentPath,
    content: &str,
) -> Result<(), DocumentIoError> {
    known.record_write(path, content, || atomic_write::write_atomic(path, content))
}

/// webview から渡されたパスを照合し、通ったときだけ `load` する。読み込めたら、そのパスを
/// 選ばれた集合の先頭へ移す。
///
/// @returns 形の検査を通らないときは `InvalidPath`、選ばれていないときは `NotChosen` を返し、
/// ファイルには触れない
pub fn load_requested(
    chosen: &ChosenDocumentPaths,
    raw_path: &str,
) -> Result<String, DocumentIoError> {
    let path = chosen.require(raw_path)?;
    let content = load(&path)?;
    chosen.record_opened(&path);
    Ok(content)
}

/// webview から渡されたパスを照合し、通ったときだけ `save` する。
///
/// @returns 形の検査を通らないときは `InvalidPath`、選ばれていないときは `NotChosen` を返し、
/// ファイルには触れない
pub fn save_requested(
    managed: DocumentManagedState<'_>,
    raw_path: &str,
    content: &str,
) -> Result<(), DocumentIoError> {
    let path = managed.chosen.require(raw_path)?;
    save(managed.known, &path, content)
}

#[tauri::command]
pub fn load_document(
    path: String,
    chosen: State<'_, ChosenDocumentPaths>,
) -> Result<String, DocumentIoError> {
    load_requested(chosen.inner(), &path)
}

#[tauri::command]
pub fn save_document(
    path: String,
    content: String,
    chosen: State<'_, ChosenDocumentPaths>,
    known: State<'_, Arc<KnownContentRegistry>>,
) -> Result<(), DocumentIoError> {
    let managed = DocumentManagedState::new(chosen.inner(), known.inner());
    save_requested(managed, &path, &content)
}
