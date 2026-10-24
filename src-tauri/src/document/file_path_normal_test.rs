//! ドキュメントのパスとして受け付けるもの。

// テスト名は rules/testing.md に従い仕様の文として書き、このリポジトリの既存のテストに
// 合わせて日本語で書く。
// DCMP のようなラテン文字を含むと snake case ではなくなるため、この lint は無効にする。
#![allow(non_snake_case)]

use std::path::Path;

use super::file_path::DocumentFilePath;

#[cfg(unix)]
#[test]
fn 拡張子がdcmpの絶対パスは受け付けられる() {
    let result = DocumentFilePath::parse("/a/b.dcmp");

    assert!(result.is_ok());
}

#[cfg(unix)]
#[test]
fn 拡張子が大文字のDCMPでも受け付けられる() {
    let result = DocumentFilePath::parse("/a/b.DCMP");

    assert!(result.is_ok());
}

#[cfg(unix)]
#[test]
fn 名前にドット2つを含むだけの要素は親ディレクトリへの移動ではないので受け付けられる() {
    let result = DocumentFilePath::parse("/a/..b.dcmp");

    assert!(result.is_ok());
}

#[cfg(unix)]
#[test]
fn 受け付けたパスは渡された綴りのまま保たれる() {
    let path = DocumentFilePath::parse("/a/./b.dcmp").expect("受け付けられる");

    assert_eq!(path.as_os_str(), Path::new("/a/./b.dcmp").as_os_str());
}
