//! 外部変更の検知の境界・異常系。

use std::fs;
use std::sync::Arc;

use super::io::DocumentIoError;
use super::known_content::KnownContentRegistry;
use super::watch::{self, DocumentWatchers};

use super::test_support::{
    assert_no_change, chosen_document, chosen_file_path, chosen_paths_in, next_change,
    raw_document_path, watch_changes, watch_registries, watch_requested_payloads, TempDir,
};

#[test]
fn 存在しないファイルの監視は開始できない() {
    let dir = TempDir::new("watch-edge");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let result = watch::start(
        &watchers,
        known,
        &chosen_file_path(&dir, "missing.dcmp"),
        |_| {},
    );

    assert!(matches!(result, Err(DocumentIoError::NotFound { .. })));
}

#[test]
fn 外部がファイルを差し替えても検知が続く() {
    let dir = TempDir::new("watch-edge");
    let path = chosen_file_path(&dir, "document.dcmp");
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
    let path = chosen_file_path(&dir, "document.dcmp");
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
    let path = chosen_file_path(&dir, "document.dcmp");
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
    let path = chosen_file_path(&dir, "document.dcmp");
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
    let path = chosen_file_path(&dir, "document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    watchers.unwatch(&path);

    let changes = watch_changes(&watchers, &known, &path);
    fs::write(&path, r#"{"version":2}"#).expect("外部からの書き込みができる");
    assert_eq!(next_change(&changes), r#"{"version":2}"#);
}

// 不正なパスを返すことを確かめるテストは、選ばれたパスの集合を空にして呼ぶ。`.dcmp` 以外は
// そもそも選べないので、集合を空にしても照合より先に形の検査で落ちることを固定できる。

#[test]
fn 拡張子がdcmpでない既存のファイルは監視されず書き換えても通知されない() {
    let dir = TempDir::new("watch-edge");
    let record_dir = TempDir::new("watch-edge-record");
    fs::write(dir.join("notes.txt"), "v1").expect("監視対象を用意できる");
    let chosen = chosen_paths_in(&record_dir);
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let (result, payloads) = watch_requested_payloads(
        watch_registries(&chosen, &known, &watchers),
        &raw_document_path(&dir, "notes.txt"),
    );
    fs::write(dir.join("notes.txt"), "v2").expect("外部からの書き込みができる");

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
    assert_no_change(&payloads);
}

#[test]
fn 拡張子がdcmpでないファイルの監視の停止は不正なパスを返す() {
    let dir = TempDir::new("watch-edge");
    let record_dir = TempDir::new("watch-edge-record");
    let chosen = chosen_paths_in(&record_dir);
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let result = watch::stop_requested(
        watch_registries(&chosen, &known, &watchers),
        &raw_document_path(&dir, "notes.txt"),
    );

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
}

#[test]
fn 選んでいないdcmpファイルは監視されず書き換えても通知されない() {
    let dir = TempDir::new("watch-edge");
    let record_dir = TempDir::new("watch-edge-record");
    fs::write(dir.join("document.dcmp"), r#"{"version":1}"#).expect("監視対象を用意できる");
    let chosen = chosen_paths_in(&record_dir);
    // 対照に別のファイルを選んでおく。集合が空だから拒んだ、では通らないようにする。
    chosen_document(&chosen, &dir, "other.dcmp");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let (result, payloads) = watch_requested_payloads(
        watch_registries(&chosen, &known, &watchers),
        &raw_document_path(&dir, "document.dcmp"),
    );
    fs::write(dir.join("document.dcmp"), r#"{"version":2}"#).expect("外部からの書き込みができる");

    assert!(matches!(result, Err(DocumentIoError::NotChosen { .. })));
    assert_no_change(&payloads);
}

#[test]
fn 選んだときと違う綴りでは同じファイルでも監視を始められない() {
    let dir = TempDir::new("watch-edge");
    let record_dir = TempDir::new("watch-edge-record");
    fs::write(dir.join("document.dcmp"), r#"{"version":1}"#).expect("監視対象を用意できる");
    let chosen = chosen_paths_in(&record_dir);
    chosen_document(&chosen, &dir, "document.dcmp");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();
    // 寄せると消える `/./` を綴りに含める
    let detoured = raw_document_path(&dir, "./document.dcmp");

    let (result, _payloads) =
        watch_requested_payloads(watch_registries(&chosen, &known, &watchers), &detoured);

    assert!(matches!(result, Err(DocumentIoError::NotChosen { .. })));
}

/// 監視対象と同じディレクトリの一時ファイルへ書いてから差し替える。
fn replace_from_temp_file(dir: &TempDir, path: &std::path::Path, content: &str, label: &str) {
    let temp_path = dir.join(&format!("{label}.tmp"));
    fs::write(&temp_path, content).expect("一時ファイルへ書き込める");
    fs::rename(&temp_path, path).expect("一時ファイルで差し替えられる");
}
