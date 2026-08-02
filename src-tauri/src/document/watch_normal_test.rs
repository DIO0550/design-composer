//! 外部変更の検知(docs/05-architecture.md「外部編集の検知」)。

use std::fs;
use std::sync::Arc;

use super::io;
use super::known_content::KnownContentRegistry;
use super::watch::DocumentWatchers;

use super::test_support::{assert_no_change, next_change, watch_changes, TempDir};

#[test]
fn 外部がファイルを書き換えると変更が通知される() {
    let dir = TempDir::new("watch-normal");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let changes = watch_changes(&watchers, &known, &path);
    fs::write(&path, r#"{"version":2}"#).expect("外部からの書き込みができる");

    assert_eq!(next_change(&changes), r#"{"version":2}"#);
}

#[test]
fn アプリ自身の保存では変更が通知されない() {
    let dir = TempDir::new("watch-normal");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let changes = watch_changes(&watchers, &known, &path);
    io::save(&known, &path, r#"{"version":2}"#).expect("保存に成功する");
    fs::write(&path, r#"{"version":3}"#).expect("外部からの書き込みができる");

    // 自アプリの保存が通知されていれば、最初に届くのは version 2 になる
    assert_eq!(next_change(&changes), r#"{"version":3}"#);
}

#[test]
fn 内容が変わらない書き込みでは変更が通知されない() {
    let dir = TempDir::new("watch-normal");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let changes = watch_changes(&watchers, &known, &path);
    fs::write(&path, r#"{"version":1}"#).expect("同じ内容で書き込みができる");
    fs::write(&path, r#"{"version":2}"#).expect("外部からの書き込みができる");

    assert_eq!(next_change(&changes), r#"{"version":2}"#);
}

#[test]
fn 外部の書き込み1回につき通知は1回だけ届く() {
    let dir = TempDir::new("watch-normal");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let changes = watch_changes(&watchers, &known, &path);
    fs::write(&path, r#"{"version":2}"#).expect("外部からの書き込みができる");

    // 1 回の書き込みに対して OS が複数の変更イベントを出しても、通知は 1 回に収まる
    assert_eq!(next_change(&changes), r#"{"version":2}"#);
    assert_no_change(&changes);
}

#[test]
fn 外部が続けて書き換えるとそれぞれの内容が通知される() {
    let dir = TempDir::new("watch-normal");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let changes = watch_changes(&watchers, &known, &path);
    fs::write(&path, r#"{"version":2}"#).expect("1 回目の書き込みができる");
    assert_eq!(next_change(&changes), r#"{"version":2}"#);
    fs::write(&path, r#"{"version":3}"#).expect("2 回目の書き込みができる");

    assert_eq!(next_change(&changes), r#"{"version":3}"#);
}

#[test]
fn 監視を止めると変更が通知されなくなる() {
    let dir = TempDir::new("watch-normal");
    let path = dir.join("document.dcmp");
    fs::write(&path, r#"{"version":1}"#).expect("監視対象を用意できる");
    let known = Arc::new(KnownContentRegistry::new());
    let watchers = DocumentWatchers::new();

    let changes = watch_changes(&watchers, &known, &path);
    watchers.unwatch(&path);
    fs::write(&path, r#"{"version":2}"#).expect("外部からの書き込みができる");

    assert_no_change(&changes);
}
