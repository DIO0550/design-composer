//! ダイアログが返したものを載せるときの境界・異常系。

use std::fs;

use tauri_plugin_dialog::FilePath;

use super::chosen_paths;
use super::dialog::accept_picked;
use super::io::DocumentIoError;

use super::test_support::{chosen_paths_in, TempDir};

#[test]
fn ダイアログで拡張子がdcmpでないファイルを選ぶと不正なパスを返す() {
    let dir = TempDir::new("dialog-edge");
    let record_dir = TempDir::new("dialog-edge-record");
    fs::write(dir.join("notes.txt"), "x").expect("選ぶファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);

    let result = accept_picked(&chosen, Some(FilePath::Path(dir.join("notes.txt"))));

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
}

#[test]
fn ダイアログで拡張子がdcmpでないファイルを選んでも記録に載らない() {
    let dir = TempDir::new("dialog-edge");
    let record_dir = TempDir::new("dialog-edge-record");
    fs::write(dir.join("notes.txt"), "x").expect("選ぶファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);
    // 対照に選べるものを先に選び、記録が書き出される状態にしておく
    let accepted = accept_picked(&chosen, Some(FilePath::Path(dir.join("document.dcmp"))))
        .expect("選べる")
        .expect("選んだ綴りが返る");

    let _ = accept_picked(&chosen, Some(FilePath::Path(dir.join("notes.txt"))));

    let recorded: Vec<String> = serde_json::from_slice(
        &fs::read(chosen_paths::record_path(record_dir.path())).expect("記録を読める"),
    )
    .expect("記録は文字列の配列");
    assert_eq!(recorded, vec![accepted]);
}

// macOS は UTF-8 で表せない名前のファイルを作れないので Linux に限る。
#[cfg(target_os = "linux")]
#[test]
fn ダイアログでutf8で表せないパスを選ぶと不正なパスを返す() {
    use std::ffi::OsStr;
    use std::os::unix::ffi::OsStrExt;

    let dir = TempDir::new("dialog-edge");
    let record_dir = TempDir::new("dialog-edge-record");
    let not_utf8 = dir.path().join(OsStr::from_bytes(b"bad\xff.dcmp"));
    let chosen = chosen_paths_in(&record_dir);

    let result = accept_picked(&chosen, Some(FilePath::Path(not_utf8)));

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
}
