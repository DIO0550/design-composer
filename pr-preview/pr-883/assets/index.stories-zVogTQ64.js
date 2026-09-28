import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-BfXl6WpD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./left-pane-shell-Bg7Fse5V.js";import{n as o,t as s}from"./layers-panel-BAY5PBU2.js";import{a as c,i as l,n as u,r as d}from"./sample-sidebar-document-Cif7adsP.js";import{n as f,t as p}from"./sample-context-menu-actions-Dx6HpF3u.js";var m,h,g,_,v,y,b;e((()=>{i(),p(),l(),u(),t(),o(),m=r(),{fn:h}=__STORYBOOK_MODULE_TEST__,g={title:`features/editor/features/sidebar/LayersPanel`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,m.jsx)(a,{children:(0,m.jsx)(`div`,{className:`flex flex-col gap-4 p-3`,children:(0,m.jsx)(e,{})})})],args:{selection:d(),renaming:n.none,artboard:{add:h(),reorder:h()},node:{select:h(),reorder:h()},rename:c(),contextMenu:f()}},_={name:`絞り込んでいない`,args:{query:``}},v={name:`絞り込んでいる`,args:{query:`settings`}},y={name:`一致するものがない`,args:{query:`zzz`}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "絞り込んでいない",
  args: {
    query: ""
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "絞り込んでいる",
  args: {
    query: "settings"
  }
}`,...v.parameters?.docs?.source},description:{story:`一致した artboard と、今見ている 1 枚だけが残った状態。`,...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "一致するものがない",
  args: {
    query: "zzz"
  }
}`,...y.parameters?.docs?.source},description:{story:"どこにも一致が無い状態。`Artboards` の見出しと `+` を残して知らせに置き換わり、ツリーは\n出なくなる（docs/06-ui.md「絞り込み」）。2 つの節がまとめてこうなることは、この組み合わせ\nでしか絵に出ない。",...y.parameters?.docs?.description}}},b=[`Default`,`Filtered`,`NoMatch`]}))();export{_ as Default,v as Filtered,y as NoMatch,b as __namedExportsOrder,g as default};