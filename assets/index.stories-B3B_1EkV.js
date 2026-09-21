import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-CPpfsGoD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./screen-height-shell-5_3soQ9J.js";import{c as o,i as s,n as c,r as l,s as u,t as d}from"./document-start-BUkdXYLv.js";import{r as f,t as p}from"./document-access-failure-jQC-tVkl.js";var m,h,g,_,v,y,b,x,S,C,w;e((()=>{i(),f(),o(),s(),t(),c(),m=r(),h={openDocument:()=>{},createDocument:()=>{},openDocumentsAt:()=>{}},g=[`/work/settings-ui/app.dcmp`,`/work/shop/app.dcmp`,`/work/design-system/tokens.dcmp`],_={title:`features/editor/features/document-start/DocumentStart`,component:d,parameters:{layout:`fullscreen`},args:{attempt:u.Idle,actions:h,recentPaths:[],recentFilesFailure:n.none,commandFailure:n.none,renderErrors:()=>null},decorators:[e=>(0,m.jsx)(a,{children:(0,m.jsx)(e,{})})]},v={name:`開始画面`},y={name:`最近使ったファイルがある`,args:{recentPaths:g}},b={name:`読み込み中`,args:{attempt:u.Opening}},x={name:`開けなかった`,args:{attempt:u.failed({kind:`io`,error:p.create(`missing`,`/work/settings-ui/app.dcmp`)})}},S={name:`最近使ったファイルを読み込めない`,args:{recentFilesFailure:n.some(`app-state.json: 読み込みが拒まれた`)}},C={name:`メニューを受け取れない`,args:{commandFailure:n.some({source:l.Menu,message:`listen が失敗した`})}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "開始画面"
}`,...v.parameters?.docs?.source},description:{story:`何も開いていない状態。最近使ったファイルがまだ 1 件も無い。`,...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "最近使ったファイルがある",
  args: {
    recentPaths: RecentPaths
  }
}`,...y.parameters?.docs?.source},description:{story:`最近使ったファイルが並んでいる状態。同名のファイルはフォルダ名で見分ける。`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "読み込み中",
  args: {
    attempt: OpenAttempt.Opening
  }
}`,...b.parameters?.docs?.source},description:{story:`選んだファイルを読み込んでいる間。開く / 新規作成は押せない。`,...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "開けなかった",
  args: {
    attempt: OpenAttempt.failed({
      kind: "io",
      error: DocumentAccessFailure.create("missing", "/work/settings-ui/app.dcmp")
    })
  }
}`,...x.parameters?.docs?.source},description:{story:`開こうとしたファイルが読めなかった状態。`,...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "最近使ったファイルを読み込めない",
  args: {
    recentFilesFailure: Option.some("app-state.json: 読み込みが拒まれた")
  }
}`,...S.parameters?.docs?.source},description:{story:`保存されている最近使ったファイルを読み取れなかった状態。`,...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "メニューを受け取れない",
  args: {
    commandFailure: Option.some({
      source: CommandSources.Menu,
      message: "listen が失敗した"
    })
  }
}`,...C.parameters?.docs?.source},description:{story:`メニューの購読を張れなかった状態（Tauri 側と版がずれたときなど）。`,...C.parameters?.docs?.description}}},w=[`Default`,`WithRecentDocuments`,`Opening`,`OpenFailed`,`RecentFilesUnreadable`,`EntryUnavailable`]}))();export{v as Default,C as EntryUnavailable,x as OpenFailed,b as Opening,S as RecentFilesUnreadable,y as WithRecentDocuments,w as __namedExportsOrder,_ as default};