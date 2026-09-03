//! メニューの項目の id を、TS 側へ流す指示として読めること。
//!
//! メニューそのものは OS が描くので、組み立ての結果はここでは見られない。
//! TS 側の語彙（`src/libs/app-menu/index.ts` の `AppMenuCommands`）と綴りが
//! 揃っていることは、この対応表と向こうのテストの両方で押さえる。

use super::{command_of, MENU_COMMAND_EVENT};

#[test]
fn 開くの項目は開く指示になる() {
    assert_eq!(command_of("open"), Some("open"));
}

#[test]
fn 新規作成の項目は作る指示になる() {
    assert_eq!(command_of("create"), Some("create"));
}

#[test]
fn 既定の項目は指示にならない() {
    assert_eq!(command_of("quit"), None);
}

#[test]
fn イベント名はTS側と揃っている() {
    assert_eq!(MENU_COMMAND_EVENT, "document-menu");
}
