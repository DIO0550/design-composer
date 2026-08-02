//! ドキュメントのファイル操作。
//!
//! `docs/05-architecture.md`「Tauri IPC」の通り、Rust は .dcmp の構造を一切知らない。
//! ここを渡るのは常に生の JSON 文字列で、パース・検証・マイグレーションは TS 側が行う。
//! この前提は配下のモジュールすべてに掛かる。

pub mod io;
pub mod known_content;
pub mod watch;
