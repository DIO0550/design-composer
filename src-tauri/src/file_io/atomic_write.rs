use std::ffi::OsStr;
use std::fs::{self, File};
use std::io::{self, Write};
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

/// 一時ファイル名に混ぜる連番。同一プロセス内の同時書き込みが
/// 同じ一時ファイルを掴まないようにする。
static TEMP_FILE_SEQUENCE: AtomicU64 = AtomicU64::new(0);

/// 一時ファイルへ書いてから rename することで、`directory` の `file_name` を部分書き込み状態に
/// せず置き換える。外部の読み手（AI・エディタ）からは、置き換え前か置き換え後の一方だけが見える。
///
/// 親とファイル名を分けて受けるのは、分けられないパスをどの失敗とするかを呼び出し側が決めるため。
/// パスで受けて `InvalidInput` を返すと、NUL を含むパスの失敗と見分けられない。
///
/// @returns `file_name` が単一のファイル名でない（空・`.`・`..`・絶対パス・区切りで 2 つ以上の
///   要素に分かれる）ときは、何も書かずに `InvalidInput` を返す。それ以外の失敗は各手順の
///   `io::Error` のまま返す（一時ファイルのパスは載らない）
pub fn write_atomic(directory: &Path, file_name: &OsStr, content: &str) -> io::Result<()> {
    if !is_single_file_name(file_name) {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            format!("ファイル名ではありません: {}", file_name.to_string_lossy()),
        ));
    }

    let path = directory.join(file_name);
    let temp_path = temp_path_for(directory, file_name);

    if let Err(error) = write_all_synced(&temp_path, content) {
        remove_temp_file(&temp_path);
        return Err(error);
    }

    // 一時ファイルは同一ディレクトリに作るのでファイルシステムをまたがず、rename は
    // アトミックに完了する。Windows でも `fs::rename` は
    // MoveFileExW(MOVEFILE_REPLACE_EXISTING) を使うため既存ファイルを置換できる。
    fs::rename(&temp_path, &path).inspect_err(|_| remove_temp_file(&temp_path))
}

/// `file_name` を `directory` に join しても `directory` 直下を指すか（通常の要素がちょうど 1 つか）。
fn is_single_file_name(file_name: &OsStr) -> bool {
    let mut components = Path::new(file_name).components();
    let first_is_normal = matches!(components.next(), Some(Component::Normal(_)));
    let has_no_more_components = components.next().is_none();
    first_is_normal && has_no_more_components
}

fn write_all_synced(temp_path: &Path, content: &str) -> io::Result<()> {
    let mut file = File::create(temp_path)?;
    file.write_all(content.as_bytes())?;
    // rename の後にクラッシュしても中身が確定しているよう、rename の前に同期する。
    file.sync_all()
}

/// 書き込み先と同一ディレクトリの一時ファイルパスを組み立てる。
///
/// 先頭のドットで隠しファイルにし、末尾の `.tmp` で file watch 側が除外できる形にする。
/// プロセス ID と連番を挟むことで、同時に走る書き込み同士が衝突しないようにする。
fn temp_path_for(directory: &Path, file_name: &OsStr) -> PathBuf {
    let sequence = TEMP_FILE_SEQUENCE.fetch_add(1, Ordering::Relaxed);
    let temp_name = format!(
        ".{}.{}.{}.tmp",
        file_name.to_string_lossy(),
        std::process::id(),
        sequence
    );

    directory.join(temp_name)
}

/// 後始末なので失敗しても報告しない（元の失敗を上書きしないため）。
fn remove_temp_file(temp_path: &Path) {
    let _ = fs::remove_file(temp_path);
}
