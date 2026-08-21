import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{a as n,r}from"./sample-editor-state-DjG_EzGl.js";import{n as i,t as a}from"./editor-state-Guu_TQnK.js";import{g as o,h as s}from"./artboard-frame-BscYOtJP.js";import{n as c,t as l}from"./canvas-controls-CfTqd-zO.js";import{n as u,t as d}from"./artboard-frame-list-D0U7xXCf.js";function f({state:e}){let t=s.compile(a.document(e));return t.ok?(0,p.jsx)(l,{state:e,children:n=>(0,p.jsx)(d,{compiled:t.value,state:e,onSelect:()=>{},...n})}):(0,p.jsxs)(`p`,{children:[`コンパイルに失敗しました: `,t.error.message]})}var p,m,h,g,_,v;e((()=>{n(),i(),o(),c(),u(),p=t(),m={title:`features/editor/ArtboardCanvas/ArtboardFrameList`,component:f,parameters:{layout:`fullscreen`},decorators:[e=>(0,p.jsx)(`div`,{className:`h-[32rem] w-full overflow-auto bg-gray-100`,children:(0,p.jsx)(e,{})})]},h={name:`選択なし`,args:{state:r}},g={name:`artboard を選択中`,args:{state:a.select(r,`settings`)}},_={name:`配下のノードを選択中`,args:{state:a.select(r,`overflow-wide`)}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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