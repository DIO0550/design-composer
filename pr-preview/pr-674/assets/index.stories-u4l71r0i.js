import{n as e}from"./chunk-BneVvdWh.js";import{i as t,r as n}from"./ArrayEx-CtQdU7_T.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{a as i,o as a}from"./size-Ye0Ym3KN.js";import{i as o,r as s}from"./sample-canvas-document-oDXXXj48.js";import{m as c,p as l}from"./use-text-edit-CbrKW3PK.js";import{n as u,t as d}from"./artboard-frame-DoDHSR6L.js";import{n as f,t as p}from"./canvas-controls-BunTJX_q.js";function m({selection:e,artboardName:t,isSelected:r,isCurrent:a}){let o=l.compile(e.document),s=n.isOk(o)?o.value.artboards.find(e=>e.element.name===t):void 0;return!n.isOk(o)||s===void 0?(0,h.jsxs)(`p`,{children:[t,` を組み立てられませんでした`]}):(0,h.jsx)(p,{selection:e,children:e=>(0,h.jsx)(`ul`,{style:o.value.variables,className:`relative`,children:(0,h.jsx)(d,{arranged:{artboard:s,canvasPosition:i.Origin},isSelected:r,isCurrent:a,onSelect:()=>{},onContextMenu:()=>{},...e})})})}var h,g,_,v,y,b;e((()=>{a(),s(),c(),t(),f(),u(),h=r(),g={title:`features/canvas/ArtboardCanvas/ArtboardFrame`,component:m,parameters:{layout:`fullscreen`},args:{selection:o(),artboardName:`home`},decorators:[e=>(0,h.jsx)(`div`,{className:`h-96 w-full bg-gray-100 p-8`,children:(0,h.jsx)(e,{})})]},_={name:`選択なし`,args:{isSelected:!1,isCurrent:!1}},v={name:`選択中`,args:{isSelected:!0,isCurrent:!0}},y={name:`今見ている 1 枚（選択は配下のノード）`,args:{isSelected:!1,isCurrent:!0}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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