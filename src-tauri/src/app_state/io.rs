//! アプリ自身の状態の永続化 I/O。

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, Manager};

/// 設定ディレクトリに置くファイルの名前。
const FILE_NAME: &str = "app-state.json";

/// アプリ自身の状態を読み書きできなかったことと、診断用の原文。
///
/// `DocumentIoError` と違って種別を持たない。読めなければ復元しない・書けなければ次の
/// 起動で一覧が古いままになる、のどちらも呼び出し側の分岐が 1 通りしかないため。
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AppStateIoError {
    message: String,
}

impl AppStateIoError {
    /// 対象を添えた失敗を作る。
    fn at(path: &Path, reason: &str) -> Self {
        Self {
            message: format!("{}: {}", path.display(), reason),
        }
    }

    /// 表示・ログ用のメッセージ。
    pub fn message(&self) -> &str {
        &self.message
    }
}

/// 保存されている中身を読む。
///
/// まだ一度も保存していないことは失敗ではないので `None` で表す。
pub fn load(path: &Path) -> Result<Option<String>, AppStateIoError> {
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(AppStateIoError::at(path, &error.to_string())),
    };
    String::from_utf8(bytes)
        .map(Some)
        .map_err(|_| AppStateIoError::at(path, "UTF-8 として解釈できない"))
}

/// 中身を置き換える。置き場のディレクトリが無ければ作る。
///
/// 一時ファイル + rename（`document::io`）にはしない。途中で落ちて壊れても失われるのは
/// 最近使ったファイルの一覧だけで、開き直せば作り直せる。
pub fn save(path: &Path, content: &str) -> Result<(), AppStateIoError> {
    let parent = path
        .parent()
        .ok_or_else(|| AppStateIoError::at(path, "親ディレクトリを持たない"))?;
    fs::create_dir_all(parent).map_err(|error| AppStateIoError::at(parent, &error.to_string()))?;
    fs::write(path, content).map_err(|error| AppStateIoError::at(path, &error.to_string()))
}

/// 設定ディレクトリの下の置き場。
pub fn state_path(config_dir: &Path) -> PathBuf {
    config_dir.join(FILE_NAME)
}

/// このアプリの設定ディレクトリから置き場を決める。
fn resolved_path(app: &AppHandle) -> Result<PathBuf, AppStateIoError> {
    app.path()
        .app_config_dir()
        .map(|config_dir| state_path(&config_dir))
        .map_err(|error| AppStateIoError {
            message: format!("設定ディレクトリを解決できない: {error}"),
        })
}

#[tauri::command]
pub fn load_app_state(app: AppHandle) -> Result<Option<String>, AppStateIoError> {
    load(&resolved_path(&app)?)
}

#[tauri::command]
pub fn save_app_state(app: AppHandle, content: String) -> Result<(), AppStateIoError> {
    save(&resolved_path(&app)?, &content)
}
