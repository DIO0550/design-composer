import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{i as n,r}from"./ArrayEx-Idw6gcxx.js";import{n as i,t as a}from"./Option-BeyCqz6s.js";import{n as o,r as s,t as ee}from"./document-error-list-BGMblg8R.js";import{i as c,n as l,r as u,t as d}from"./file-paths-BfN7DJwb.js";import{n as te,t as ne}from"./document-json-Bmyidowq.js";import{i as re,n as ie,r as ae,t as oe}from"./document-tab-bar-JiNCTQ3-.js";import{f as se,g as ce,h as le,m as ue}from"./elapsed-CHoNCllU.js";import{a as de,c as f,i as fe,l as p,n as pe,o as me,r as he,s as m,t as ge}from"./opened-document-editor-dL43NVY9.js";import{a as _e,i as h}from"./document-ipc-6uLAUEpw.js";import{a as ve,c as ye,i as be,l as xe,n as Se,o as g,t as Ce,u as we}from"./document-start-rVSZgg6-.js";import{n as Te,t as Ee}from"./opened-documents-DyPEFZOz.js";import{a as De,c as _,o as v,s as Oe,u as ke}from"./use-canvas-view-D7jkuKrH.js";import{i as Ae,t as je}from"./document-open-failure-8hfhiOz6.js";function Me(e){let t=Object.values(y).find(t=>t===e);return a.fromNullable(t)}var y,b,Ne,Pe=e((()=>{i(),n(),y={Open:`open`,Create:`create`,CloseTab:`close-tab`},b=`document-menu`,Ne={create(e){return{async subscribeCommand(t){try{let n=await e.listen(b,e=>{let n=Me(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}}})),Fe,Ie=e((()=>{f(),Pe(),Fe={create(){let e=m.create(b);return{menu:Ne.create(e.ipc),choose:e.deliver,deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}}));function Le(e){if(typeof e!=`object`||!e)return!1;let{message:t}=e;return typeof t==`string`}function Re(e){return Le(e)?e:{message:String(e)}}function ze(e){return e===null?r.ok(a.none):typeof e==`string`?r.ok(a.some(e)):r.err({message:`load_app_state が文字列でも null でもない値を返した: ${String(e)}`})}var x,Be=e((()=>{_e(),i(),n(),x={create(e){let t=h.caller(e,Re);return{async load(){return r.flatMap(await t(`load_app_state`,{}),ze)},async save(e){return r.map(await t(`save_app_state`,{content:e}),()=>void 0)}}}}}));function S(e){return Promise.reject({message:`app-state.json: ${e}`})}var C,Ve=e((()=>{f(),i(),Be(),C={create(e){let t=e,n=!1,r=!1,i=()=>n?S(`読み込みが拒まれた`):Promise.resolve(t??null),o=e=>typeof e==`string`?r?S(`書き込みが拒まれた`):(t=e,Promise.resolve(void 0)):p(`save_app_state: content が文字列でない`);return{ipc:x.create({invoke(e,t){switch(e){case`load_app_state`:return i();case`save_app_state`:return o(t.content);default:return p(`Command ${e} not found`)}},listen(e){return p(`Event ${e} not emitted`)}}),storedContent(){return a.fromNullable(t)},denyLoad(){n=!0},denySave(){r=!0}}}}})),w,He=e((()=>{_e(),n(),w={create(e){let t=h.caller(e,e=>({message:String(e)}));return{async close(){return r.map(await t(`close_current_window`,{}),()=>void 0)}}}}})),T,Ue=e((()=>{f(),He(),T={create(){let e=!1,t=!1,n=()=>t?p(`close_current_window: ウィンドウを閉じられない`):(e=!0,Promise.resolve(void 0));return{appWindow:w.create({invoke(e){return e===`close_current_window`?n():p(`Command ${e} not found`)},listen(e){return p(`Event ${e} not emitted`)}}),isWindowClosed(){return e},denyClose(){t=!0}}}}}));function We(e){if(!a.isSome(e))return r.ok(a.none);let t=u.create(e.value);return a.isSome(t)?r.ok(t):r.err({message:`選ばれたパスがファイル名を持たない: ${e.value}`})}async function E(e){try{return We(await e())}catch(e){return r.err({message:String(e)})}}var D,O,k,Ge=e((()=>{c(),i(),n(),D={name:`Design Composer ドキュメント`,extensions:[`dcmp`]},O=`untitled.dcmp`,k={create(e){return{chooseOpenPath(){return E(()=>e.chooseOpenPath(D))},chooseSavePath(){return E(()=>e.chooseSavePath(D,O))}}}}}));function A(e){switch(e.kind){case`chosen`:return Promise.resolve(a.some(e.path));case`canceled`:return Promise.resolve(a.none);case`failed`:return Promise.reject(Error(e.message))}}var j,M,N,Ke=e((()=>{i(),Ge(),j={kind:`canceled`},M={Canceled:j,chosen(e){return{kind:`chosen`,path:e}},failed(e){return{kind:`failed`,message:e}}},N={create(e){return{dialog:k.create({chooseOpenPath(){return A(e.open)},chooseSavePath(){return A(e.save)}})}}}}));function qe(e){if(typeof e!=`object`||!e)return a.none;let{paths:t}=e;if(!Array.isArray(t)||!t.every(e=>typeof e==`string`))return a.none;let n=t.flatMap(e=>{let t=u.create(e);return a.isSome(t)?[t.value]:[]});return n.length>0?a.some(n):a.none}var P,F,Je=e((()=>{c(),i(),n(),P=`tauri://drag-drop`,F={create(e){return{async subscribeDropped(t){try{let n=await e.listen(P,e=>{let n=qe(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}}})),I,Ye=e((()=>{f(),Je(),I={create(){let e=m.create(P);return{drop:F.create(e.ipc),dropFiles(t){e.deliver({paths:[...t],position:{x:0,y:0}})},deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}})),Xe=e((()=>{Ae(),Se(),ie(),ye(),be()}));function Ze(e){ke(Array.from({length:L},(t,n)=>({shortcut:{kind:Oe.PhysicalKey,codes:[`Digit${n+1}`],withCommandKey:!0,withShiftKey:!1},onPress:()=>e(n)})))}var L,Qe=e((()=>{_(),L=9}));function $e({opened:e,clock:t,ipc:n}){let r=Ee.activePath(e);return(0,z.jsx)(`div`,{className:`min-h-0 flex-1`,children:Ee.documents(e).map(e=>{let i=e.path===r;return(0,z.jsx)(`div`,{hidden:!i,className:`h-full`,children:(0,z.jsx)(De,{scope:i?v.Listening:v.Suspended,children:(0,z.jsx)(ge,{clock:t,ipc:n,opened:e})})},e.path)})})}function R({clock:e,ports:t}){let{session:n,recentPaths:r,recentFilesFailure:i,actions:s,tabActions:c,commandFailure:l}=ve(t),u=g.failure(n);return Ze(c.activateAt),g.hasOpenedDocuments(n)?(0,z.jsxs)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:[(0,z.jsx)(oe,{opened:n.documents.value,onSelect:c.activate,onClose:c.close,onReorder:c.reorder}),a.isSome(u)&&(0,z.jsx)(je,{failure:u.value}),(0,z.jsx)($e,{opened:n.documents.value,clock:e,ipc:t.ipc})]}):(0,z.jsx)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:(0,z.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,z.jsx)(Ce,{attempt:n.attempt,actions:s,recentPaths:r,recentFilesFailure:i,commandFailure:l,renderErrors:e=>(0,z.jsx)(ee,{errors:e,origin:o.UnopenedFile})})})})}var z,et=e((()=>{Te(),s(),pe(),Xe(),Qe(),_(),i(),z=t();try{R.displayName=`EditorScreen`,R.__docgenInfo={description:`アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
（docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。

実物の組み立ては \`app/\` が持つ（rules/architecture.md）。`,displayName:`EditorScreen`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/editor-screen/index.tsx`,methods:[],props:{clock:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`clock`,required:!0,tags:{},type:{name:`Readonly<{ now(): Readonly<{ epochMs: number; }>; subscribeSeconds(listener: () => void): () => void; }>`}},ports:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`ports`,required:!0,tags:{},type:{name:`Readonly<{ ipc: Readonly<{ load(path: FilePath): Promise<Result<string, Readonly<{ kind: DocumentIpcErrorKind; message: string; }>>>; save(path: FilePath, content: string): Promise<...>; watch(path: FilePath): Promise<...>; unwatch(path: FilePath): Promise<...>; subscribeChanged(listener: (changed: Readonly<...>) =>...`}}},tags:{}}}catch{}}));function B(e,t){let n=he.create(e),r=N.create({open:M.chosen(W),save:M.chosen(`/work/untitled.dcmp`)}),i=I.create(),a=C.create(t===void 0?void 0:xe.serialize({recentPaths:t}));return{ports:{ipc:n.ipc,dialog:r.dialog,menu:Fe.create().menu,drop:i.drop,appState:a.ipc,appWindow:T.create().appWindow},drop:i}}var V,H,U,W,G,tt,K,nt,q,J,rt,it,Y,X,Z,Q,$;e((()=>{l(),re(),ue(),ce(),Ie(),Ve(),we(),Ue(),me(),Ke(),fe(),te(),Ye(),et(),{expect:V,screen:H,waitFor:U}=__STORYBOOK_MODULE_TEST__,W=d(`/work/sample.dcmp`),G=d(`/work/settings.dcmp`),tt=d(`/work/missing.dcmp`),K={[W]:ne.serialize(le.document(se)),[G]:ae(`settings`)},nt=B(K),q=B(K),J=B(K),rt=B(K,[W]),it={title:`features/editor/EditorScreen`,component:R,parameters:{layout:`fullscreen`},args:{clock:de.create().clock,ports:nt.ports}},Y={name:`開始画面`},X={name:`前回のファイルを開いた直後`,args:{ports:rt.ports}},Z={name:`複数開いている`,args:{ports:q.ports},play:async()=>{await U(()=>{V(H.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),q.drop.dropFiles([W,G]),await U(()=>{V(H.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()})}},Q={name:`開いたまま開けなかった`,args:{ports:J.ports},play:async()=>{await U(()=>{V(H.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),J.drop.dropFiles([W]),await U(()=>{V(H.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()}),J.drop.dropFiles([tt]),await U(()=>{V(H.getByRole(`alert`,{name:`ファイルを開けませんでした`})).toBeDefined()})}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
理由だけを帯で出す。`,...Q.parameters?.docs?.description}}},$=[`Default`,`RestoredDocument`,`MultipleDocuments`,`OpenFailedWhileOpened`]}))();export{Y as Default,Z as MultipleDocuments,Q as OpenFailedWhileOpened,X as RestoredDocument,$ as __namedExportsOrder,it as default};