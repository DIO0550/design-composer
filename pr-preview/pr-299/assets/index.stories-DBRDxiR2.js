import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-6sF1Ejqi.js";import{i as n,r}from"./sample-canvas-document-BrBX7fYi.js";import{g as i,h as a,n as o,t as s}from"./artboard-frame-pCaHME3r.js";import{n as c,t as l}from"./canvas-controls-NFRn2I1R.js";function u({selection:e,artboardName:t,isSelected:n,isCurrent:r}){let i=a.compile(e.document),o=i.ok?i.value.artboards.find(e=>e.element.name===t):void 0;return i.ok===!1||o===void 0?(0,d.jsxs)(`p`,{children:[t,` を組み立てられませんでした`]}):(0,d.jsx)(l,{selection:e,children:e=>(0,d.jsx)(`ul`,{style:i.value.variables,className:`p-8`,children:(0,d.jsx)(s,{artboard:o,isSelected:n,isCurrent:r,onSelect:()=>{},...e})})})}var d,f,p,m,h,g;e((()=>{r(),i(),c(),o(),d=t(),f={title:`features/canvas/ArtboardCanvas/ArtboardFrame`,component:u,parameters:{layout:`fullscreen`},args:{selection:n(),artboardName:`home`},decorators:[e=>(0,d.jsx)(`div`,{className:`h-96 w-full bg-gray-100`,children:(0,d.jsx)(e,{})})]},p={name:`選択なし`,args:{isSelected:!1,isCurrent:!1}},m={name:`選択中`,args:{isSelected:!0,isCurrent:!0}},h={name:`今見ている 1 枚（選択は配下のノード）`,args:{isSelected:!1,isCurrent:!0}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    isSelected: false,
    isCurrent: false
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "選択中",
  args: {
    isSelected: true,
    isCurrent: true
  }
}`,...m.parameters?.docs?.source},description:{story:"選んでいる artboard。枠が 2px の青になる（`aria-current` も立つ）。",...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "今見ている 1 枚（選択は配下のノード）",
  args: {
    isSelected: false,
    isCurrent: true
  }
}`,...h.parameters?.docs?.source},description:{story:`選んではいないが、今ツリーが映している 1 枚。

見出しだけが青くなり、枠は灰色のまま。**選択と「今見ている 1 枚」が別物である**
ことは、この組み合わせでしか見えない（#184）。`,...h.parameters?.docs?.description}}},g=[`Default`,`Selected`,`CurrentOnly`]}))();export{h as CurrentOnly,p as Default,m as Selected,g as __namedExportsOrder,f as default};