use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use super::error::DocumentIoError;

/// 一時ファイル名に混ぜる連番。同一プロセス内の同時書き込みが
/// 同じ一時ファイルを掴まないようにする。
static TEMP_FILE_SEQUENCE: AtomicU64 = AtomicU64::new(0);

/// 一時ファイルへ書いてから rename することで、`path` を部分書き込み状態にせず置き換える。
///
/// 外部の読み手（AI・エディタ）からは、置き換え前の内容か置き換え後の内容の
/// どちらか一方だけが見える。
pub(crate) fn write_atomic(path: &Path, content: &str) -> Result<(), DocumentIoError> {
    let temp_path = temp_path_for(path)?;

    if let Err(error) = write_all_synced(&temp_path, content) {
        remove_temp_file(&temp_path);
        return Err(error);
    }

    // 一時ファイルは同一ディレクトリに作るのでファイルシステムをまたがず、rename は
    // アトミックに完了する。Windows でも `fs::rename` は
    // MoveFileExW(MOVEFILE_REPLACE_EXISTING) を使うため既存ファイルを置換できる。
    fs::rename(&temp_path, path).map_err(|error| {
        remove_temp_file(&temp_path);
        DocumentIoError::from_io(path, &error)
    })
}

fn write_all_synced(temp_path: &Path, content: &str) -> Result<(), DocumentIoError> {
    let mut file =
        File::create(temp_path).map_err(|error| DocumentIoError::from_io(temp_path, &error))?;
    file.write_all(content.as_bytes())
        .map_err(|error| DocumentIoError::from_io(temp_path, &error))?;
    // rename の後にクラッシュしても中身が確定しているよう、rename の前に同期する。
    file.sync_all()
        .map_err(|error| DocumentIoError::from_io(temp_path, &error))
}

/// 書き込み先と同一ディレクトリの一時ファイルパスを組み立てる。
///
/// 先頭のドットで隠しファイルにし、末尾の `.tmp` で file watch 側が除外できる形にする。
/// プロセス ID と連番を挟むことで、同時に走る書き込み同士が衝突しないようにする。
fn temp_path_for(path: &Path) -> Result<PathBuf, DocumentIoError> {
    let parent = path
        .parent()
        .ok_or_else(|| DocumentIoError::invalid_path(path, "親ディレクトリを持たない"))?;
    let file_name = path
        .file_name()
        .ok_or_else(|| DocumentIoError::invalid_path(path, "ファイル名を持たない"))?;

    let sequence = TEMP_FILE_SEQUENCE.fetch_add(1, Ordering::Relaxed);
    let temp_name = format!(
        ".{}.{}.{}.tmp",
        file_name.to_string_lossy(),
        std::process::id(),
        sequence
    );

    Ok(parent.join(temp_name))
}

/// 後始末なので失敗しても報告しない（元の失敗を上書きしないため）。
fn remove_temp_file(temp_path: &Path) {
    let _ = fs::remove_file(temp_path);
}
