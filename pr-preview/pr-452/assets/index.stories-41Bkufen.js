import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./snap-guide-overlay-FUAuQHKN.js";var i,a,o,s,c;e((()=>{n(),i=t(),a={title:`features/canvas/ArtboardCanvas/SnapGuideOverlay`,component:r,parameters:{layout:`fullscreen`,docs:{description:{component:`揃った辺に引くガイド線。

**キャンバスのストーリーには出てこない。** 運んでいる最中の姿を映すにはポインタを
押し下げたままにする必要があり、\`ArtboardCanvas\` のストーリーは静止した状態しか
撮れないため。線の太さ・色を確かめる手段はここだけになる（\`DropMarker\` と同じ）。

本番は \`position: fixed\` で実測した client 座標へ置くので、器は与えず
ビューポートの座標をそのまま使う。`}}},decorators:[e=>(0,i.jsx)(`div`,{className:`h-64 w-full bg-gray-100`,children:(0,i.jsx)(e,{})})]},o={name:`左右の辺が揃った`,args:{guides:[{left:159,top:40,width:2,height:140}]}},s={name:`縦横の両方で揃った`,args:{guides:[{left:159,top:40,width:2,height:140},{left:60,top:99,width:240,height:2}]}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "左右の辺が揃った",
  args: {
    guides: [{
      left: 159,
      top: 40,
      width: 2,
      height: 140
    }]
  }
}`,...o.parameters?.docs?.source},description:{story:`左右の辺が揃ったとき。揃った 2 つの矩形をまたぐ縦線が立つ。`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "縦横の両方で揃った",
  args: {
    guides: [{
      left: 159,
      top: 40,
      width: 2,
      height: 140
    }, {
      left: 60,
      top: 99,
      width: 240,
      height: 2
    }]
  }
}`,...s.parameters?.docs?.source},description:{story:`縦横の両方で揃ったとき。軸ごとに 1 本ずつ出る。`,...s.parameters?.docs?.description}}},c=[`AlongSideEdges`,`AlongBothAxes`]}))();export{s as AlongBothAxes,o as AlongSideEdges,c as __namedExportsOrder,a as default};