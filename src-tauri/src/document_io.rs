//! ドキュメントの永続化 I/O。
//!
//! `docs/05-architecture.md`「Tauri IPC」の通り、Rust は .dcmp の構造を一切知らない。
//! ここを渡るのは常に生の JSON 文字列で、パース・検証・マイグレーションは TS 側が行う。

mod atomic_write;
mod error;
mod self_write;

use std::fs;
use std::path::Path;

use tauri::State;

pub use error::DocumentIoError;
pub use self_write::SelfWriteRegistry;

/// ファイルを UTF-8 文字列として読み込む。
pub fn load(path: &Path) -> Result<String, DocumentIoError> {
    let bytes = fs::read(path).map_err(|error| DocumentIoError::from_io(path, &error))?;
    String::from_utf8(bytes).map_err(|_| DocumentIoError::invalid_utf8(path))
}

/// アトミックに書き込み、書き込んだ内容を自書き込みとして記録する。
pub fn save(
    registry: &SelfWriteRegistry,
    path: &Path,
    content: &str,
) -> Result<(), DocumentIoError> {
    atomic_write::write_atomic(path, content)?;
    // 記録は rename の成功後に行う。失敗した書き込みを自書き込みとして覚えると、
    // その内容がファイルに現れたときに外部変更を見落とすため。
    registry.record(path, content);
    Ok(())
}

#[tauri::command]
pub fn load_document(path: String) -> Result<String, DocumentIoError> {
    load(Path::new(&path))
}

#[tauri::command]
pub fn save_document(
    path: String,
    content: String,
    registry: State<'_, SelfWriteRegistry>,
) -> Result<(), DocumentIoError> {
    save(registry.inner(), Path::new(&path), &content)
}
