//! メニューの項目の id を、それを受けて何をするかとして読めること。
//!
//! メニューそのものは OS が描くので、組み立ての結果はここでは見られない。
//! TS 側の語彙（`src/libs/app-menu/index.ts` の `AppMenuCommands`）と綴りが
//! 揃っていることは、この対応表と向こうのテストの両方で押さえる。

use super::{action_of, MenuAction, MENU_COMMAND_EVENT};

#[test]
fn 開くの項目は開く指示になる() {
    assert_eq!(action_of("open"), MenuAction::Emit("open"));
}

#[test]
fn 新規作成の項目は作る指示になる() {
    assert_eq!(action_of("create"), MenuAction::Emit("create"));
}

#[test]
fn タブを閉じるの項目は閉じる指示になる() {
    assert_eq!(action_of("close-tab"), MenuAction::Emit("close-tab"));
}

#[test]
fn ウィンドウを閉じるの項目は指示を流さずにウィンドウを閉じる() {
    assert_eq!(action_of("close-window"), MenuAction::CloseWindow);
}

#[test]
fn 既定の項目は何もしない() {
    assert_eq!(action_of("quit"), MenuAction::Ignore);
}

#[test]
fn イベント名はTS側と揃っている() {
    assert_eq!(MENU_COMMAND_EVENT, "document-menu");
}
