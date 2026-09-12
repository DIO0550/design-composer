import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{n,t as r}from"./drop-line-CGDWGzVR.js";var i,a,o,s,c;e((()=>{n(),i=t(),a={title:`components/DropLine`,component:r,parameters:{layout:`padded`,docs:{description:{component:`並べ替えで落ちる先を示す線。

**左ペインのストーリーには出てこない。

本番は行の枠（\`position: relative\`）へ重ねるので、器として行を模した枠を与える。`}}},decorators:[e=>(0,i.jsxs)(`div`,{className:`relative flex h-8 w-56 items-center rounded bg-white px-2 text-sm`,children:[`行`,(0,i.jsx)(e,{})]})]},o={name:`前へ動かしている`,args:{side:`before`}},s={name:`後ろへ動かしている`,args:{side:`after`}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "前へ動かしている",
  args: {
    side: "before"
  }
}`,...o.parameters?.docs?.source},description:{story:`前へ動かしているとき。入った行の手前に落ちるので、線は上の縁に出る。`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "後ろへ動かしている",
  args: {
    side: "after"
  }
}`,...s.parameters?.docs?.source},description:{story:`後ろへ動かしているとき。入った行の後ろに落ちるので、線は下の縁に出る。`,...s.parameters?.docs?.description}}},c=[`Before`,`After`]}))();export{s as After,o as Before,c as __namedExportsOrder,a as default};