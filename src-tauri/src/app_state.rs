//! アプリ自身の状態の置き場と、その読み書きを渡す Tauri コマンド。
//!
//! `docs/05-architecture.md`「アプリ自身の状態」の通り、Rust は中身の構造を一切知らない。
//! ここを渡るのは常に生の JSON 文字列で、解釈は TS 側が行う（`document` と同じ前提）。
//!
//! Tauri の管理状態（`.manage()` / `tauri::State`）とは別物で、こちらは設定ディレクトリの
//! ファイルに残る状態を指す。

use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

use crate::file_io::{self, FileIoError};

// テストは対象と同じ階層に `{対象のファイル名}_{カテゴリ}_test.rs` で置く。
#[cfg(test)]
mod app_state_normal_test;

/// 設定ディレクトリに置くファイルの名前。
const FILE_NAME: &str = "app-state.json";

/// 設定ディレクトリの下の置き場。
pub fn state_path(config_dir: &Path) -> PathBuf {
    config_dir.join(FILE_NAME)
}

/// このアプリの設定ディレクトリから置き場を決める。
fn resolved_path(app: &AppHandle) -> Result<PathBuf, FileIoError> {
    app.path()
        .app_config_dir()
        .map(|config_dir| state_path(&config_dir))
        .map_err(|error| FileIoError::of(&format!("設定ディレクトリを解決できない: {error}")))
}

#[tauri::command]
pub fn load_app_state(app: AppHandle) -> Result<Option<String>, FileIoError> {
    file_io::read_optional_text(&resolved_path(&app)?)
}

#[tauri::command]
pub fn save_app_state(app: AppHandle, content: String) -> Result<(), FileIoError> {
    file_io::write_text(&resolved_path(&app)?, &content)
}
