import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{c as n,s as r}from"./size-BLc88dW1.js";import{i,r as a}from"./sample-canvas-document-C8LaDvBn.js";import{m as o,p as s}from"./use-text-edit-yzOPOW_m.js";import{n as c,t as l}from"./artboard-frame-DDActhsS.js";import{n as u,t as d}from"./canvas-controls-na7ZKzce.js";function f({selection:e,artboardName:t,isSelected:n,isCurrent:i}){let a=s.compile(e.document),o=a.ok?a.value.artboards.find(e=>e.element.name===t):void 0;return a.ok===!1||o===void 0?(0,p.jsxs)(`p`,{children:[t,` を組み立てられませんでした`]}):(0,p.jsx)(d,{selection:e,children:e=>(0,p.jsx)(`ul`,{style:a.value.variables,className:`relative`,children:(0,p.jsx)(l,{arranged:{artboard:o,canvasPosition:r.Origin},isSelected:n,isCurrent:i,onSelect:()=>{},...e})})})}var p,m,h,g,_,v;e((()=>{n(),a(),o(),u(),c(),p=t(),m={title:`features/canvas/ArtboardCanvas/ArtboardFrame`,component:f,parameters:{layout:`fullscreen`},args:{selection:i(),artboardName:`home`},decorators:[e=>(0,p.jsx)(`div`,{className:`h-96 w-full bg-gray-100 p-8`,children:(0,p.jsx)(e,{})})]},h={name:`選択なし`,args:{isSelected:!1,isCurrent:!1}},g={name:`選択中`,args:{isSelected:!0,isCurrent:!0}},_={name:`今見ている 1 枚（選択は配下のノード）`,args:{isSelected:!1,isCurrent:!0}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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