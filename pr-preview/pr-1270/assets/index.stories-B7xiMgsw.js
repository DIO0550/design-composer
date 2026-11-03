import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{n,t as r}from"./Option-CO7Q4TcL.js";import{n as i,t as a}from"./screen-height-shell-B8lrQqp6.js";import{n as o,t as s}from"./file-paths-yodTPgjW.js";import{a as c,i as l,o as u,r as d,s as f}from"./shown-shortcut-CMuVBlyr.js";import{c as p,i as m,n as h,r as g,s as _,t as v}from"./document-start-DZnriv-z.js";import{r as y,t as b}from"./document-access-failure-BXM7MoH0.js";var x,S,C,w,T,E,D,O,k,A,j,M,N;e((()=>{i(),o(),y(),p(),m(),f(),c(),n(),h(),x=t(),S={openDocument:()=>{},createDocument:()=>{},openDocumentsAt:()=>{}},C=[s(`/work/settings-ui/app.dcmp`),s(`/work/shop/app.dcmp`),s(`/work/design-system/tokens.dcmp`)],w={title:`features/editor/features/document-start/DocumentStart`,component:v,parameters:{layout:`fullscreen`},args:{attempt:_.Idle,actions:S,recentPaths:[],recentFilesFailure:r.none,commandFailure:r.none,renderErrors:()=>null,operatingSystem:u.fromNavigator(d)},decorators:[e=>(0,x.jsx)(a,{children:(0,x.jsx)(e,{})})]},T={name:`開始画面`},E={name:`Windows で動いている`,args:{operatingSystem:u.fromNavigator(l)}},D={name:`最近使ったファイルがある`,args:{recentPaths:C}},O={name:`読み込み中`,args:{attempt:_.Opening}},k={name:`開けなかった`,args:{attempt:_.failed({kind:`io`,error:b.create(`missing`,`/work/settings-ui/app.dcmp`)})}},A={name:`このアプリで選ばれていない`,args:{recentPaths:C,attempt:_.failed({kind:`io`,error:b.create(`unchosen`,`/work/settings-ui/app.dcmp: このアプリで選ばれていない`)})}},j={name:`最近使ったファイルを読み込めない`,args:{recentFilesFailure:r.some(`app-state.json: 読み込みが拒まれた`)}},M={name:`メニューを受け取れない`,args:{commandFailure:r.some({source:g.Menu,message:`listen が失敗した`})}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "開始画面"
}`,...T.parameters?.docs?.source},description:{story:`何も開いていない状態。最近使ったファイルがまだ 1 件も無い。`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "Windows で動いている",
  args: {
    operatingSystem: OperatingSystem.fromNavigator(WindowsNavigatorPlatform)
  }
}`,...E.parameters?.docs?.source},description:{story:`Windows で動いている状態。割り当ては Ctrl 側の綴りで出る。`,...E.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "最近使ったファイルがある",
  args: {
    recentPaths: RecentPaths
  }
}`,...D.parameters?.docs?.source},description:{story:`最近使ったファイルが並んでいる状態。同名のファイルはフォルダ名で見分ける。`,...D.parameters?.docs?.description}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "読み込み中",
  args: {
    attempt: OpenAttempt.Opening
  }
}`,...O.parameters?.docs?.source},description:{story:`選んだファイルを読み込んでいる間。開く / 新規作成は押せない。`,...O.parameters?.docs?.description}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "開けなかった",
  args: {
    attempt: OpenAttempt.failed({
      kind: "io",
      error: DocumentAccessFailure.create("missing", "/work/settings-ui/app.dcmp")
    })
  }
}`,...k.parameters?.docs?.source},description:{story:`開こうとしたファイルが読めなかった状態。`,...k.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "このアプリで選ばれていない",
  args: {
    recentPaths: RecentPaths,
    attempt: OpenAttempt.failed({
      kind: "io",
      error: DocumentAccessFailure.create("unchosen", "/work/settings-ui/app.dcmp: このアプリで選ばれていない")
    })
  }
}`,...A.parameters?.docs?.source},description:{story:`最近使ったファイルから、このアプリで選ばれていないファイルを開こうとした状態。`,...A.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "最近使ったファイルを読み込めない",
  args: {
    recentFilesFailure: Option.some("app-state.json: 読み込みが拒まれた")
  }
}`,...j.parameters?.docs?.source},description:{story:`保存されている最近使ったファイルを読み取れなかった状態。`,...j.parameters?.docs?.description}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "メニューを受け取れない",
  args: {
    commandFailure: Option.some({
      source: CommandSources.Menu,
      message: "listen が失敗した"
    })
  }
}`,...M.parameters?.docs?.source},description:{story:`メニューの購読を張れなかった状態（Tauri 側と版がずれたときなど）。`,...M.parameters?.docs?.description}}},N=[`Default`,`OnWindows`,`WithRecentDocuments`,`Opening`,`OpenFailed`,`OpenUnchosen`,`RecentFilesUnreadable`,`EntryUnavailable`]}))();export{T as Default,M as EntryUnavailable,E as OnWindows,k as OpenFailed,A as OpenUnchosen,O as Opening,j as RecentFilesUnreadable,D as WithRecentDocuments,N as __namedExportsOrder,w as default};