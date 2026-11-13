//! ファイルシステムへの読み書き。本番コードで `std::fs` を呼ぶのはこのモジュールだけにする。
//!
//! 口は 2 系統ある。`read_bytes` / `write_atomic` / `canonicalize` は `io::Result` をそのまま返し、
//! 失敗の種別への詰め替えは呼び出し側が行う。`read_optional_text` / `write_text` は失敗を
//! `FileIoError` にまとめる。後者は前者と意味が違う（無いことを `None` で表す・UTF-8 として
//! 解釈する・親ディレクトリを作る）ので残している。
//!
//! ファイル変更の監視（`notify` の watcher による購読）はここを通さない。監視するパスの解決には `canonicalize` を使う。

// allow でなく expect にしたのは、fs の呼び出しが無くなったときに unfulfilled で落ちて許可が残らないため。
#![expect(
    clippy::disallowed_methods,
    clippy::disallowed_types,
    reason = "clippy.toml の禁止の受け口"
)]

mod atomic_write;

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde::Serialize;

pub use atomic_write::write_atomic;

// テストは対象と同じ階層に `{対象のファイル名}_{カテゴリ}_test.rs` で置く。
#[cfg(test)]
mod file_io_edge_test;
#[cfg(test)]
mod file_io_normal_test;

/// ファイルを読み書きできなかったことと、診断用の原文。
///
/// `DocumentIoError` と違って種別を持たない。読めなければ使わない・書けなければ次に
/// 書き直す、のどちらも呼び出し側の分岐が 1 通りしかないため。
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct FileIoError {
    message: String,
}

impl FileIoError {
    /// 対象を添えた失敗を作る。
    pub(crate) fn at(path: &Path, reason: &str) -> Self {
        Self {
            message: format!("{}: {}", path.display(), reason),
        }
    }

    /// 対象を指せない失敗を作る（置き場そのものが決まらなかった等）。
    pub(crate) fn of(reason: &str) -> Self {
        Self {
            message: reason.to_string(),
        }
    }

    /// 表示・ログ用のメッセージ。
    pub fn message(&self) -> &str {
        &self.message
    }
}

/// 中身をバイト列として読む。
pub fn read_bytes(path: &Path) -> io::Result<Vec<u8>> {
    fs::read(path)
}

/// symlink と `.` / `..` を解決した絶対パスを、OS が返した綴りのまま返す（Windows の `\\?\` 接頭辞も残す）。
///
/// @returns 解決した絶対パス。パスが存在しないとき、途中の symlink を解決できないときは `Err`。
pub fn canonicalize(path: &Path) -> io::Result<PathBuf> {
    fs::canonicalize(path)
}

/// テキストとして読む。
///
/// まだ置かれていないことは失敗ではないので `None` で表す。
pub fn read_optional_text(path: &Path) -> Result<Option<String>, FileIoError> {
    let bytes = match read_bytes(path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(FileIoError::at(path, &error.to_string())),
    };
    String::from_utf8(bytes)
        .map(Some)
        .map_err(|_| FileIoError::at(path, "UTF-8 として解釈できない"))
}

/// 中身を置き換える。親ディレクトリが無ければ作る。
///
/// 一時ファイル + rename（`write_atomic`）にはしない。書き込みの途中で落ちて壊れても
/// 作り直せるものを置く先で、外部の読み手を待たせる相手もいない。
pub fn write_text(path: &Path, content: &str) -> Result<(), FileIoError> {
    let parent = path
        .parent()
        .ok_or_else(|| FileIoError::at(path, "親ディレクトリを持たない"))?;
    fs::create_dir_all(parent).map_err(|error| FileIoError::at(parent, &error.to_string()))?;
    fs::write(path, content).map_err(|error| FileIoError::at(path, &error.to_string()))
}
