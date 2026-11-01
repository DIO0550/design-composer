//! ウィンドウへ落とされたファイル。
//!
//! Tauri は `tauri://drag-drop` を webview へ配ってから、こちらのウィンドウイベントの
//! ハンドラを呼ぶ。webview がそれを聞いて開くと、選ばれた集合へ載せる前に `load_document`
//! が届きうるので、載せ終えてから独自のイベント(`document-dropped`)で知らせる。

use std::path::PathBuf;

use serde::Serialize;
use tauri::{DragDropEvent, Emitter, Manager, Runtime, Window, WindowEvent};

use super::chosen_paths::ChosenDocumentPaths;

/// 落とされたファイルを TS 側へ知らせるイベント名(TS 側の `DocumentDroppedEvent` と対)。
pub const DOCUMENT_DROPPED_EVENT: &str = "document-dropped";

/// `document-dropped` のペイロード。
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DocumentDropped {
    paths: Vec<String>,
}

/// 落とされたパスを選ばれた集合へ載せ、知らせる並びを作る。
///
/// @param dropped 落とされたパスの並び
/// @returns 載せたものは寄せた綴りで、載せられなかったものは落とされた綴りのまま、落とされた
/// 順に並べたもの。UTF-8 で表せないパスは並びから落とす
pub fn accept_dropped(chosen: &ChosenDocumentPaths, dropped: &[PathBuf]) -> DocumentDropped {
    let paths = dropped
        .iter()
        .filter_map(|path| path.to_str())
        // 載せられなかったものも知らせに残すのは、TS が開こうとして「パスが正しくありません」を
        // 出せるようにするため。並びから落とすと、落としたのに何も起きない。
        .map(|raw| chosen.choose(raw).unwrap_or_else(|_| raw.to_string()))
        .collect();
    DocumentDropped { paths }
}

/// ウィンドウへのドロップを受けて、選ばれた集合へ載せてから `document-dropped` を出す。
pub fn on_window_event<R: Runtime>(window: &Window<R>, event: &WindowEvent) {
    let WindowEvent::DragDrop(DragDropEvent::Drop { paths, .. }) = event else {
        return;
    };
    let dropped = accept_dropped(window.state::<ChosenDocumentPaths>().inner(), paths);
    // 落とされたウィンドウにだけ知らせる。発火に失敗しても伝える先が無い(失敗しているのが
    // 通知経路そのもの)。
    let _ = window.emit_to(window.label(), DOCUMENT_DROPPED_EVENT, dropped);
}
