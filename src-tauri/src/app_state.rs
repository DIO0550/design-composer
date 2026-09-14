//! アプリ自身の状態のファイル操作。
//!
//! `docs/05-architecture.md`「アプリ自身の状態」の通り、Rust は中身の構造を一切知らない。
//! ここを渡るのは常に生の JSON 文字列で、解釈は TS 側が行う（`document` と同じ前提）。

pub mod io;

// テストは対象と同じ階層に `{対象のファイル名}_{カテゴリ}_test.rs` で置く。
// カテゴリはテストの観点を表すラベル(rules/testing.md)。
#[cfg(test)]
mod io_edge_test;
#[cfg(test)]
mod io_normal_test;
