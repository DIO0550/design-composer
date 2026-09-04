import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./Option-CTa-i89e.js";import{n as i,t as a}from"./screen-height-shell-DJmJ8YA6.js";import{a as o,s}from"./opened-document-Ipgxh8LX.js";import{i as c,n as l,r as u,t as d}from"./document-start-Cis5T_rR.js";var f,p,m,h,g,_,v,y,b,x;e((()=>{i(),s(),c(),n(),l(),f=t(),p={openDocument:()=>{},createDocument:()=>{},openDocumentAt:()=>{}},m=[`/work/settings-ui/app.dcmp`,`/work/shop/app.dcmp`,`/work/design-system/tokens.dcmp`],h={title:`features/documentStart/DocumentStart`,component:d,parameters:{layout:`fullscreen`},args:{session:{kind:`closed`},actions:p,recentPaths:[],commandFailure:r.none,renderErrors:()=>null},decorators:[e=>(0,f.jsx)(a,{children:(0,f.jsx)(e,{})})]},g={name:`開始画面`},_={name:`最近使ったファイルがある`,args:{recentPaths:m}},v={name:`読み込み中`,args:{session:{kind:`opening`}}},y={name:`開けなかった`,args:{session:{kind:`failed`,failure:{kind:`io`,error:o.create(`missing`,`/work/settings-ui/app.dcmp`)}}}},b={name:`メニューを受け取れない`,args:{commandFailure:r.some({source:u.Menu,message:`listen が失敗した`})}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "開始画面"
}`,...g.parameters?.docs?.source},description:{story:`何も開いていない状態。最近使ったファイルがまだ 1 件も無い。`,...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "最近使ったファイルがある",
  args: {
    recentPaths: RecentPaths
  }
}`,..._.parameters?.docs?.source},description:{story:`最近使ったファイルが並んでいる状態。同名のファイルはフォルダ名で見分ける。`,..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "読み込み中",
  args: {
    session: {
      kind: "opening"
    }
  }
}`,...v.parameters?.docs?.source},description:{story:`選んだファイルを読み込んでいる間。開く / 新規作成は押せない。`,...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "開けなかった",
  args: {
    session: {
      kind: "failed",
      failure: {
        kind: "io",
        error: DocumentAccessFailure.create("missing", "/work/settings-ui/app.dcmp")
      }
    }
  }
}`,...y.parameters?.docs?.source},description:{story:`開こうとしたファイルが読めなかった状態。`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "メニューを受け取れない",
  args: {
    commandFailure: Option.some({
      source: CommandSources.Menu,
      message: "listen が失敗した"
    })
  }
}`,...b.parameters?.docs?.source},description:{story:`メニューの購読を張れなかった状態（Tauri 側と版がずれたときなど）。`,...b.parameters?.docs?.description}}},x=[`Default`,`WithRecentDocuments`,`Opening`,`OpenFailed`,`EntryUnavailable`]}))();export{g as Default,b as EntryUnavailable,y as OpenFailed,v as Opening,_ as WithRecentDocuments,x as __namedExportsOrder,h as default};