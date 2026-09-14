//! アプリ自身の状態のファイル操作。
//!
//! `docs/05-architecture.md`「アプリ自身の状態」の通り、Rust は中身の構造を一切知らない。
//! ここを渡るのは常に生の JSON 文字列で、解釈は TS 側が行う（`document` と同じ前提）。
//!
//! Tauri の管理状態（`.manage()` / `tauri::State`）とは別物で、こちらは設定ディレクトリの
//! ファイルに残る状態を指す。

pub mod io;

#[cfg(test)]
mod io_edge_test;
#[cfg(test)]
mod io_normal_test;
