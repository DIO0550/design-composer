import{n as e}from"./chunk-BneVvdWh.js";import{i as t,r as n}from"./ArrayEx-CilqoLzs.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{a as i,o as a}from"./size-n84loII8.js";import{n as o,t as s}from"./artboard-frame-1IICeGyn.js";import{i as c,r as l}from"./use-node-drag-DE1s_eNp.js";import{i as u,r as d}from"./sample-canvas-document-D6PYxlZG.js";import{n as f,t as p}from"./canvas-controls-7vPDbBdw.js";function m({selection:e,artboardName:t,isSelected:r,isCurrent:a}){let o=l.compile(e.document),c=n.isOk(o)?o.value.artboards.find(e=>e.element.name===t):void 0;return!n.isOk(o)||c===void 0?(0,h.jsxs)(`p`,{children:[t,` を組み立てられませんでした`]}):(0,h.jsx)(p,{selection:e,children:e=>(0,h.jsx)(`ul`,{style:o.value.variables,className:`relative`,children:(0,h.jsx)(s,{arranged:{artboard:c,canvasPosition:i.Origin},isSelected:r,isCurrent:a,onSelect:()=>{},onContextMenu:()=>{},...e})})})}var h,g,_,v,y,b;e((()=>{a(),d(),c(),t(),f(),o(),h=r(),g={title:`features/editor/features/canvas/ArtboardCanvas/ArtboardFrame`,component:m,parameters:{layout:`fullscreen`},args:{selection:u(),artboardName:`home`},decorators:[e=>(0,h.jsx)(`div`,{className:`h-96 w-full bg-gray-100 p-8`,children:(0,h.jsx)(e,{})})]},_={name:`選択なし`,args:{isSelected:!1,isCurrent:!1}},v={name:`選択中`,args:{isSelected:!0,isCurrent:!0}},y={name:`今見ている 1 枚（選択は配下のノード）`,args:{isSelected:!1,isCurrent:!0}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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