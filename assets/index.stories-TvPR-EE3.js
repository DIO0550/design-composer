import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-BeyCqz6s.js";import{i as r,n as i}from"./side-BH3aONF_.js";import{l as a,u as o}from"./side-snap-DPsTyUUX.js";import{n as s,t as c}from"./facing-distance-overlay-DuDzesEF.js";import{n as l,t as u}from"./overlay-stage-C4Ntna6K.js";var d,f,p;e((()=>{r(),o(),t(),l(),s(),d={title:`features/editor/features/canvas/ArtboardCanvas/FacingDistanceOverlay`,component:c,parameters:{layout:`fullscreen`,docs:{description:{component:"運んでいる間の Alt / Option の距離（映し方は `OverlayStage` の doc を参照）。"}}},decorators:[u]},f={name:`上・左・右の距離`,args:{distances:{horizontal:{start:n.some({along:i.Horizontal,at:115,span:{min:40,max:150}}),end:n.some({along:i.Horizontal,at:115,span:{min:190,max:360}})},vertical:{start:n.some({along:i.Vertical,at:170,span:{min:20,max:100}}),end:n.none}},view:a.create()}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "上・左・右の距離",
  args: {
    distances: {
      horizontal: {
        start: Option.some({
          along: SidePairs.Horizontal,
          at: 115,
          span: {
            min: 40,
            max: 150
          }
        }),
        end: Option.some({
          along: SidePairs.Horizontal,
          at: 115,
          span: {
            min: 190,
            max: 360
          }
        })
      },
      vertical: {
        start: Option.some({
          along: SidePairs.Vertical,
          at: 170,
          span: {
            min: 20,
            max: 100
          }
        }),
        end: Option.none
      }
    },
    view: CanvasView.create()
  }
}`,...f.parameters?.docs?.source},description:{story:`運んでいるもの（左右 150〜190・上下 100〜130）から、上・左・右の 3 向きに相手がいるとき。
下は相手に接している。`,...f.parameters?.docs?.description}}},p=[`ThreeSides`]}))();export{f as ThreeSides,p as __namedExportsOrder,d as default};