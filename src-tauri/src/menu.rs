//! アプリのメニュー。
//!
//! ドキュメントを開く / 作る導線は画面の帯ではなく OS のメニューに置く（#374）。
//! UI 案（`docs/Design Composer.html`）が描く上端の帯は、開く / 新規作成のボタンを
//! 持たないため。
//!
//! Rust が知っているのは「どの項目が選ばれたか」までで、開く / 作る手順は TS 側が持つ
//! （`docs/05-architecture.md`「Tauri IPC」の通り、Rust は .dcmp の構造を知らない）。

use tauri::menu::{Menu, MenuBuilder, MenuEvent, MenuItemBuilder, SubmenuBuilder};
use tauri::{AppHandle, Emitter, Runtime};

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

/// メニューの項目の id を、TS 側へ流す指示として読む。
///
/// # Arguments
/// * `id` - 選ばれた項目の id
///
/// # Returns
/// TS 側の語彙（`AppMenuCommands`）にある指示。こちらが足した項目でなければ `None`
/// （閉じる・コピー等の既定の項目は Tauri 自身が処理するので流さない）
fn command_of(id: &str) -> Option<&'static str> {
    match id {
        OPEN_ITEM_ID => Some(OPEN_ITEM_ID),
        CREATE_ITEM_ID => Some(CREATE_ITEM_ID),
        _ => None,
    }
}

/// アプリのメニューを組み立てる。
///
/// 既定のメニュー（`Menu::default`）へ差し込むのではなく全体を組むのは、既定の
/// `File` サブメニューが macOS と Windows にしか無く（Linux では作られない）、
/// 差し込む位置がプラットフォームで変わるため。編集メニューを残すのは、macOS では
/// コピー & ペーストのキー操作がメニュー項目に紐づいており、無いと効かなくなるため。
///
/// # Arguments
/// * `app` - メニューを組み立てる相手
///
/// # Returns
/// ファイル / 編集 / ウィンドウを並べたメニュー
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

    let file = SubmenuBuilder::new(app, "ファイル")
        .item(&open)
        .item(&create)
        .separator()
        .close_window();
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

/// 選ばれた項目を TS 側へ流す。
///
/// 届け先を絞らないのは、ウィンドウが 1 つしか無いため（複数のドキュメントを同時に
/// 開くのは #375 でスコープ外）。
///
/// # Arguments
/// * `app` - イベントを流す相手
/// * `event` - 選ばれた項目
pub fn emit_command<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    let Some(command) = command_of(event.id().as_ref()) else {
        return;
    };
    // 流せなかったことを伝える相手がいない（メニューの選択に返り値は無い）ので捨てる。
    let _ = app.emit(MENU_COMMAND_EVENT, command);
}
