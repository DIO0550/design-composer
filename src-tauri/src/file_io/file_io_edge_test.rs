use std::ffi::OsStr;
use std::fs;
use std::io;

use super::{read_optional_text, write_atomic};
use crate::test_support::TempDir;

#[test]
fn まだ書き出していなければ中身が無いことになる() {
    let dir = TempDir::new("file-io-edge");

    assert_eq!(
        read_optional_text(&dir.join("app-state.json")).expect("読み込みに成功する"),
        None
    );
}

#[test]
fn ディレクトリを指して読み込むと失敗する() {
    let dir = TempDir::new("file-io-edge");

    let error = read_optional_text(dir.path()).expect_err("読み込みに失敗する");

    assert!(error.message().contains(&dir.path().display().to_string()));
}

#[test]
fn 中身がutf8として読めなければ失敗する() {
    let dir = TempDir::new("file-io-edge");
    let path = dir.join("app-state.json");
    fs::write(&path, [0xff, 0xfe]).expect("バイト列を書ける");

    let error = read_optional_text(&path).expect_err("読み込みに失敗する");

    assert!(error.message().contains("UTF-8"));
}

#[test]
fn ファイル名に区切りを含むと書き込まずに失敗する() {
    let dir = TempDir::new("file-io-edge");

    let error = write_atomic(dir.path(), OsStr::new("../escaped.txt"), "content")
        .expect_err("書き込みに失敗する");

    assert_eq!(error.kind(), io::ErrorKind::InvalidInput);
}

#[test]
fn ファイル名が絶対パスだと書き込まずに失敗する() {
    let dir = TempDir::new("file-io-edge");
    let directory = dir.join("documents");
    fs::create_dir(&directory).expect("サブディレクトリを作れる");
    let absolute = dir.join("escaped.txt");

    let error =
        write_atomic(&directory, absolute.as_os_str(), "content").expect_err("書き込みに失敗する");

    assert_eq!(error.kind(), io::ErrorKind::InvalidInput);
}

#[test]
fn ファイル名がディレクトリの外を指すと中にも外にも何も書かない() {
    let dir = TempDir::new("file-io-edge");
    let directory = dir.join("documents");
    fs::create_dir(&directory).expect("サブディレクトリを作れる");

    // 先頭の `./` は、確認が無ければ一時ファイルも外に作れて書き込みまで通ってしまう綴りにするため。
    let _ = write_atomic(&directory, OsStr::new("./../escaped.txt"), "content");

    assert_eq!(dir.file_names(), vec!["documents".to_string()]);
    assert_eq!(
        fs::read_dir(&directory)
            .expect("サブディレクトリを読める")
            .count(),
        0
    );
}
