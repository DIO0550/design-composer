import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./drop-marker-DtczYady.js";var i,a,o,s,c;e((()=>{n(),i=t(),a={title:`features/canvas/ArtboardCanvas/DropMarker`,component:r,parameters:{layout:`fullscreen`,docs:{description:{component:`ドロップ先を示す線。

**キャンバスのストーリーには出てこない。** 運んでいる最中の姿を映すには
ポインタを押し下げたままにする必要があり、\`ArtboardCanvas\` のストーリーは
静止した状態しか撮れないため。線の太さ・色を確かめる手段はここだけになる。

本番は \`position: fixed\` で実測した client 座標へ置くので、器は与えず
ビューポートの座標をそのまま使う。`}}},decorators:[e=>(0,i.jsx)(`div`,{className:`h-64 w-full bg-gray-100`,children:(0,i.jsx)(e,{})})]},o={name:`横並びの子の間`,args:{bounds:{left:160,top:40,width:2,height:120}}},s={name:`縦並びの子の間`,args:{bounds:{left:60,top:100,width:240,height:2}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "横並びの子の間",
  args: {
    bounds: {
      left: 160,
      top: 40,
      width: 2,
      height: 120
    }
  }
}`,...o.parameters?.docs?.source},description:{story:"子が横に並ぶ親（`row`）へ落とすときの線。子と子の隙間に縦線が立つ。",...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "縦並びの子の間",
  args: {
    bounds: {
      left: 60,
      top: 100,
      width: 240,
      height: 2
    }
  }
}`,...s.parameters?.docs?.source},description:{story:"子が縦に並ぶ親（`column`）へ落とすときの線。",...s.parameters?.docs?.description}}},c=[`BetweenColumns`,`BetweenRows`]}))();export{o as BetweenColumns,s as BetweenRows,c as __namedExportsOrder,a as default};