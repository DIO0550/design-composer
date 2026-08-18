import{n as e}from"./chunk-BneVvdWh.js";import{a as t,r as n}from"./sample-editor-state-DuIDV25x.js";import{n as r,t as i}from"./editor-state-3cICpLSW.js";import{g as a,h as o}from"./artboard-frame-DpEfwX54.js";import{n as s,t as c}from"./canvas-controls-D9p9Qk4C.js";import{t as l}from"./jsx-runtime-ChEsXk_u.js";import{n as u,t as d}from"./artboard-frame-list-C0cbwJF0.js";function f({state:e}){let t=o.compile(i.document(e));return t.ok?(0,p.jsx)(c,{state:e,children:n=>(0,p.jsx)(d,{compiled:t.value,state:e,onSelect:()=>{},...n})}):(0,p.jsxs)(`p`,{children:[`コンパイルに失敗しました: `,t.error.message]})}var p,m,h,g,_,v;e((()=>{t(),r(),a(),s(),u(),p=l(),m={title:`features/editor/ArtboardCanvas/ArtboardFrameList`,component:f,parameters:{layout:`fullscreen`},decorators:[e=>(0,p.jsx)(`div`,{className:`h-[32rem] w-full overflow-auto bg-gray-100`,children:(0,p.jsx)(e,{})})]},h={name:`選択なし`,args:{state:n}},g={name:`artboard を選択中`,args:{state:i.select(n,`settings`)}},_={name:`配下のノードを選択中`,args:{state:i.select(n,`overflow-wide`)}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    state: SampleEditorState
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SampleEditorState, "settings")
  }
}`,...g.parameters?.docs?.source},description:{story:`選択の枠（青の実線）。artboard 自身を選ぶと枠ごと囲まれる。`,...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "配下のノードを選択中",
  args: {
    state: EditorState.select(SampleEditorState, "overflow-wide")
  }
}`,..._.parameters?.docs?.source},description:{story:`配下のノードを選んだ状態。

枠は選んだノードに付き、見出しの青は**それを載せている artboard**に付く
（\`aria-current\` と同じ「今見ている 1 枚」の意味 / #184）。2 つが別のものを
指していることは、この組み合わせでしか見えない。`,..._.parameters?.docs?.description}}},v=[`Default`,`ArtboardSelected`,`NodeSelected`]}))();export{g as ArtboardSelected,h as Default,_ as NodeSelected,v as __namedExportsOrder,m as default};