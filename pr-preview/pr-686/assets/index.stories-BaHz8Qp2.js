import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-CPpfsGoD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./left-pane-CFNDXcW3.js";import{i as o,r as s}from"./left-pane-rail-DpW108B0.js";function c(e,t){return Array.from({length:t},(t,n)=>`${e} ${n+1}`)}function l({rows:e}){return(0,f.jsx)(`ul`,{className:`flex flex-col gap-1 text-gray-700 text-xs`,children:e.map(e=>(0,f.jsx)(`li`,{children:e},e))})}function u(){return(0,f.jsx)(`div`,{className:`shrink-0 border-[#f0f0f0] border-t p-3 text-gray-700 text-xs`,children:`下端に固定するもの`})}function d(){return{[s.Layers]:{kind:`searchable`,search:`Search layers`,body:e=>(0,f.jsx)(l,{rows:c(`layer`,6).filter(t=>t.includes(e))}),footer:n.none},[s.Assets]:{kind:`searchable`,search:`Search assets`,body:e=>(0,f.jsx)(l,{rows:c(`asset`,40).filter(t=>t.includes(e))}),footer:n.some((0,f.jsx)(u,{}))},[s.Tokens]:{kind:`unsearchable`,body:(0,f.jsx)(l,{rows:c(`token`,6)}),footer:n.none}}}var f,p,m,h,g,_,v,y;e((()=>{o(),t(),i(),f=r(),{fn:p}=__STORYBOOK_MODULE_TEST__,m={title:`features/sidebar/LeftPane`,component:a,parameters:{layout:`fullscreen`},args:{onSelectView:p(),contents:d(),isFrozen:!1},decorators:[e=>(0,f.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,f.jsx)(e,{})})]},h={name:`検索欄を持つ行き先`,args:{view:s.Layers}},g={name:`検索欄とフッターを持つ行き先`,args:{view:s.Assets}},_={name:`検索欄を持たない行き先`,args:{view:s.Tokens}},v={name:`凍結中`,args:{view:s.Layers,isFrozen:!0}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "検索欄を持つ行き先",
  args: {
    view: LeftPaneViews.Layers
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "検索欄とフッターを持つ行き先",
  args: {
    view: LeftPaneViews.Assets
  }
}`,...g.parameters?.docs?.source},description:{story:`検索欄とフッターの両方を持つ行き先。本体がパネルより長く、フッターは下端に残る。`,...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "検索欄を持たない行き先",
  args: {
    view: LeftPaneViews.Tokens
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "凍結中",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true
  }
}`,...v.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れているとき。見出しの右端が `凍結中` になる。淡色と操作不可は器\n（`EditorLayout.LeftPane`）が持つので、ここには出ない。",...v.parameters?.docs?.description}}},y=[`Searchable`,`SearchableWithFooter`,`Unsearchable`,`Frozen`]}))();export{v as Frozen,h as Searchable,g as SearchableWithFooter,_ as Unsearchable,y as __namedExportsOrder,m as default};