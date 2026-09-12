import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-D16BNjX-.js";import{n,r}from"./artboard-frame-list-ChdgLe6b.js";function i({bounds:e}){return(0,a.jsx)(`div`,{"data-testid":`range-select`,"aria-hidden":!0,className:`pointer-events-none fixed z-10`,style:{left:`${e.left}px`,top:`${e.top}px`,width:`${e.width}px`,height:`${e.height}px`,border:`1px solid ${n}`,backgroundColor:`${n}1a`}})}var a,o=e((()=>{r(),a=t();try{i.displayName=`RangeSelectOverlay`,i.__docgenInfo={description:`空き領域から引いている選択の範囲（docs/06-ui.md「範囲選択」）。UI 案 docs/Design
Composer.html にこの状態の絵は無い。

色は選択の枠と同じ青（\`SelectionColor\`）。示すのは**これから選ばれる範囲**で、選択と同じ
意味の系統に属する（緑の落とし先と赤の辺のスナップは運んでいる間だけ出る）。

ズーム / パンの変形の**外側**に置き、実測した client 座標を \`position: fixed\` で使う
（変形の内側は React の管理外。器からの相対へ直すにはレンダー中の実測が要り、名前で引
く \`useDrawnBounds\` と噛み合わない）。\`pointer-events-none\` は土台の**兄弟**として重
なるためで、引いている間は土台が捕捉していて**外してもテストも絵も変わらない**。`,displayName:`RangeSelectOverlay`,filePath:`/home/runner/work/design-composer/design-composer/src/features/canvas/components/artboard-canvas/range-select-overlay/index.tsx`,methods:[],props:{bounds:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/canvas/components/artboard-canvas/range-select-overlay/index.tsx`,name:`TypeLiteral`}],description:``,name:`bounds`,required:!0,tags:{},type:{name:`Readonly<{ left: number; top: number; width: number; height: number; }>`}}},tags:{returns:`引いている範囲を示す矩形`}}}catch{}}));export{o as n,i as t};