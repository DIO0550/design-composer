import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{n,t as r}from"./Option-CO7Q4TcL.js";import{n as i,t as a}from"./screen-height-shell-B8lrQqp6.js";import{n as o,t as s}from"./file-paths-yodTPgjW.js";import{c,i as l,n as u,r as d,s as f,t as p}from"./document-start-BRx0IiPf.js";import{r as m,t as h}from"./document-access-failure-BXM7MoH0.js";var g,_,v,y,b,x,S,C,w,T,E,D;e((()=>{i(),o(),m(),c(),l(),n(),u(),g=t(),_={openDocument:()=>{},createDocument:()=>{},openDocumentsAt:()=>{}},v=[s(`/work/settings-ui/app.dcmp`),s(`/work/shop/app.dcmp`),s(`/work/design-system/tokens.dcmp`)],y={title:`features/editor/features/document-start/DocumentStart`,component:p,parameters:{layout:`fullscreen`},args:{attempt:f.Idle,actions:_,recentPaths:[],recentFilesFailure:r.none,commandFailure:r.none,renderErrors:()=>null},decorators:[e=>(0,g.jsx)(a,{children:(0,g.jsx)(e,{})})]},b={name:`開始画面`},x={name:`最近使ったファイルがある`,args:{recentPaths:v}},S={name:`読み込み中`,args:{attempt:f.Opening}},C={name:`開けなかった`,args:{attempt:f.failed({kind:`io`,error:h.create(`missing`,`/work/settings-ui/app.dcmp`)})}},w={name:`このアプリで選ばれていない`,args:{recentPaths:v,attempt:f.failed({kind:`io`,error:h.create(`unchosen`,`/work/settings-ui/app.dcmp: このアプリで選ばれていない`)})}},T={name:`最近使ったファイルを読み込めない`,args:{recentFilesFailure:r.some(`app-state.json: 読み込みが拒まれた`)}},E={name:`メニューを受け取れない`,args:{commandFailure:r.some({source:d.Menu,message:`listen が失敗した`})}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "開始画面"
}`,...b.parameters?.docs?.source},description:{story:`何も開いていない状態。最近使ったファイルがまだ 1 件も無い。`,...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "最近使ったファイルがある",
  args: {
    recentPaths: RecentPaths
  }
}`,...x.parameters?.docs?.source},description:{story:`最近使ったファイルが並んでいる状態。同名のファイルはフォルダ名で見分ける。`,...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "読み込み中",
  args: {
    attempt: OpenAttempt.Opening
  }
}`,...S.parameters?.docs?.source},description:{story:`選んだファイルを読み込んでいる間。開く / 新規作成は押せない。`,...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "開けなかった",
  args: {
    attempt: OpenAttempt.failed({
      kind: "io",
      error: DocumentAccessFailure.create("missing", "/work/settings-ui/app.dcmp")
    })
  }
}`,...C.parameters?.docs?.source},description:{story:`開こうとしたファイルが読めなかった状態。`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "このアプリで選ばれていない",
  args: {
    recentPaths: RecentPaths,
    attempt: OpenAttempt.failed({
      kind: "io",
      error: DocumentAccessFailure.create("unchosen", "/work/settings-ui/app.dcmp: このアプリで選ばれていない")
    })
  }
}`,...w.parameters?.docs?.source},description:{story:`最近使ったファイルから、このアプリで選ばれていないファイルを開こうとした状態。`,...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "最近使ったファイルを読み込めない",
  args: {
    recentFilesFailure: Option.some("app-state.json: 読み込みが拒まれた")
  }
}`,...T.parameters?.docs?.source},description:{story:`保存されている最近使ったファイルを読み取れなかった状態。`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "メニューを受け取れない",
  args: {
    commandFailure: Option.some({
      source: CommandSources.Menu,
      message: "listen が失敗した"
    })
  }
}`,...E.parameters?.docs?.source},description:{story:`メニューの購読を張れなかった状態（Tauri 側と版がずれたときなど）。`,...E.parameters?.docs?.description}}},D=[`Default`,`WithRecentDocuments`,`Opening`,`OpenFailed`,`OpenUnchosen`,`RecentFilesUnreadable`,`EntryUnavailable`]}))();export{b as Default,E as EntryUnavailable,C as OpenFailed,w as OpenUnchosen,S as Opening,T as RecentFilesUnreadable,x as WithRecentDocuments,D as __namedExportsOrder,y as default};