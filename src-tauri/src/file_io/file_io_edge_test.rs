use std::fs;

use super::read_optional_text;
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
