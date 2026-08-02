//! 外部変更の検知の境界・異常系。

mod common;

use std::fs;
use std::sync::Arc;

use app_lib::document_io::DocumentIoError;
use app_lib::document_watch::{self, DocumentWatchers};
use app_lib::known_content::KnownContentRegistry;

use common::{assert_no_change, next_change, watch_changes, TempDir};

#[test]
fn 存在しないファイルの監視は開始できない() {
    let dir = TempDir::new("watch-edge");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let result = document_watch::start(&watchers, known, &dir.join("missing.dcmp"), |_| {});

    assert!(matches!(result, Err(DocumentIoError::NotFound { .. })));
}

#[test]
fn 外部がファイルを差し替えても検知が続く() {
    let dir = TempDir::new("watch-edge");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();
    let changes = watch_changes(&watchers, &known, &path);

    // 多くのエディタと同じく、別ファイルへ書いてから差し替える形で保存する。
    // ファイル自身を監視していると、ここで実体が入れ替わって以降のイベントが届かなくなる
    replace_from_temp_file(&dir, &path, r#"{"version":2}"#, "first");
    assert_eq!(next_change(&changes), r#"{"version":2}"#);
    replace_from_temp_file(&dir, &path, r#"{"version":3}"#, "second");

    assert_eq!(next_change(&changes), r#"{"version":3}"#);
}

#[test]
fn 同じディレクトリの別ファイルの変更は通知されない() {
    let dir = TempDir::new("watch-edge");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let changes = watch_changes(&watchers, &known, &path);
    fs::write(dir.join("other.dcmp"), r#"{"version":9}"#).expect("別ファイルを書き込める");

    assert_no_change(&changes);
}

#[test]
fn 同じファイルを二重に監視しても通知は1回だけ届く() {
    let dir = TempDir::new("watch-edge");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let first = watch_changes(&watchers, &known, &path);
    let second = watch_changes(&watchers, &known, &path);
    fs::write(&path, r#"{"version":2}"#).expect("外部からの書き込みができる");

    assert_eq!(next_change(&second), r#"{"version":2}"#);
    assert_no_change(&first);
}

#[test]
fn 監視を再開すると停止中の変更は通知されず再開後の変更が通知される() {
    let dir = TempDir::new("watch-edge");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let stopped = watch_changes(&watchers, &known, &path);
    watchers.unwatch(&path);
    fs::write(&path, r#"{"version":2}"#).expect("停止中の書き込みができる");
    let restarted = watch_changes(&watchers, &known, &path);
    fs::write(&path, r#"{"version":3}"#).expect("再開後の書き込みができる");

    assert_eq!(next_change(&restarted), r#"{"version":3}"#);
    assert_no_change(&stopped);
}

#[test]
fn 監視していないファイルの停止は何も起こさない() {
    let dir = TempDir::new("watch-edge");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    watchers.unwatch(&path);

    let changes = watch_changes(&watchers, &known, &path);
    fs::write(&path, r#"{"version":2}"#).expect("外部からの書き込みができる");
    assert_eq!(next_change(&changes), r#"{"version":2}"#);
}

/// 監視対象と同じディレクトリの一時ファイルへ書いてから差し替える。
fn replace_from_temp_file(dir: &TempDir, path: &std::path::Path, content: &str, label: &str) {
    let temp_path = dir.join(&format!("{label}.tmp"));
    fs::write(&temp_path, content).expect("一時ファイルへ書き込める");
    fs::rename(&temp_path, path).expect("一時ファイルで差し替えられる");
}
