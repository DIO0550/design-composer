import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{i as n,r}from"./ArrayEx-Idw6gcxx.js";import{n as i,t as a}from"./Option-BeyCqz6s.js";import{n as o,r as ee,t as te}from"./document-error-list-BRE8aDwv.js";import{n as s,t as ne}from"./document-json-DxD0TZQM.js";import{i as c,n as re,r as ie,t as ae}from"./document-tab-bar-DwBxWkEr.js";import{f as oe,g as se,h as ce,m as le}from"./elapsed-BhP6BBe7.js";import{a as ue,c as l,i as de,l as u,n as fe,o as pe,r as me,s as d,t as he}from"./opened-document-editor-D9-BOZoq.js";import{a as f,i as ge}from"./document-ipc-D5JNoJIw.js";import{a as _e,c as ve,i as ye,l as be,n as xe,o as p,t as Se,u as Ce}from"./document-start-_x8ZNi-b.js";import{n as we,t as m}from"./opened-documents-CEtpT7zt.js";import{a as Te,c as h,o as g,s as Ee,u as De}from"./use-canvas-view-Bae-rgUi.js";import{i as Oe,t as ke}from"./document-open-failure-BQ2IDE5q.js";function Ae(e){let t=Object.values(_).find(t=>t===e);return a.fromNullable(t)}var _,v,y,je=e((()=>{i(),n(),_={Open:`open`,Create:`create`,CloseTab:`close-tab`},v=`document-menu`,y={create(e){return{async subscribeCommand(t){try{let n=await e.listen(v,e=>{let n=Ae(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}}})),b,Me=e((()=>{l(),je(),b={create(){let e=d.create(v);return{menu:y.create(e.ipc),choose:e.deliver,deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}}));function Ne(e){if(typeof e!=`object`||!e)return!1;let{message:t}=e;return typeof t==`string`}function Pe(e){return Ne(e)?e:{message:String(e)}}function Fe(e){return e===null?r.ok(a.none):typeof e==`string`?r.ok(a.some(e)):r.err({message:`load_app_state が文字列でも null でもない値を返した: ${String(e)}`})}var x,Ie=e((()=>{f(),i(),n(),x={create(e){let t=ge.caller(e,Pe);return{async load(){return r.flatMap(await t(`load_app_state`,{}),Fe)},async save(e){return r.map(await t(`save_app_state`,{content:e}),()=>void 0)}}}}}));function S(e){return Promise.reject({message:`app-state.json: ${e}`})}var C,Le=e((()=>{l(),i(),Ie(),C={create(e){let t=e,n=!1,r=!1,i=()=>n?S(`読み込みが拒まれた`):Promise.resolve(t??null),o=e=>typeof e==`string`?r?S(`書き込みが拒まれた`):(t=e,Promise.resolve(void 0)):u(`save_app_state: content が文字列でない`);return{ipc:x.create({invoke(e,t){switch(e){case`load_app_state`:return i();case`save_app_state`:return o(t.content);default:return u(`Command ${e} not found`)}},listen(e){return u(`Event ${e} not emitted`)}}),storedContent(){return a.fromNullable(t)},denyLoad(){n=!0},denySave(){r=!0}}}}})),w,Re=e((()=>{f(),n(),w={create(e){let t=ge.caller(e,e=>({message:String(e)}));return{async close(){return r.map(await t(`close_current_window`,{}),()=>void 0)}}}}})),T,ze=e((()=>{l(),Re(),T={create(){let e=!1,t=!1,n=()=>t?u(`close_current_window: ウィンドウを閉じられない`):(e=!0,Promise.resolve(void 0));return{appWindow:w.create({invoke(e){return e===`close_current_window`?n():u(`Command ${e} not found`)},listen(e){return u(`Event ${e} not emitted`)}}),isWindowClosed(){return e},denyClose(){t=!0}}}}}));async function E(e){try{return r.ok(await e())}catch(e){return r.err({message:String(e)})}}var D,O,k,Be=e((()=>{n(),D={name:`Design Composer ドキュメント`,extensions:[`dcmp`]},O=`untitled.dcmp`,k={create(e){return{chooseOpenPath(){return E(()=>e.chooseOpenPath(D))},chooseSavePath(){return E(()=>e.chooseSavePath(D,O))}}}}}));function A(e){switch(e.kind){case`chosen`:return Promise.resolve(a.some(e.path));case`canceled`:return Promise.resolve(a.none);case`failed`:return Promise.reject(Error(e.message))}}var j,M,N,Ve=e((()=>{i(),Be(),j={kind:`canceled`},M={Canceled:j,chosen(e){return{kind:`chosen`,path:e}},failed(e){return{kind:`failed`,message:e}}},N={create(e){return{dialog:k.create({chooseOpenPath(){return A(e.open)},chooseSavePath(){return A(e.save)}})}}}}));function He(e){if(typeof e!=`object`||!e)return a.none;let{paths:t}=e;return!Array.isArray(t)||!t.every(e=>typeof e==`string`)?a.none:a.some(t)}var P,F,Ue=e((()=>{i(),n(),P=`tauri://drag-drop`,F={create(e){return{async subscribeDropped(t){try{let n=await e.listen(P,e=>{let n=He(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}}})),I,We=e((()=>{l(),Ue(),I={create(){let e=d.create(P);return{drop:F.create(e.ipc),dropFiles(t){e.deliver({paths:[...t],position:{x:0,y:0}})},deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}})),Ge=e((()=>{Oe(),xe(),re(),ve(),ye()}));function Ke(e){De(Array.from({length:L},(t,n)=>({shortcut:{kind:Ee.PhysicalKey,codes:[`Digit${n+1}`],withCommandKey:!0,withShiftKey:!1},onPress:()=>e(n)})))}var L,qe=e((()=>{h(),L=9}));function Je({opened:e,clock:t,ipc:n}){let r=m.activePath(e);return(0,z.jsx)(`div`,{className:`min-h-0 flex-1`,children:m.documents(e).map(e=>{let i=e.path===r;return(0,z.jsx)(`div`,{hidden:!i,className:`h-full`,children:(0,z.jsx)(Te,{scope:i?g.Listening:g.Suspended,children:(0,z.jsx)(he,{clock:t,ipc:n,opened:e})})},e.path)})})}function R({clock:e,ports:t}){let{session:n,recentPaths:r,recentFilesFailure:i,actions:ee,tabActions:s,commandFailure:ne}=_e(t),c=p.failure(n);return Ke(s.activateAt),p.hasOpenedDocuments(n)?(0,z.jsxs)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:[(0,z.jsx)(ae,{opened:n.documents.value,onSelect:s.activate,onClose:s.close,onReorder:s.reorder}),a.isSome(c)&&(0,z.jsx)(ke,{failure:c.value}),(0,z.jsx)(Je,{opened:n.documents.value,clock:e,ipc:t.ipc})]}):(0,z.jsx)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:(0,z.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,z.jsx)(Se,{attempt:n.attempt,actions:ee,recentPaths:r,recentFilesFailure:i,commandFailure:ne,renderErrors:e=>(0,z.jsx)(te,{errors:e,origin:o.UnopenedFile})})})})}var z,Ye=e((()=>{we(),ee(),fe(),Ge(),qe(),h(),i(),z=t();try{R.displayName=`EditorScreen`,R.__docgenInfo={description:`アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
（docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。

実物の組み立ては \`app/\` が持つ（rules/architecture.md）。`,displayName:`EditorScreen`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/editor-screen/index.tsx`,methods:[],props:{clock:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`clock`,required:!0,tags:{},type:{name:`Readonly<{ now(): Readonly<{ epochMs: number; }>; subscribeSeconds(listener: () => void): () => void; }>`}},ports:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`ports`,required:!0,tags:{},type:{name:`Readonly<{ ipc: Readonly<{ load(path: string): Promise<Result<string, Readonly<{ kind: DocumentIpcErrorKind; message: string; }>>>; save(path: string, content: string): Promise<...>; watch(path: string): Promise<...>; unwatch(path: string): Promise<...>; subscribeChanged(listener: (changed: Readonly<...>) => void): ...`}}},tags:{}}}catch{}}));function B(e,t){let n=me.create(e),r=N.create({open:M.chosen(W),save:M.chosen(`/work/untitled.dcmp`)}),i=I.create(),a=C.create(t===void 0?void 0:be.serialize({recentPaths:t}));return{ports:{ipc:n.ipc,dialog:r.dialog,menu:b.create().menu,drop:i.drop,appState:a.ipc,appWindow:T.create().appWindow},drop:i}}var V,H,U,W,G,Xe,K,Ze,q,J,Qe,$e,Y,X,Z,Q,$;e((()=>{c(),le(),se(),Me(),Le(),Ce(),ze(),pe(),Ve(),de(),s(),We(),Ye(),{expect:V,screen:H,waitFor:U}=__STORYBOOK_MODULE_TEST__,W=`/work/sample.dcmp`,G=`/work/settings.dcmp`,Xe=`/work/missing.dcmp`,K={[W]:ne.serialize(ce.document(oe)),[G]:ie(`settings`)},Ze=B(K),q=B(K),J=B(K),Qe=B(K,[W]),$e={title:`features/editor/EditorScreen`,component:R,parameters:{layout:`fullscreen`},args:{clock:ue.create().clock,ports:Ze.ports}},Y={name:`開始画面`},X={name:`前回のファイルを開いた直後`,args:{ports:Qe.ports}},Z={name:`複数開いている`,args:{ports:q.ports},play:async()=>{await U(()=>{V(H.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),q.drop.dropFiles([W,G]),await U(()=>{V(H.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()})}},Q={name:`開いたまま開けなかった`,args:{ports:J.ports},play:async()=>{await U(()=>{V(H.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),J.drop.dropFiles([W]),await U(()=>{V(H.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()}),J.drop.dropFiles([Xe]),await U(()=>{V(H.getByRole(`alert`,{name:`ファイルを開けませんでした`})).toBeDefined()})}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "開始画面"
}`,...Y.parameters?.docs?.source},description:{story:`何も開いていない状態の画面。「開く」でサンプルのドキュメントが、
「新規作成」で雛形のドキュメントが開くところまでここで操作して確認できる。`,...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "前回のファイルを開いた直後",
  args: {
    ports: restored.ports
  }
}`,...X.parameters?.docs?.source},description:{story:`前回開いていたファイルが起動時にそのまま開いた状態。`,...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "複数開いている",
  args: {
    ports: twoOpened.ports
  },
  play: async () => {
    // 購読が張られる前に落とすと指示が届かないので、張れるまで待つ。
    await waitFor(() => {
      expect(screen.getByRole("button", {
        name: "開く"
      }).hasAttribute("disabled")).toBe(false);
    });
    twoOpened.drop.dropFiles([SamplePath, SettingsPath]);
    await waitFor(() => {
      expect(screen.getByRole("navigation", {
        name: "開いているドキュメント"
      })).toBeDefined();
    });
  }
}`,...Z.parameters?.docs?.source},description:{story:`2 つ開いた状態。タブ列と上端の帯と 3 ペインの高さの配分は、ここでしか絵にならない
（タブ列だけのストーリーでは器との合わせ目が映らない）。`,...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "開いたまま開けなかった",
  args: {
    ports: openFailed.ports
  },
  play: async () => {
    await waitFor(() => {
      expect(screen.getByRole("button", {
        name: "開く"
      }).hasAttribute("disabled")).toBe(false);
    });
    openFailed.drop.dropFiles([SamplePath]);
    await waitFor(() => {
      expect(screen.getByRole("navigation", {
        name: "開いているドキュメント"
      })).toBeDefined();
    });
    // 置かれていないファイルを落とす。タブは増えず、理由だけが帯に出る。
    openFailed.drop.dropFiles([MissingPath]);
    await waitFor(() => {
      expect(screen.getByRole("alert", {
        name: "ファイルを開けませんでした"
      })).toBeDefined();
    });
  }
}`,...Q.parameters?.docs?.source},description:{story:`開いているものがある状態で、別のファイルを開けなかったところ。タブは残したまま
理由だけを帯で出す。`,...Q.parameters?.docs?.description}}},$=[`Default`,`RestoredDocument`,`MultipleDocuments`,`OpenFailedWhileOpened`]}))();export{Y as Default,Z as MultipleDocuments,Q as OpenFailedWhileOpened,X as RestoredDocument,$ as __namedExportsOrder,$e as default};