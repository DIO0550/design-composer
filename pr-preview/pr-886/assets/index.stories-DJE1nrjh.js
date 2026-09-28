import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-D16BNjX-.js";import{n,r,t as i}from"./drop-line-C67NVeBD.js";var a,o,s,c,l,u,d;e((()=>{r(),a=t(),o={title:`components/DropLine`,component:i,parameters:{layout:`padded`,docs:{description:{component:`並べ替えで落ちる先を示す線。

左ペインやタブ列のストーリーは掴んでいない状態しか描かないので、線の見た目を視覚差分で
守るのはこのストーリーだけ。

本番は行やタブの枠（\`position: relative\`）へ重ねるので、器としてその枠を模したものを
与える。縦に積む並びは行、横に並べる並びはタブの大きさにする。`}}},decorators:[(e,{args:t})=>t.listOrientation===n.Vertical?(0,a.jsxs)(`div`,{className:`relative flex h-8 w-56 items-center rounded bg-white px-2 text-sm`,children:[`行`,(0,a.jsx)(e,{})]}):(0,a.jsxs)(`div`,{className:`relative flex h-8 w-28 items-center bg-[#f0f0f0] px-[10px] text-[11px]`,children:[`タブ`,(0,a.jsx)(e,{})]})],args:{listOrientation:n.Vertical}},s={name:`前へ動かしている`,args:{side:`before`}},c={name:`後ろへ動かしている`,args:{side:`after`}},l={name:`横並びで前へ動かしている`,args:{side:`before`,listOrientation:n.Horizontal}},u={name:`横並びで後ろへ動かしている`,args:{side:`after`,listOrientation:n.Horizontal}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "前へ動かしている",
  args: {
    side: "before"
  }
}`,...s.parameters?.docs?.source},description:{story:`前へ動かしているとき。入った行の手前に落ちるので、線は上の縁に出る。`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "後ろへ動かしている",
  args: {
    side: "after"
  }
}`,...c.parameters?.docs?.source},description:{story:`後ろへ動かしているとき。入った行の後ろに落ちるので、線は下の縁に出る。`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "横並びで前へ動かしている",
  args: {
    side: "before",
    listOrientation: ListOrientations.Horizontal
  }
}`,...l.parameters?.docs?.source},description:{story:`横に並べる並びで前へ動かしているとき。入ったタブの左の縁に出る。`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "横並びで後ろへ動かしている",
  args: {
    side: "after",
    listOrientation: ListOrientations.Horizontal
  }
}`,...u.parameters?.docs?.source},description:{story:`横に並べる並びで後ろへ動かしているとき。入ったタブの右の縁に出る。`,...u.parameters?.docs?.description}}},d=[`Before`,`After`,`HorizontalBefore`,`HorizontalAfter`]}))();export{c as After,s as Before,u as HorizontalAfter,l as HorizontalBefore,d as __namedExportsOrder,o as default};