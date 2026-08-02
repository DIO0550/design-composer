//! ドキュメントの永続化 I/O。
//!
//! `docs/05-architecture.md`「Tauri IPC」の通り、Rust は .dcmp の構造を一切知らない。
//! ここを渡るのは常に生の JSON 文字列で、パース・検証・マイグレーションは TS 側が行う。

mod atomic_write;
mod error;

use std::fs;
use std::path::Path;
use std::sync::Arc;

use tauri::State;

use crate::known_content::KnownContentRegistry;

pub use error::DocumentIoError;

/// ファイルを UTF-8 文字列として読み込む。
pub fn load(path: &Path) -> Result<String, DocumentIoError> {
    let bytes = fs::read(path).map_err(|error| DocumentIoError::from_io(path, &error))?;
    String::from_utf8(bytes).map_err(|_| DocumentIoError::invalid_utf8(path))
}

/// アトミックに書き込み、書き込んだ内容を把握済みとして記録する。
///
/// 記録を `KnownContentRegistry` に任せるのは、rename と記録の間に file watch が
/// 割り込むと自アプリの書き込みを外部変更と誤判定するため(#27)。
pub fn save(
    known: &KnownContentRegistry,
    path: &Path,
    content: &str,
) -> Result<(), DocumentIoError> {
    known.record_write(path, content, || atomic_write::write_atomic(path, content))
}

#[tauri::command]
pub fn load_document(path: String) -> Result<String, DocumentIoError> {
    load(Path::new(&path))
}

#[tauri::command]
pub fn save_document(
    path: String,
    content: String,
    known: State<'_, Arc<KnownContentRegistry>>,
) -> Result<(), DocumentIoError> {
    save(known.inner().as_ref(), Path::new(&path), &content)
}
