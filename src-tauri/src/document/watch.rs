//! 外部(AI・エディタ・git 操作等)によるファイル変更の検知。
//!
//! `docs/05-architecture.md`「外部編集の検知」の通り、変更を検知したら
//! `document-changed` イベントで JS 側へ通知する。

mod watchers;

use std::sync::Arc;

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use super::file_path::DocumentFilePath;
use super::io::{self, DocumentIoError};
use super::known_content::KnownContentRegistry;

pub use watchers::DocumentWatchers;

/// 外部変更を JS 側へ知らせるイベント名。
const DOCUMENT_CHANGED_EVENT: &str = "document-changed";

/// `document-changed` のペイロード。
///
/// 読み込んだ内容を同梱するのは、JS 側が `load_document` で読み直すまでの間に
/// 自アプリの保存が挟まると、#27 で防いだはずの自己ループが再発しうるため。
/// 外部変更と判定した内容と、配る内容を一致させる。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentChanged {
    path: String,
    content: String,
}

/// `path` の監視を開始し、外部変更を検知するたびに読み込んだ内容を `on_change` に渡す。
///
/// Tauri へのイベント発火を `watch_document` 側に残し、ここは「いつ・何を通知するか」だけを持つ。
pub fn start(
    watchers: &DocumentWatchers,
    known: Arc<KnownContentRegistry>,
    path: &DocumentFilePath,
    on_change: impl Fn(String) + Send + 'static,
) -> Result<(), DocumentIoError> {
    // 監視を始める前に現在の内容を把握しておく。これが無いと、監視開始直後に届く
    // 内容を変えないイベント(メタデータの更新など)を外部変更として通知してしまう。
    let content = io::load(path)?;
    known.record(path, &content);

    let watched = path.clone();
    watchers.watch(path, move || {
        let Some(content) = changed_content(&known, &watched) else {
            return;
        };
        on_change(content);
    })
}

/// `path` の現在の内容が、アプリの把握している内容と変わっていれば返す。
///
/// 返した内容は把握済みとして記録するので、OS が 1 回の書き込みに対して複数の
/// イベントを出しても通知は 1 回で済む。
pub fn changed_content(known: &KnownContentRegistry, path: &DocumentFilePath) -> Option<String> {
    // 読めないときに何も返さないのは、配れる内容が無いため(削除・置き換えの途中がこれに当たる)。
    // `docs/05-architecture.md`「外部編集の検知」は不正なファイルについて
    // 「最後に正常だった状態のレンダリングを保持する」としており、通知しないことが
    // その状態に一致する。削除そのものの扱いは仕様が定義していないため #27 の範囲外。
    let content = io::load(path).ok()?;
    if known.is_known(path, &content) {
        return None;
    }
    known.record(path, &content);
    Some(content)
}

/// webview から渡されたパスを検査し、通ったときだけ `start` で監視を始める。
///
/// 通知の `path` には検査を通ったパスの綴りを載せる。
///
/// @returns 検査を通らないときは `InvalidPath` を返し、監視を張らない
pub fn start_requested(
    watchers: &DocumentWatchers,
    known: Arc<KnownContentRegistry>,
    raw_path: &str,
    on_change: impl Fn(DocumentChanged) + Send + 'static,
) -> Result<(), DocumentIoError> {
    let path = DocumentFilePath::parse(raw_path)?;
    let notified_path = path.to_string_lossy().into_owned();

    start(watchers, known, &path, move |content| {
        on_change(DocumentChanged {
            path: notified_path.clone(),
            content,
        });
    })
}

/// webview から渡されたパスを検査し、通ったときだけ監視を止めて把握済みの内容を破棄する。
///
/// @returns 検査を通らないときは `InvalidPath` を返し、監視にも記録にも触れない
pub fn stop_requested(
    watchers: &DocumentWatchers,
    known: &KnownContentRegistry,
    raw_path: &str,
) -> Result<(), DocumentIoError> {
    let path = DocumentFilePath::parse(raw_path)?;
    watchers.unwatch(&path);
    // 記録も破棄する。監視を再開するときに現在の内容を読み直すので、監視していない間に
    // 起きた変更を「把握済み」として持ち越さないようにする。
    known.forget(&path);
    Ok(())
}

#[tauri::command]
pub fn watch_document(
    app: AppHandle,
    path: String,
    watchers: State<'_, DocumentWatchers>,
    known: State<'_, Arc<KnownContentRegistry>>,
) -> Result<(), DocumentIoError> {
    start_requested(&watchers, Arc::clone(&known), &path, move |payload| {
        // 発火に失敗しても伝える先が無い(失敗しているのが通知経路そのもの)。
        let _ = app.emit(DOCUMENT_CHANGED_EVENT, payload);
    })
}

#[tauri::command]
pub fn unwatch_document(
    path: String,
    watchers: State<'_, DocumentWatchers>,
    known: State<'_, Arc<KnownContentRegistry>>,
) -> Result<(), DocumentIoError> {
    stop_requested(&watchers, known.inner().as_ref(), &path)
}
