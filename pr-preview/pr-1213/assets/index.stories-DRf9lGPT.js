import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{i as n,r}from"./ArrayEx-n4Zaub53.js";import{n as i,t as a}from"./offset-99AT9xPG.js";import{i as o,r as s}from"./use-node-drag-Dbndi3VC.js";import{n as c,t as l}from"./artboard-frame-C9rl_vd4.js";import{i as u,r as d}from"./sample-canvas-document-BhKlNNLQ.js";import{n as f,t as p}from"./canvas-controls-BSaz0SXj.js";function m({selection:e,artboardName:t,isSelected:n,isCurrent:i}){let o=s.compile(e.document),c=r.isOk(o)?o.value.artboards.find(e=>e.element.name===t):void 0;return!r.isOk(o)||c===void 0?(0,h.jsxs)(`p`,{children:[t,` を組み立てられませんでした`]}):(0,h.jsx)(p,{selection:e,children:e=>(0,h.jsx)(`ul`,{style:o.value.variables,className:`relative`,children:(0,h.jsx)(l,{arranged:{artboard:c,canvasPosition:a.Origin},isSelected:n,isCurrent:i,onSelect:()=>{},onContextMenu:()=>{},...e})})})}var h,g,_,v,y,b;e((()=>{i(),d(),o(),n(),f(),c(),h=t(),g={title:`features/editor/features/canvas/ArtboardCanvas/ArtboardFrame`,component:m,parameters:{layout:`fullscreen`},args:{selection:u(),artboardName:`home`},decorators:[e=>(0,h.jsx)(`div`,{className:`h-96 w-full bg-gray-100 p-8`,children:(0,h.jsx)(e,{})})]},_={name:`選択なし`,args:{isSelected:!1,isCurrent:!1}},v={name:`選択中`,args:{isSelected:!0,isCurrent:!0}},y={name:`今見ている 1 枚（選択は配下のノード）`,args:{isSelected:!1,isCurrent:!0}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    isSelected: false,
    isCurrent: false
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "選択中",
  args: {
    isSelected: true,
    isCurrent: true
  }
}`,...v.parameters?.docs?.source},description:{story:"選んでいる artboard。枠が 2px の青になる（`aria-current` も立つ）。",...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "今見ている 1 枚（選択は配下のノード）",
  args: {
    isSelected: false,
    isCurrent: true
  }
}`,...y.parameters?.docs?.source},description:{story:`選んではいないが、今ツリーが映している 1 枚。

見出しだけが青くなり、枠は灰色のまま。**選択と「今見ている 1 枚」が別物である** ことは、
この組み合わせでしか見えない。`,...y.parameters?.docs?.description}}},b=[`Default`,`Selected`,`CurrentOnly`]}))();export{y as CurrentOnly,_ as Default,v as Selected,b as __namedExportsOrder,g as default};