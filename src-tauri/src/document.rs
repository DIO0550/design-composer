//! ドキュメントのファイル操作。
//!
//! `docs/05-architecture.md`「Tauri IPC」の通り、Rust は .dcmp の構造を一切知らない。
//! ここを渡るのは常に生の JSON 文字列で、パース・検証・マイグレーションは TS 側が行う。
//! この前提は配下のモジュールすべてに掛かる。

pub mod io;
pub mod known_content;
pub mod watch;

// テストは対象と同じ階層に `{対象のファイル名}_{カテゴリ}_test.rs` で置く。
// カテゴリはテストの観点を表すラベル(rules/testing.md)。
#[cfg(test)]
mod test_support;

#[cfg(test)]
mod io_atomicity_test;
#[cfg(test)]
mod io_edge_test;
#[cfg(test)]
mod io_normal_test;
#[cfg(test)]
mod known_content_self_write_test;
#[cfg(test)]
mod watch_edge_test;
#[cfg(test)]
mod watch_normal_test;
