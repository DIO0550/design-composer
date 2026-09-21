import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-CPpfsGoD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./left-pane-shell-Bg7Fse5V.js";import{n as o,t as s}from"./layers-panel-B-JI1EGS.js";import{a as c,i as l,n as u,r as d}from"./sample-sidebar-document-BlmePfmd.js";var f,p,m,h,g,_,v;e((()=>{i(),l(),u(),t(),o(),f=r(),{fn:p}=__STORYBOOK_MODULE_TEST__,m={title:`features/editor/features/sidebar/LayersPanel`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,f.jsx)(a,{children:(0,f.jsx)(`div`,{className:`flex flex-col gap-4 p-3`,children:(0,f.jsx)(e,{})})})],args:{selection:d(),renaming:n.none,artboard:{add:p(),reorder:p()},node:{select:p(),reorder:p(),createComponent:p()},rename:c()}},h={name:`絞り込んでいない`,args:{query:``}},g={name:`絞り込んでいる`,args:{query:`settings`}},_={name:`一致するものがない`,args:{query:`zzz`}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "絞り込んでいない",
  args: {
    query: ""
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "絞り込んでいる",
  args: {
    query: "settings"
  }
}`,...g.parameters?.docs?.source},description:{story:`一致した artboard と、今見ている 1 枚だけが残った状態。`,...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "一致するものがない",
  args: {
    query: "zzz"
  }
}`,..._.parameters?.docs?.source},description:{story:"どこにも一致が無い状態。`Artboards` の見出しと `+` を残して知らせに置き換わり、ツリーは\n出なくなる（docs/06-ui.md「絞り込み」）。2 つの節がまとめてこうなることは、この組み合わせ\nでしか絵に出ない。",..._.parameters?.docs?.description}}},v=[`Default`,`Filtered`,`NoMatch`]}))();export{h as Default,g as Filtered,_ as NoMatch,v as __namedExportsOrder,m as default};