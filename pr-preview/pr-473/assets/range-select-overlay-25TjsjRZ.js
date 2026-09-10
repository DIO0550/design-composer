import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,r}from"./artboard-frame-list-BaxMGsTW.js";function i({bounds:e}){return(0,a.jsx)(`div`,{"data-testid":`range-select`,"aria-hidden":!0,className:`pointer-events-none fixed z-10`,style:{left:`${e.left}px`,top:`${e.top}px`,width:`${e.width}px`,height:`${e.height}px`,border:`1px solid ${n}`,backgroundColor:`${n}1a`}})}var a,o=e((()=>{r(),a=t();try{i.displayName=`RangeSelectOverlay`,i.__docgenInfo={description:`空き領域から引いている選択の範囲（docs/06-ui.md「範囲選択」）。UI 案（docs/Design
Composer.html）にこの状態の絵は無い。

色は選択の枠と同じ青（\`SelectionColor\`）。この矩形が示すのは**これから選ばれる範囲**
で、選択そのものと同じ意味の系統に属する（緑の落とし先と赤の辺のスナップは運んでいる
間に出るもので、範囲選択とは同時に出ない）。塗りを薄く敷くのは、線だけだと中身の上で
辺を見失うため。

ズーム / パンの変形の**外側**に置き、実測した client 座標をそのまま \`position: fixed\`
で使う（\`DropMarker\` / \`SnapGuideOverlay\` と同じ理由 — 変形の内側は React の管理外）。
そのため引いたまま左右のペインの上まで出ると矩形もそこへ伸びるが、器からの相対へ直す
にはレンダー中に器を実測する必要があり、名前で引く \`useDrawnBounds\` と噛み合わない。
引いている間だけの一過性の見え方なのでそのままにしている。

\`pointer-events-none\` は、この矩形が土台（\`canvas-surface\`）の**兄弟**として重なるた
め。引いている間は土台がポインタを捕捉していて**外してもテストも絵も変わらない**が、
捕捉が成立しない場面では矩形がイベントを飲み込む。`,displayName:`RangeSelectOverlay`,filePath:`/home/runner/work/design-composer/design-composer/src/features/canvas/components/artboard-canvas/range-select-overlay/index.tsx`,methods:[],props:{bounds:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/canvas/components/artboard-canvas/range-select-overlay/index.tsx`,name:`TypeLiteral`}],description:``,name:`bounds`,required:!0,tags:{},type:{name:`Readonly<{ left: number; top: number; width: number; height: number; }>`}}},tags:{returns:`引いている範囲を示す矩形`}}}catch{}}));export{o as n,i as t};