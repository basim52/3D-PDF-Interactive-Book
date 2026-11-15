import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Layers,
  RotateCcw,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Target,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Model3DId } from '../types/book';
import { buildScienceModel, BuiltScienceModel, ModelPartInfo } from '../three/models';

interface Science3DStageProps {
  modelId: Model3DId;
  focusPartKey?: string;
  titleOverride?: string;
  hintOverride?: string;
  compact?: boolean;
  isSoloMode?: boolean;
  onToggleSoloMode?: () => void;
}

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|Software Rasterizer|Microsoft Basic Render/i.test(renderer);
  } catch {
    return false;
  }
}

export const Science3DStage: React.FC<Science3DStageProps> = ({
  modelId,
  focusPartKey,
  titleOverride,
  hintOverride,
  compact = false,
  isSoloMode = false,
  onToggleSoloMode,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const builtRef = useRef<BuiltScienceModel | null>(null);
  const selectedKeyRef = useRef<string | null>(focusPartKey ?? null);
  const explodeTargetRef = useRef(0);
  const explodeCurrentRef = useRef(0);
  const variantRef = useRef(0);
  const autoRotateRef = useRef(true);
  const resetCamFlagRef = useRef(false);

  const [partsMeta, setPartsMeta] = useState<Array<{ key: string; labelAr: string; descAr: string }>>([]);
  const [selectedPart, setSelectedPart] = useState<{ key: string; labelAr: string; descAr: string } | null>(null);
  const [modelTitle, setModelTitle] = useState('');
  const [hasVariant, setHasVariant] = useState(false);
  const [variantLabels, setVariantLabels] = useState<[string, string] | undefined>(undefined);
  const [variant, setVariant] = useState(0);
  const [explodeVal, setExplodeVal] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockOpen, setDockOpen] = useState(true);
  const [textVisible, setTextVisible] = useState(true);
  const [webglError, setWebglError] = useState(false);

  // Interactive 3D Find-the-Part Challenge
  const [quiz3dActive, setQuiz3dActive] = useState(false);
  const [quiz3dStep, setQuiz3dStep] = useState(0);
  const [quiz3dScore, setQuiz3dScore] = useState(0);
  const [quiz3dFeedback, setQuiz3dFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [quiz3dLastWrongLabel, setQuiz3dLastWrongLabel] = useState('');
  const onMeshPickRef = useRef<(key: string, labelAr: string, descAr: string) => void>(() => {});

  useEffect(() => {
    explodeTargetRef.current = explodeVal;
  }, [explodeVal]);

  useEffect(() => {
    variantRef.current = variant;
  }, [variant]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Reset 3D part challenge when model changes
  useEffect(() => {
    setQuiz3dActive(false);
    setQuiz3dStep(0);
    setQuiz3dScore(0);
    setQuiz3dFeedback(null);
    setQuiz3dLastWrongLabel('');
  }, [modelId]);

  useEffect(() => {
    onMeshPickRef.current = (key: string, labelAr: string, descAr: string) => {
      if (quiz3dActive && partsMeta.length > 0) {
        const target = partsMeta[quiz3dStep];
        if (!target) return;
        selectedKeyRef.current = key;
        if (key === target.key) {
          setQuiz3dFeedback('correct');
          setQuiz3dScore((s) => s + 1);
          setSelectedPart({ key, labelAr, descAr });
          window.setTimeout(() => {
            setQuiz3dFeedback(null);
            setQuiz3dLastWrongLabel('');
            if (quiz3dStep + 1 < partsMeta.length) {
              setQuiz3dStep((st) => st + 1);
            } else {
              setQuiz3dStep(partsMeta.length);
            }
          }, 950);
        } else {
          setQuiz3dFeedback('wrong');
          setQuiz3dLastWrongLabel(labelAr);
        }
        return;
      }
      selectedKeyRef.current = key;
      setSelectedPart({ key, labelAr, descAr });
    };
  }, [quiz3dActive, quiz3dStep, partsMeta]);

  // Sync focus part when page changes
  useEffect(() => {
    if (quiz3dActive) return;
    selectedKeyRef.current = focusPartKey ?? null;
    if (focusPartKey && partsMeta.length > 0) {
      const found = partsMeta.find((p) => p.key === focusPartKey);
      if (found) setSelectedPart(found);
    } else if (!focusPartKey && partsMeta.length > 0) {
      setSelectedPart(partsMeta[0]);
      selectedKeyRef.current = partsMeta[0].key;
    }
  }, [focusPartKey, partsMeta, quiz3dActive]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 240);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    if (!isSoftwareGl) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eef2f6');
    scene.fog = new THREE.Fog('#eef2f6', 10, 22);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 2.4;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;

    // Warm key light + cool hemisphere fill
    const hemiLight = new THREE.HemisphereLight('#dbeafe', '#cbd5e1', 0.55);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#fff7ed', 1.65);
    keyLight.position.set(4.5, 7.5, 5.2);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 20;
      const d = 4.2;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    // Architectural pedestal disc & subtle grid
    const floorGeo = new THREE.CylinderGeometry(3.4, 3.6, 0.06, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      roughness: 0.88,
      metalness: 0.05,
    });
    const floorDisc = new THREE.Mesh(floorGeo, floorMat);
    floorDisc.position.y = -0.03;
    floorDisc.receiveShadow = true;
    scene.add(floorDisc);

    const ringGeo = new THREE.RingGeometry(2.65, 2.7, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#94a3b8', side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    // Build initial model
    const built = buildScienceModel(modelId);
    builtRef.current = built;
    scene.add(built.group);

    camera.position.set(...built.defaultCameraPos);
    controls.target.set(...built.defaultTarget);
    controls.update();

    const metaList = built.parts.map((p: ModelPartInfo) => ({
      key: p.key,
      labelAr: p.labelAr,
      descAr: p.descAr,
    }));
    setPartsMeta(metaList);
    setModelTitle(built.titleAr);
    setHasVariant(Boolean(built.hasVariantToggle));
    setVariantLabels(built.variantLabels);
    setVariant(0);
    setExplodeVal(0);
    explodeTargetRef.current = 0;
    explodeCurrentRef.current = 0;

    if (focusPartKey) {
      const found = metaList.find((m) => m.key === focusPartKey) ?? metaList[0] ?? null;
      setSelectedPart(found);
      selectedKeyRef.current = found?.key ?? null;
    } else {
      setSelectedPart(metaList[0] ?? null);
      selectedKeyRef.current = metaList[0]?.key ?? null;
    }

    // Raycaster for part clicks
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (ev: PointerEvent) => {
      pointerDownPos = { x: ev.clientX, y: ev.clientY };
    };

    const onPointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - pointerDownPos.x, ev.clientY - pointerDownPos.y);
      if (dist > 6 || !builtRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(builtRef.current.group.children, true);
      for (const hit of hits) {
        const key = hit.object.userData?.partKey as string | undefined;
        if (key) {
          onMeshPickRef.current(
            key,
            hit.object.userData.labelAr || key,
            hit.object.userData.descAr || '',
          );
          break;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 240);
      const h = Math.max(container.clientHeight, 200);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Render loop with software GL pacing
    let rafId = 0;
    let timerId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    const highlightSelected = () => {
      const currentBuilt = builtRef.current;
      if (!currentBuilt) return;
      const sel = selectedKeyRef.current;
      currentBuilt.group.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.isMesh && m.material && 'emissive' in m.material) {
          const std = m.material as THREE.MeshStandardMaterial;
          if (!std.userData.origEmissive) {
            std.userData.origEmissive = std.emissive.clone();
            std.userData.origEmissiveInt = std.emissiveIntensity;
          }
          if (sel && m.userData?.partKey === sel) {
            std.emissive.set('#0ea5e9');
            std.emissiveIntensity = 0.24;
          } else {
            std.emissive.copy(std.userData.origEmissive);
            std.emissiveIntensity = std.userData.origEmissiveInt ?? 0;
          }
        }
      });
    };

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.elapsedTime;

      explodeCurrentRef.current = THREE.MathUtils.damp(
        explodeCurrentRef.current,
        explodeTargetRef.current,
        6,
        delta,
      );

      if (resetCamFlagRef.current && builtRef.current) {
        const [cx, cy, cz] = builtRef.current.defaultCameraPos;
        const [tx, ty, tz] = builtRef.current.defaultTarget;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, cx, 7, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, cy, 7, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, cz, 7, delta);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, tx, 7, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, ty, 7, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, tz, 7, delta);
        if (camera.position.distanceTo(new THREE.Vector3(cx, cy, cz)) < 0.05) {
          resetCamFlagRef.current = false;
        }
      }

      if (builtRef.current) {
        builtRef.current.update(elapsed, explodeCurrentRef.current, variantRef.current);
        if (autoRotateRef.current) {
          builtRef.current.group.rotation.y += delta * 0.28;
        }
      }

      highlightSelected();
      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        timerId = window.setTimeout(() => {
          if (!disposed) rafId = requestAnimationFrame(tick);
        }, 32);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      built.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      envTarget.dispose();
      renderer.dispose();
      builtRef.current = null;
    };
  }, [modelId]);

  const handleSelectChip = (part: { key: string; labelAr: string; descAr: string }) => {
    selectedKeyRef.current = part.key;
    setSelectedPart(part);
  };

  if (webglError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 p-8 text-center text-slate-700 h-full min-h-[280px]">
        <Layers className="w-8 h-8 text-teal-700 mb-3" />
        <p className="font-bold text-base mb-1">{titleOverride || 'العرض الثلاثي الأبعاد'}</p>
        <p className="text-sm text-slate-600 max-w-md">{hintOverride || 'تعذر تفعيل محرك الرسوم الثلاثية الأبعاد في هذا المتصفح، يمكنك متابعة الشرح التفاعلي وصفحات الكتاب والأسئلة.'}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs select-none">
      {/* Unobstructed 3D WebGL Canvas Area */}
      <div
        className={`relative w-full bg-[#eef2f6] ${
          isSoloMode
            ? 'h-[62vh] min-h-[440px]'
            : compact
              ? 'h-[320px] sm:h-[360px]'
              : 'h-[480px] lg:h-[540px]'
        }`}
      >
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Corner Action Controls — Top Bar Over Canvas */}
        <div className="pointer-events-none absolute top-3 right-3 left-3 flex items-start justify-between gap-2 z-10">
          {textVisible ? (
            <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white px-3.5 py-2 shadow-sm max-w-[66%]">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{titleOverride || modelTitle}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2">
                {hintOverride || 'اسحب لتدوير المجسم، وقرّب بالعجلة، واضغط على أي جزء لقراءة شرحه العلمي.'}
              </p>
            </div>
          ) : (
            <div />
          )}

          <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setTextVisible((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
              title={textVisible ? 'إخفاء الكلام والشرح وعرض المجسم صافيًا' : 'إظهار الكلام والشرح'}
            >
              {textVisible ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-teal-700" />
                  <span>إخفاء الكلام</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-teal-700" />
                  <span>إظهار الكلام</span>
                </>
              )}
            </button>

            {onToggleSoloMode && (
              <button
                type="button"
                onClick={onToggleSoloMode}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
                title={isSoloMode ? 'العودة لعرض الكتاب والمجسم معًا' : 'عرض المجسم لوحده بملء الشاشة'}
              >
                {isSoloMode ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>مع الكتاب</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>المجسم لوحده</span>
                  </>
                )}
              </button>
            )}

            {textVisible && (
              <button
                type="button"
                onClick={() => setDockOpen((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                title={dockOpen ? 'طي لوحة التحكم' : 'فتح لوحة التحكم'}
              >
                <span>أدوات ٣D</span>
                {dockOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attached Explanation & Control Panel Below the 3D Canvas (Zero overlap with 3D model!) */}
      {textVisible && dockOpen && (
        <div className="border-t border-slate-200 bg-white p-3.5">
          {/* Interactive 3D Challenge Mode Bar */}
          {quiz3dActive ? (
            <div className="mb-3 rounded-lg border border-teal-200 bg-teal-50/70 p-3">
              {quiz3dStep >= partsMeta.length ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-teal-950">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>
                      أحسنت! حدّدت {quiz3dScore} من {partsMeta.length} أجزاء بنجاح على المجسم.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuiz3dStep(0);
                        setQuiz3dScore(0);
                        setQuiz3dFeedback(null);
                      }}
                      className="rounded-md bg-teal-700 px-3 py-1 text-xs font-bold text-white hover:bg-teal-800"
                    >
                      إعادة التحدي
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuiz3dActive(false)}
                      className="rounded-md border border-stone-300 bg-white px-3 py-1 text-xs font-bold text-stone-700"
                    >
                      إنهاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-teal-950">
                      <Target className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>
                        اضغط مباشرة على المجسم لتحديد: «{partsMeta[quiz3dStep]?.labelAr}»
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-teal-800 tabular-nums">
                        {quiz3dStep + 1} / {partsMeta.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuiz3dActive(false)}
                        className="rounded border border-teal-300 bg-white px-2 py-0.5 text-[11px] font-bold text-teal-900"
                      >
                        خروج من التحدي
                      </button>
                    </div>
                  </div>
                  {quiz3dFeedback === 'correct' && (
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>إجابة صحيحة! هذا هو الجزء المطلوب.</span>
                    </p>
                  )}
                  {quiz3dFeedback === 'wrong' && (
                    <p className="text-xs font-bold text-rose-700 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>ضغطت على «{quiz3dLastWrongLabel}» — جرّب تدوير المجسم واضغط على الجزء المطلوب.</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Selected Part Explanation */
            selectedPart && (
              <div className="mb-2.5 pb-2 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900">{selectedPart.labelAr}</span>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {partsMeta.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuiz3dActive(true);
                          setQuiz3dStep(0);
                          setQuiz3dScore(0);
                          setQuiz3dFeedback(null);
                          setQuiz3dLastWrongLabel('');
                          selectedKeyRef.current = null;
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-teal-700/30 bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                      >
                        <Target className="w-3 h-3" />
                        <span>اختبرني على المجسم</span>
                      </button>
                    )}
                    <span className="text-[11px] font-medium text-teal-700 tabular-nums">
                      {partsMeta.findIndex((p) => p.key === selectedPart.key) + 1} / {partsMeta.length} أجزاء
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{selectedPart.descAr}</p>
              </div>
            )
          )}

          {/* Part Quick-Select Row (Hidden during active 3D find-the-part quiz) */}
          {!quiz3dActive && partsMeta.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-slate-100">
              {partsMeta.map((part) => {
                const active = selectedPart?.key === part.key;
                return (
                  <button
                    key={part.key}
                    type="button"
                    onClick={() => handleSelectChip(part)}
                    className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {part.labelAr}
                  </button>
                );
              })}
            </div>
          )}

          {/* Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[160px]">
              <label htmlFor={`explode-${modelId}`} className="text-xs font-semibold text-slate-700 shrink-0">
                تفكيك الأجزاء:
              </label>
              <input
                id={`explode-${modelId}`}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={explodeVal}
                onChange={(e) => setExplodeVal(parseFloat(e.target.value))}
                className="w-full max-w-[160px] accent-teal-700 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-500 tabular-nums w-9 text-left">
                {Math.round(explodeVal * 100)}٪
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasVariant && variantLabels && (
                <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5">
                  {variantLabels.map((lbl, idx) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setVariant(idx)}
                      className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                        variant === idx ? 'bg-teal-700 text-white' : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setAutoRotate((r) => !r)}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{autoRotate ? 'إيقاف التدوير' : 'تدوير تلقائي'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetCamFlagRef.current = true;
                  setExplodeVal(0);
                }}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                title="إعادة ضبط الزاوية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة الضبط</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
