use std::fs;

use super::io;
use crate::test_support::TempDir;

#[test]
fn まだ保存していなければ中身が無いことになる() {
    let dir = TempDir::new("app-state-edge");

    assert_eq!(
        io::load(&dir.join("app-state.json")).expect("読み込みに成功する"),
        None
    );
}

#[test]
fn ディレクトリを指して読み込むと失敗する() {
    let dir = TempDir::new("app-state-edge");

    let error = io::load(dir.path()).expect_err("読み込みに失敗する");

    assert!(error.message().contains(&dir.path().display().to_string()));
}

#[test]
fn 中身がutf8として読めなければ失敗する() {
    let dir = TempDir::new("app-state-edge");
    let path = dir.join("app-state.json");
    fs::write(&path, [0xff, 0xfe]).expect("バイト列を書ける");

    let error = io::load(&path).expect_err("読み込みに失敗する");

    assert!(error.message().contains("UTF-8"));
}
