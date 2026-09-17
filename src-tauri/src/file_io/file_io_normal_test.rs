use super::{read_optional_text, write_text};
use crate::test_support::TempDir;

#[test]
fn 書き出した内容がそのまま読み込める() {
    let dir = TempDir::new("file-io-normal");
    let path = dir.join("app-state.json");
    let content = r#"{"recentPaths":["/work/login.dcmp"]}"#;

    write_text(&path, content).expect("書き出しに成功する");

    assert_eq!(
        read_optional_text(&path).expect("読み込みに成功する"),
        Some(content.to_string())
    );
}

#[test]
fn 既存のファイルへ書き出すと内容が置き換わる() {
    let dir = TempDir::new("file-io-normal");
    let path = dir.join("app-state.json");

    write_text(&path, r#"{"recentPaths":[]}"#).expect("初回の書き出しに成功する");
    write_text(&path, r#"{"recentPaths":["/work/login.dcmp"]}"#)
        .expect("上書きの書き出しに成功する");

    assert_eq!(
        read_optional_text(&path).expect("読み込みに成功する"),
        Some(r#"{"recentPaths":["/work/login.dcmp"]}"#.to_string())
    );
}

#[test]
fn 親ディレクトリが無くても書き出すと作られる() {
    let dir = TempDir::new("file-io-normal");
    let path = dir.join("config").join("app-state.json");

    write_text(&path, r#"{"recentPaths":[]}"#).expect("書き出しに成功する");

    assert_eq!(
        read_optional_text(&path).expect("読み込みに成功する"),
        Some(r#"{"recentPaths":[]}"#.to_string())
    );
}
