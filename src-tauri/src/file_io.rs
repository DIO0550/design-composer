//! テキストファイルの読み書き。
//!
//! 中身が何であるかは知らない。どこへ置くか・何を書くかは呼び出し側が決める。

use std::fs;
use std::io;
use std::path::Path;

use serde::Serialize;

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

/// テキストとして読む。
///
/// まだ置かれていないことは失敗ではないので `None` で表す。
pub fn read_optional_text(path: &Path) -> Result<Option<String>, FileIoError> {
    let bytes = match fs::read(path) {
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
/// 一時ファイル + rename（`document::io`）にはしない。書き込みの途中で落ちて壊れても
/// 作り直せるものを置く先で、外部の読み手を待たせる相手もいない。
pub fn write_text(path: &Path, content: &str) -> Result<(), FileIoError> {
    let parent = path
        .parent()
        .ok_or_else(|| FileIoError::at(path, "親ディレクトリを持たない"))?;
    fs::create_dir_all(parent).map_err(|error| FileIoError::at(parent, &error.to_string()))?;
    fs::write(path, content).map_err(|error| FileIoError::at(path, &error.to_string()))
}
