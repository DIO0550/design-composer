//! アプリのメニュー。
//!
//! ドキュメントを開く / 作る導線は画面の帯ではなく OS のメニューに置く（#374）。
//! UI 案（`docs/Design Composer.html`）が描く上端の帯は、開く / 新規作成のボタンを
//! 持たないため。見ているタブを閉じる（⌘W）もここに置く。⌘W は macOS では既定の
//! 「ウィンドウを閉じる」が持っていた割り当てで、ページの `keydown` で横取りできるかに
//! 頼ると、外れたときにウィンドウごと閉じる。
//!
//! Rust が知っているのは「どの項目が選ばれたか」までで、開く / 作る / タブを閉じる手順は
//! TS 側が持つ（`docs/05-architecture.md`「Tauri IPC」の通り、Rust は .dcmp の構造を
//! 知らない）。

use tauri::menu::{Menu, MenuBuilder, MenuEvent, MenuItemBuilder, SubmenuBuilder};
use tauri::{AppHandle, Emitter, Manager, Runtime};

// テストは対象と同じ階層に `{対象のファイル名}_{カテゴリ}_test.rs` で置く。
#[cfg(test)]
mod menu_normal_test;

/// 選ばれた項目を TS 側へ知らせるイベント名（TS 側の `MenuCommandEvent` と対）。
pub const MENU_COMMAND_EVENT: &str = "document-menu";

/// 「開く」の項目の id。イベントで流す指示の綴りをそのまま id にしている
/// （対応表を 2 つ持つと、片方だけ直せる状態ができる）。
const OPEN_ITEM_ID: &str = "open";
/// 「新規作成」の項目の id。
const CREATE_ITEM_ID: &str = "create";
/// 「タブを閉じる」の項目の id。
const CLOSE_TAB_ITEM_ID: &str = "close-tab";
/// 「ウィンドウを閉じる」の項目の id。TS 側へは流さず、ここで閉じる。
const CLOSE_WINDOW_ITEM_ID: &str = "close-window";

/// 選ばれた項目を受けて何をするか。
#[derive(Debug, PartialEq, Eq)]
enum MenuAction {
    /// TS 側の語彙（`AppMenuCommands`）にある指示として流す。
    Emit(&'static str),
    /// ウィンドウを閉じる。
    CloseWindow,
    /// 何もしない。コピー等の既定の項目は Tauri 自身が処理する。
    Ignore,
}

/// メニューの項目の id を、それを受けて何をするかとして読む。
///
/// # Arguments
/// * `id` - 選ばれた項目の id
///
/// # Returns
/// 開く / 新規作成 / タブを閉じるなら TS 側へ流す指示、ウィンドウを閉じるならそれ。
/// こちらが足した項目でなければ `Ignore`
fn action_of(id: &str) -> MenuAction {
    match id {
        OPEN_ITEM_ID => MenuAction::Emit(OPEN_ITEM_ID),
        CREATE_ITEM_ID => MenuAction::Emit(CREATE_ITEM_ID),
        CLOSE_TAB_ITEM_ID => MenuAction::Emit(CLOSE_TAB_ITEM_ID),
        CLOSE_WINDOW_ITEM_ID => MenuAction::CloseWindow,
        _ => MenuAction::Ignore,
    }
}

/// アプリのメニューを組み立てる。
///
/// 既定のメニュー（`Menu::default`）へ差し込むのではなく全体を組むのは、既定の
/// `File` サブメニューが macOS と Windows にしか無く（Linux では作られない）、
/// 差し込む位置がプラットフォームで変わるため。編集メニューを残すのは、macOS では
/// コピー & ペーストのキー操作がメニュー項目に紐づいており、無いと効かなくなるため。
///
/// 「ウィンドウを閉じる」を既定の項目（`close_window`）にしないのは、既定の項目の
/// 割り当ては変えられず、macOS では ⌘W を「タブを閉じる」と取り合うため。
///
/// # Arguments
/// * `app` - メニューを組み立てる相手
///
/// # Returns
/// ファイル（開く / 新規作成 / タブを閉じる / ウィンドウを閉じる）/ 編集 / ウィンドウを
/// 並べたメニュー
///
/// # Errors
/// 項目を作れなかったとき（OS 側がメニューを作れない場合）
pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let open = MenuItemBuilder::with_id(OPEN_ITEM_ID, "開く…")
        .accelerator("CmdOrCtrl+O")
        .build(app)?;
    let create = MenuItemBuilder::with_id(CREATE_ITEM_ID, "新規作成…")
        .accelerator("CmdOrCtrl+N")
        .build(app)?;
    let close_tab = MenuItemBuilder::with_id(CLOSE_TAB_ITEM_ID, "タブを閉じる")
        .accelerator("CmdOrCtrl+W")
        .build(app)?;
    let close_window = MenuItemBuilder::with_id(CLOSE_WINDOW_ITEM_ID, "ウィンドウを閉じる")
        .accelerator("Shift+CmdOrCtrl+W")
        .build(app)?;

    let file = SubmenuBuilder::new(app, "ファイル")
        .item(&open)
        .item(&create)
        .separator()
        .item(&close_tab)
        .item(&close_window);
    // macOS の「終了」はアプリ名のメニューに置くのが作法なので、そちらへ回す。
    #[cfg(not(target_os = "macos"))]
    let file = file.quit();
    let file = file.build()?;

    let edit = SubmenuBuilder::new(app, "編集")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;

    let window = SubmenuBuilder::new(app, "ウィンドウ")
        .minimize()
        .maximize()
        .build()?;

    let menu = MenuBuilder::new(app);
    #[cfg(target_os = "macos")]
    let menu = {
        use tauri::Manager;

        let app_menu = SubmenuBuilder::new(app, app.package_info().name.clone())
            .about(None)
            .separator()
            .services()
            .separator()
            .hide()
            .hide_others()
            .separator()
            .quit()
            .build()?;
        menu.item(&app_menu)
    };

    menu.item(&file).item(&edit).item(&window).build()
}

/// 選ばれた項目を実行する。TS 側の指示なら流し、ウィンドウを閉じるならここで閉じる。
///
/// 届け先を絞らないのは、ウィンドウが 1 つしか無いため（複数のドキュメントは 1 つの
/// ウィンドウの中のタブで開く）。
///
/// # Arguments
/// * `app` - イベントを流す相手
/// * `event` - 選ばれた項目
pub fn run_item<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    // どちらも失敗を伝える相手がいない（メニューの選択に返り値は無い）ので捨てる。
    match action_of(event.id().as_ref()) {
        MenuAction::Emit(command) => {
            let _ = app.emit(MENU_COMMAND_EVENT, command);
        }
        // 閉じるのは前面のウィンドウ（既定の `close_window` と同じ）。ラベルで引くと、
        // 設定でラベルを付け直したときに黙って何も閉じなくなる。
        MenuAction::CloseWindow => {
            // フォーカスを尋ねられなかった窓は、前面かどうかが分からないので閉じない。
            let focused = app
                .webview_windows()
                .into_values()
                .find(|window| window.is_focused().unwrap_or(false));
            if let Some(window) = focused {
                let _ = window.close();
            }
        }
        MenuAction::Ignore => {}
    }
}
