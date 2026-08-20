import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{a as n,r}from"./sample-editor-state-DjG_EzGl.js";import{n as i,t as a}from"./editor-state-Guu_TQnK.js";import{g as o,h as s,n as c,t as l}from"./artboard-frame-D8Fotbmf.js";import{n as u,t as d}from"./canvas-controls-DWz4pQv_.js";function f({state:e,artboardName:t,isSelected:n,isCurrent:r}){let i=s.compile(a.document(e)),o=i.ok?i.value.artboards.find(e=>e.element.name===t):void 0;return i.ok===!1||o===void 0?(0,p.jsxs)(`p`,{children:[t,` を組み立てられませんでした`]}):(0,p.jsx)(d,{state:e,children:e=>(0,p.jsx)(`ul`,{style:i.value.variables,className:`p-8`,children:(0,p.jsx)(l,{artboard:o,isSelected:n,isCurrent:r,onSelect:()=>{},...e})})})}var p,m,h,g,_,v;e((()=>{n(),i(),o(),u(),c(),p=t(),m={title:`features/editor/ArtboardCanvas/ArtboardFrame`,component:f,parameters:{layout:`fullscreen`},args:{state:r,artboardName:`home`},decorators:[e=>(0,p.jsx)(`div`,{className:`h-96 w-full bg-gray-100`,children:(0,p.jsx)(e,{})})]},h={name:`選択なし`,args:{isSelected:!1,isCurrent:!1}},g={name:`選択中`,args:{isSelected:!0,isCurrent:!0}},_={name:`今見ている 1 枚（選択は配下のノード）`,args:{isSelected:!1,isCurrent:!0}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    isSelected: false,
    isCurrent: false
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "選択中",
  args: {
    isSelected: true,
    isCurrent: true
  }
}`,...g.parameters?.docs?.source},description:{story:"選んでいる artboard。枠が 2px の青になる（`aria-current` も立つ）。",...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "今見ている 1 枚（選択は配下のノード）",
  args: {
    isSelected: false,
    isCurrent: true
  }
}`,..._.parameters?.docs?.source},description:{story:`選んではいないが、今ツリーが映している 1 枚。

見出しだけが青くなり、枠は灰色のまま。**選択と「今見ている 1 枚」が別物である**
ことは、この組み合わせでしか見えない（#184）。`,..._.parameters?.docs?.description}}},v=[`Default`,`Selected`,`CurrentOnly`]}))();export{_ as CurrentOnly,h as Default,g as Selected,v as __namedExportsOrder,m as default};