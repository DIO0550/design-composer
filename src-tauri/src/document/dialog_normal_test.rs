//! ダイアログが返したものを、選ばれたものとして載せる。

use std::fs;

use tauri_plugin_dialog::FilePath;

use super::dialog::accept_picked;

#[cfg(unix)]
use super::test_support::canonical_in;
use super::test_support::{chosen_paths_in, TempDir};

#[test]
fn ダイアログを閉じたら何も返さない() {
    let record_dir = TempDir::new("dialog-normal-record");
    let chosen = chosen_paths_in(&record_dir);

    let accepted = accept_picked(&chosen, None).expect("閉じたことは失敗ではない");

    assert_eq!(accepted, None);
}

// 寄せる前と後で綴りが変わる入力を選ぶ。Linux の一時ディレクトリはそのままでは寄せても
// 綴りが変わらず、寄せずに返す実装でも通ってしまう。

#[cfg(unix)]
#[test]
fn ダイアログで選ぶと寄せた綴りが返る() {
    let dir = TempDir::new("dialog-normal");
    let record_dir = TempDir::new("dialog-normal-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("選ぶファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);

    let accepted =
        accept_picked(&chosen, Some(FilePath::Path(dir.join("./document.dcmp")))).expect("選べる");

    assert_eq!(accepted, Some(canonical_in(&dir, "document.dcmp")));
}

#[cfg(unix)]
#[test]
fn ダイアログで選ぶと寄せた綴りで照合を通る() {
    let dir = TempDir::new("dialog-normal");
    let record_dir = TempDir::new("dialog-normal-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("選ぶファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);

    accept_picked(&chosen, Some(FilePath::Path(dir.join("./document.dcmp")))).expect("選べる");

    assert!(chosen.require(&canonical_in(&dir, "document.dcmp")).is_ok());
}
