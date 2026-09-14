use std::path::Path;

use super::io;
use crate::test_support::TempDir;

#[test]
fn 保存した内容がそのまま読み込める() {
    let dir = TempDir::new("app-state-normal");
    let path = dir.join("app-state.json");
    let content = r#"{"recentPaths":["/work/login.dcmp"]}"#;

    io::save(&path, content).expect("保存に成功する");

    assert_eq!(
        io::load(&path).expect("読み込みに成功する"),
        Some(content.to_string())
    );
}

#[test]
fn 既存のファイルへ保存すると内容が置き換わる() {
    let dir = TempDir::new("app-state-normal");
    let path = dir.join("app-state.json");

    io::save(&path, r#"{"recentPaths":[]}"#).expect("初回の保存に成功する");
    io::save(&path, r#"{"recentPaths":["/work/login.dcmp"]}"#).expect("上書きの保存に成功する");

    assert_eq!(
        io::load(&path).expect("読み込みに成功する"),
        Some(r#"{"recentPaths":["/work/login.dcmp"]}"#.to_string())
    );
}

#[test]
fn 置き場のディレクトリが無くても保存すると作られる() {
    let dir = TempDir::new("app-state-normal");
    let path = dir.join("config").join("app-state.json");

    io::save(&path, r#"{"recentPaths":[]}"#).expect("保存に成功する");

    assert_eq!(
        io::load(&path).expect("読み込みに成功する"),
        Some(r#"{"recentPaths":[]}"#.to_string())
    );
}

#[test]
fn 設定ディレクトリの下が置き場になる() {
    assert_eq!(
        io::state_path(Path::new("/config/design-composer")),
        Path::new("/config/design-composer/app-state.json")
    );
}
