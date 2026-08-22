import{n as e}from"./chunk-BneVvdWh.js";import{F as t,I as n}from"./primitive-schema-Ke4zSQuu.js";import{t as r}from"./jsx-runtime-4HHWW5MW.js";import{a as i,r as a,t as o}from"./sample-editor-state-DjG_EzGl.js";import{n as s,t as c}from"./editor-state-Guu_TQnK.js";import{g as l,h as u}from"./artboard-frame-v3Z1nb3m.js";import{n as d,t as f}from"./canvas-controls-BiqIZwbV.js";import{n as p,t as m}from"./canvas-body-DNLN3ubT.js";function h({state:e,compiled:t}){return(0,g.jsx)(f,{state:e,children:n=>(0,g.jsx)(m,{compiled:t,state:e,onSelect:()=>{},...n})})}var g,_,v,y,b,x;e((()=>{i(),s(),l(),n(),d(),p(),g=r(),_={title:`features/editor/ArtboardCanvas/CanvasBody`,component:h,parameters:{layout:`fullscreen`},decorators:[e=>(0,g.jsx)(`div`,{className:`h-96 w-full overflow-hidden bg-gray-100`,children:(0,g.jsx)(e,{})})]},v={name:`artboard が並ぶ`,args:{state:a,compiled:u.compile(c.document(a))}},y={name:`artboard が 0 枚`,args:{state:o,compiled:u.compile(c.document(o))}},b={name:`コンパイルに失敗`,args:{state:a,compiled:t.err(Error(`参照している部品 card が見つかりません`))}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "artboard が並ぶ",
  args: {
    state: SampleEditorState,
    compiled: DocumentHtml.compile(EditorState.document(SampleEditorState))
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "artboard が 0 枚",
  args: {
    state: EmptyEditorState,
    compiled: DocumentHtml.compile(EditorState.document(EmptyEditorState))
  }
}`,...y.parameters?.docs?.source},description:{story:`空表示へ倒さず知らせを出す（artboard が無いのかコンパイルが壊れたのか区別するため）。`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "コンパイルに失敗",
  args: {
    state: SampleEditorState,
    compiled: Result.err(new Error("参照している部品 card が見つかりません"))
  }
}`,...b.parameters?.docs?.source},description:{story:`コンパイルの失敗はそのまま見せる（握り潰すと原因が画面から消える）。`,...b.parameters?.docs?.description}}},x=[`Artboards`,`NoArtboards`,`CompileFailure`]}))();export{v as Artboards,b as CompileFailure,y as NoArtboards,x as __namedExportsOrder,_ as default};