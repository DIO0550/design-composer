import{n as e}from"./chunk-BneVvdWh.js";import{a as t,r as n}from"./sample-editor-state-DuIDV25x.js";import{n as r,t as i}from"./editor-state-3cICpLSW.js";import{g as a,h as o,n as s,t as c}from"./artboard-frame-KZ_cVZbo.js";import{n as l,t as u}from"./canvas-controls-gLiirSM6.js";import{t as d}from"./jsx-runtime-ChEsXk_u.js";function f({state:e,artboardName:t,isSelected:n,isCurrent:r}){let a=o.compile(i.document(e)),s=a.ok?a.value.artboards.find(e=>e.element.name===t):void 0;return a.ok===!1||s===void 0?(0,p.jsxs)(`p`,{children:[t,` を組み立てられませんでした`]}):(0,p.jsx)(u,{state:e,children:e=>(0,p.jsx)(`ul`,{style:a.value.variables,className:`p-8`,children:(0,p.jsx)(c,{artboard:s,isSelected:n,isCurrent:r,onSelect:()=>{},...e})})})}var p,m,h,g,_,v;e((()=>{t(),r(),a(),l(),s(),p=d(),m={title:`features/editor/ArtboardCanvas/ArtboardFrame`,component:f,parameters:{layout:`fullscreen`},args:{state:n,artboardName:`home`},decorators:[e=>(0,p.jsx)(`div`,{className:`h-96 w-full bg-gray-100`,children:(0,p.jsx)(e,{})})]},h={name:`選択なし`,args:{isSelected:!1,isCurrent:!1}},g={name:`選択中`,args:{isSelected:!0,isCurrent:!0}},_={name:`今見ている 1 枚（選択は配下のノード）`,args:{isSelected:!1,isCurrent:!0}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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