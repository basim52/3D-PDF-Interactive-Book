import * as THREE from 'three';
import { Model3DId } from '../types/book';

export interface ModelPartInfo {
  key: string;
  labelAr: string;
  descAr: string;
  mesh: THREE.Object3D;
}

export interface BuiltScienceModel {
  id: Model3DId;
  titleAr: string;
  group: THREE.Group;
  parts: ModelPartInfo[];
  hasVariantToggle?: boolean;
  variantLabels?: [string, string];
  defaultCameraPos: [number, number, number];
  defaultTarget: [number, number, number];
  update: (elapsed: number, explode: number, variant: number) => void;
  dispose: () => void;
}

function createSolarGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f294d';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createBookCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#0f766e');
  grad.addColorStop(1, '#0d4f49');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, 464, 464);

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('العلوم', 256, 175);

  ctx.fillStyle = '#d1fae5';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('الصف السادس الابتدائي', 256, 240);
  ctx.font = '22px sans-serif';
  ctx.fillText('الجزء الأول — شرح ٣D تفاعلي', 256, 295);

  ctx.strokeStyle = '#fcd34d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 390, 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(256, 390, 70, 22, Math.PI / 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(256, 390, 70, 22, -Math.PI / 5, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createSoilTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#6b4f35';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 650; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 1 + Math.random() * 3.5;
    ctx.fillStyle = i % 3 === 0 ? '#4a3525' : i % 3 === 1 ? '#8c6947' : '#a3825d';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function registerPart(
  mesh: THREE.Object3D,
  parts: ModelPartInfo[],
  key: string,
  labelAr: string,
  descAr: string,
  explodeDir: [number, number, number] = [0, 0, 0],
) {
  mesh.userData.partKey = key;
  mesh.userData.labelAr = labelAr;
  mesh.userData.descAr = descAr;
  mesh.userData.basePos = mesh.position.clone();
  mesh.userData.explodeDir = new THREE.Vector3(...explodeDir);
  mesh.traverse((child) => {
    child.userData.partKey = key;
    child.userData.labelAr = labelAr;
    child.userData.descAr = descAr;
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  parts.push({ key, labelAr, descAr, mesh });
}

function applyExplode(parts: ModelPartInfo[], explode: number) {
  for (const p of parts) {
    const base = p.mesh.userData.basePos as THREE.Vector3 | undefined;
    const dir = p.mesh.userData.explodeDir as THREE.Vector3 | undefined;
    if (base && dir) {
      p.mesh.position.copy(base).addScaledVector(dir, explode);
    }
  }
}

export function buildScienceModel(id: Model3DId): BuiltScienceModel {
  const group = new THREE.Group();
  const parts: ModelPartInfo[] = [];
  const textures: THREE.Texture[] = [];

  let titleAr = 'نموذج ثلاثي الأبعاد';
  let hasVariantToggle = false;
  let variantLabels: [string, string] | undefined;
  let defaultCameraPos: [number, number, number] = [0, 2.2, 5.2];
  let defaultTarget: [number, number, number] = [0, 0.85, 0];
  let updater: (elapsed: number, explode: number, variant: number) => void = (_, explode) => {
    applyExplode(parts, explode);
  };

  if (id === 'book_overview') {
    titleAr = 'المجسم التفاعلي الشامل لمنهج العلوم';
    defaultCameraPos = [0, 2.5, 5.0];
    defaultTarget = [0, 0.8, 0];

    const coverTex = createBookCoverTexture();
    textures.push(coverTex);

    const deskBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.2, 0.14, 48),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.7, metalness: 0.05 }),
    );
    deskBase.position.set(0, 0.07, 0);
    registerPart(deskBase, parts, 'base', 'منصة الكتاب التفاعلي', 'منصة العرض الدراسية التي تجمع وحدات المنهج الثلاث.', [0, -0.1, 0]);
    group.add(deskBase);

    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.22, 2.4),
      new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.5, metalness: 0.1 }),
    );
    spine.position.set(0, 0.25, 0);
    registerPart(spine, parts, 'spine', 'كعب الكتاب العربي (من اليمين لليسار)', 'يربط الكعب صفحات المنهج العربي الـ ٢٠٧ ليتصفح من اليمين إلى اليسار.', [0, -0.15, 0]);
    group.add(spine);

    const rightWing = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.12, 2.3),
      new THREE.MeshStandardMaterial({ color: '#fef9ef', roughness: 0.88 }),
    );
    rightWing.position.set(0.86, 0.34, 0);
    rightWing.rotation.z = 0.09;
    registerPart(rightWing, parts, 'right_pages', 'الصفحات الزوجية (اليمين)', 'تظهر الصفحات الزوجية (٨، ١٠، ١٢...) في الجهة اليمنى من الكتاب المفتوح.', [0.55, 0.1, 0]);
    group.add(rightWing);

    const leftWing = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.12, 2.3),
      new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.88 }),
    );
    leftWing.position.set(-0.86, 0.34, 0);
    leftWing.rotation.z = -0.09;
    registerPart(leftWing, parts, 'left_pages', 'الصفحات الفردية (اليسار)', 'تظهر الصفحات الفردية (٣، ٥، ٧...) في الجهة اليسرى مع الأسئلة التفاعلية.', [-0.55, 0.1, 0]);
    group.add(leftWing);

    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.3, 0.08),
      new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.45 }),
    );
    plaque.position.set(0, 1.35, -0.35);
    registerPart(plaque, parts, 'cover_emblem', 'غلاف العلوم — الصف السادس', 'الجزء الأول من مقرر العلوم: تنوع الحياة، عمليات الحياة، والأنظمة البيئية.', [0, 0.5, -0.4]);
    group.add(plaque);

    const orbitAtom = new THREE.Group();
    orbitAtom.position.set(0, 1.45, 0.55);
    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 24, 24),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.35, metalness: 0.25 }),
    );
    orbitAtom.add(nucleus);
    const ringMat = new THREE.MeshStandardMaterial({ color: '#14b8a6', roughness: 0.3, metalness: 0.5 });
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 12, 48), ringMat);
      ring.rotation.x = Math.PI / 3;
      ring.rotation.y = (r * Math.PI) / 3;
      orbitAtom.add(ring);
    }
    registerPart(orbitAtom, parts, 'atom_holo', 'شعار العلوم ثلاثي الأبعاد', 'يرمز للتكامل بين دراسة الخلايا والحياة والبيئة والطاقة.', [0, 0.7, 0.4]);
    group.add(orbitAtom);

    updater = (elapsed, explode) => {
      applyExplode(parts, explode);
      orbitAtom.rotation.y = elapsed * 0.7;
      orbitAtom.position.y = 1.45 + explode * 0.7 + Math.sin(elapsed * 2) * 0.06;
    };
  } else if (id === 'comet_method') {
    titleAr = 'المذنب (هيل-بوب) والطريقة العلمية';
    defaultCameraPos = [0.6, 2.0, 5.3];
    defaultTarget = [0, 0.95, 0];

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 32, 32),
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        emissive: '#f97316',
        emissiveIntensity: 0.85,
        roughness: 0.3,
      }),
    );
    sun.position.set(1.9, 1.35, -0.5);
    registerPart(sun, parts, 'sun', 'الشمس (مصدر الحرارة والرياح الشمسية)', 'تُسبب حرارة الشمس تبخر جليد المذنب فتتشكل الهالة والذيل المعاكس للشمس.', [0.7, 0.35, 0]);
    group.add(sun);

    const cometHead = new THREE.Group();
    cometHead.position.set(0.2, 1.05, 0);
    const nucleus = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.32, 1),
      new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.85, metalness: 0.1 }),
    );
    const coma = new THREE.Mesh(
      new THREE.SphereGeometry(0.56, 28, 28),
      new THREE.MeshPhysicalMaterial({
        color: '#bae6fd',
        transparent: true,
        opacity: 0.55,
        roughness: 0.15,
        transmission: 0.3,
      }),
    );
    cometHead.add(nucleus, coma);
    registerPart(cometHead, parts, 'comet_head', 'نواة المذنب وهالته الغازية', 'النواة كتلة من الجليد والصخور والغبار؛ وعند اقترابها من الشمس تتبخر مكونة هالة ساطعة.', [0, 0.3, 0.4]);
    group.add(cometHead);

    const cometTail = new THREE.Group();
    cometTail.position.set(-0.2, 1.05, 0);
    const ionTail = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 2.6, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.48,
        side: THREE.DoubleSide,
        roughness: 0.3,
      }),
    );
    ionTail.rotation.z = Math.PI / 2;
    ionTail.position.set(-1.3, 0.12, 0);

    const dustTail = new THREE.Mesh(
      new THREE.ConeGeometry(0.52, 2.35, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: '#fef08a',
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        roughness: 0.5,
      }),
    );
    dustTail.rotation.z = Math.PI / 2 + 0.16;
    dustTail.position.set(-1.2, -0.14, 0.15);
    cometTail.add(ionTail, dustTail);
    registerPart(cometTail, parts, 'comet_tail', 'ذيل المذنب (الأيوني والغباري)', 'يمتد الذيل دائمًا بعيدًا عن الشمس بفعل ضغط الإشعاع والرياح الشمسية ويصل ملايين الكيلومترات.', [-0.85, 0, 0]);
    group.add(cometTail);

    const orbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.025, 10, 64),
      new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.5 }),
    );
    orbitRing.rotation.x = Math.PI / 2.2;
    orbitRing.scale.set(1.3, 0.72, 1);
    orbitRing.position.set(0.3, 0.5, 0);
    registerPart(orbitRing, parts, 'orbit', 'المدار الإهليلجي للمذنب', 'يدور المذنب في مدار بيضاوي طويل؛ ومذنب هيل-بوب يعود كل ٢٣٩٢ سنة تقريبًا.', [0, -0.45, 0]);
    group.add(orbitRing);

    updater = (elapsed, explode) => {
      applyExplode(parts, explode);
      cometHead.rotation.y = elapsed * 0.5;
      sun.rotation.y = elapsed * 0.25;
      cometTail.scale.y = 1 + Math.sin(elapsed * 3) * 0.04;
    };
  } else if (id === 'cell_microscope') {
    titleAr = 'المجهر المركب ومستكشف الخلية';
    defaultCameraPos = [2.4, 2.2, 4.4];
    defaultTarget = [0, 1.3, 0];

    const metalMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.35, metalness: 0.7 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.2, metalness: 0.9 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: '#67e8f9', roughness: 0.1, transmission: 0.65, transparent: true, opacity: 0.8 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 1.9), metalMat);
    base.position.set(0, 0.11, 0);
    registerPart(base, parts, 'base', 'القاعدة', 'الجزء الثقيل العريض الذي يرتكز عليه المجهر المركب بثبات على الطاولة.', [0, -0.35, 0]);
    group.add(base);

    const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 28), chromeMat);
    mirror.position.set(0, 0.42, 0.32);
    mirror.rotation.x = Math.PI / 5;
    registerPart(mirror, parts, 'mirror', 'المرآة (مصدر الإضاءة)', 'تعكس الضوء نحو العينة على المنضدة — ويُحذّر من توجيهها نحو الشمس مباشرة.', [0, -0.1, 0.6]);
    group.add(mirror);

    const arm = new THREE.Group();
    arm.position.set(0, 1.15, -0.58);
    const armPillar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.9, 0.32), metalMat);
    const knobCoarse = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.38, 20), chromeMat);
    knobCoarse.rotation.z = Math.PI / 2;
    knobCoarse.position.set(0, 0.2, 0.04);
    const knobFine = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.46, 20), new THREE.MeshStandardMaterial({ color: '#0d9488', roughness: 0.4 }));
    knobFine.rotation.z = Math.PI / 2;
    knobFine.position.set(0, -0.18, 0.04);
    arm.add(armPillar, knobCoarse, knobFine);
    registerPart(arm, parts, 'arm', 'الذراع والضابطان الكبير والدقيق', 'يُمسك المجهر من الذراع، ويحرك الضابطان الأنبوب لتوضيح رؤية الشريحة بدقة.', [0, 0, -0.75]);
    group.add(arm);

    const stageGroup = new THREE.Group();
    stageGroup.position.set(0, 1.0, 0.26);
    const stagePlate = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 1.05), metalMat);
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.3), glassMat);
    slide.position.set(0, 0.07, 0);
    const clipL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.32), chromeMat);
    clipL.position.set(-0.34, 0.075, 0.05);
    const clipR = clipL.clone();
    clipR.position.x = 0.34;
    stageGroup.add(stagePlate, slide, clipL, clipR);
    registerPart(stageGroup, parts, 'stage', 'المنضدة والضاغطان والشريحة', 'توضع الشريحة الزجاجية للعينة فوق المنضدة وتُثبت بالضاغطين المعدنيين.', [0.6, 0, 0.35]);
    group.add(stageGroup);

    const optics = new THREE.Group();
    optics.position.set(0, 2.05, 0.26);
    const bodyTube = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.85, 24), metalMat);
    const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.16, 0.28, 24), chromeMat);
    eyepiece.position.y = 0.56;
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 24), chromeMat);
    turret.position.y = -0.45;
    for (let i = 0; i < 3; i++) {
      const ang = (i * Math.PI * 2) / 3;
      const obj = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.32 + i * 0.08, 16), chromeMat);
      obj.position.set(Math.cos(ang) * 0.16, -0.66, Math.sin(ang) * 0.16);
      optics.add(obj);
    }
    optics.add(bodyTube, eyepiece, turret);
    registerPart(optics, parts, 'microscope_lens', 'العدسة العينية والعدسات الشيئية', 'تعمل العدسات الزجاجية المتعددة معًا لتكبير الخلايا الدقيقة مئات المرات (قوة عينية × قوة شيئية).', [0, 0.75, 0.25]);
    group.add(optics);
  } else if (id === 'animal_plant_cell') {
    titleAr = 'المقارنة الثلاثية الأبعاد: الخلية النباتية والحيوانية';
    hasVariantToggle = true;
    variantLabels = ['خلية نباتية', 'خلية حيوانية'];
    defaultCameraPos = [0, 3.0, 4.4];
    defaultTarget = [0, 0.85, 0];

    const cellWall = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.35, 2.1),
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.75, transparent: true, opacity: 0.88 }),
    );
    cellWall.position.set(0, 0.75, 0);
    registerPart(cellWall, parts, 'cell_wall', 'الجدار الخلوي (في النباتية فقط)', 'طبقة صلبة من السليلوز تحيط بالخلية النباتية لتمنحها الشكل الصندوقي والحماية والدعامة.', [0, -0.45, -0.5]);
    group.add(cellWall);

    const membrane = new THREE.Mesh(
      new THREE.SphereGeometry(1.18, 32, 24),
      new THREE.MeshPhysicalMaterial({ color: '#fde68a', roughness: 0.35, transparent: true, opacity: 0.42 }),
    );
    membrane.scale.set(1.05, 0.55, 0.9);
    membrane.position.set(0, 0.8, 0);
    registerPart(membrane, parts, 'membrane', 'الغشاء البلازمي والسيتوبلازم', 'غشاء رقيق شبه منفذ ينظم مرور الماء والمواد الغذائية بالخاصية الأسموزية والنقل النشط.', [0, -0.25, 0.65]);
    group.add(membrane);

    const nucleusGroup = new THREE.Group();
    nucleusGroup.position.set(-0.35, 0.9, -0.1);
    const nucOuter = new THREE.Mesh(new THREE.SphereGeometry(0.38, 28, 28), new THREE.MeshStandardMaterial({ color: '#7e22ce', roughness: 0.4 }));
    const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 18), new THREE.MeshStandardMaterial({ color: '#4c1d95', roughness: 0.3 }));
    nucleolus.position.set(0.12, 0.1, 0.15);
    nucleusGroup.add(nucOuter, nucleolus);
    registerPart(nucleusGroup, parts, 'nucleus', 'النواة (مركز التحكم)', 'تحتوي على الكروموسومات والـ DNA وتنظم انقسام الخلية وجميع أنشطتها الحيوية.', [-0.55, 0.7, 0]);
    group.add(nucleusGroup);

    const vacuole = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 24, 24),
      new THREE.MeshPhysicalMaterial({ color: '#38bdf8', roughness: 0.15, transparent: true, opacity: 0.72 }),
    );
    vacuole.scale.set(1.25, 0.72, 1.05);
    vacuole.position.set(0.45, 0.88, -0.15);
    registerPart(vacuole, parts, 'vacuole', 'الفجوة العصارية', 'تخزن الماء والغذاء والفضلات؛ تكون مركزية كبيرة في النباتية وصغيرة متعددة في الحيوانية.', [0.6, 0.6, -0.3]);
    group.add(vacuole);

    const chloroplastGroup = new THREE.Group();
    chloroplastGroup.position.set(0.55, 0.85, 0.48);
    for (let i = 0; i < 3; i++) {
      const ch = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.22, 8, 16), new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.4 }));
      ch.rotation.z = Math.PI / 2.2;
      ch.position.set((i - 1) * 0.45, (i % 2) * 0.18, (i === 1 ? -0.75 : 0));
      chloroplastGroup.add(ch);
    }
    registerPart(chloroplastGroup, parts, 'chloroplast', 'البلاستيدات الخضراء (النباتية فقط)', 'تحتوي على صبغة الكلوروفيل التي تمتص ضوء الشمس للقيام بعملية البناء الضوئي.', [0.55, 0.55, 0.65]);
    group.add(chloroplastGroup);

    const mitoGroup = new THREE.Group();
    mitoGroup.position.set(-0.55, 0.85, 0.52);
    for (let i = 0; i < 2; i++) {
      const mt = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.22, 8, 16), new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.45 }));
      mt.rotation.set(0.3, 0.5 * i, Math.PI / 2.5);
      mt.position.set(i * 0.95, 0, i === 1 ? -0.9 : 0);
      mitoGroup.add(mt);
    }
    registerPart(mitoGroup, parts, 'mitochondria', 'الميتوكندريا (مصانع الطاقة)', 'تحرق الغذاء (الجلوكوز) مع الأكسجين في التنفس الخلوي لإنتاج طاقة الخلية.', [-0.5, 0.55, 0.6]);
    group.add(mitoGroup);

    updater = (elapsed, explode, variant) => {
      const isAnimal = variant === 1;
      cellWall.visible = !isAnimal;
      chloroplastGroup.visible = !isAnimal;
      vacuole.scale.set(isAnimal ? 0.55 : 1.25, isAnimal ? 0.45 : 0.72, isAnimal ? 0.55 : 1.05);
      applyExplode(parts, explode);
      nucleusGroup.rotation.y = elapsed * 0.4;
      mitoGroup.position.y = 0.85 + explode * 0.55 + Math.sin(elapsed * 2.5) * 0.04;
    };
  } else if (id === 'cell_division') {
    titleAr = 'انقسام الخلية (المتساوي والمنصف)';
    hasVariantToggle = true;
    variantLabels = ['انقسام متساوٍ (خليتان)', 'انقسام منصف (٤ خلايا)'];
    defaultCameraPos = [0, 2.3, 5.2];
    defaultTarget = [0, 0.9, 0];

    const parentCell = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 28, 28),
      new THREE.MeshPhysicalMaterial({ color: '#818cf8', transparent: true, opacity: 0.55, roughness: 0.25 }),
    );
    parentCell.position.set(0, 1.5, 0);
    registerPart(parentCell, parts, 'parent_cell', 'الخلية الأم ومضاعفة الكروموسومات', 'تبدأ الخلية بتضاعف الكروموسومات في النواة قبل الانقسام (٤٦ كروموسومًا في الإنسان).', [0, 0.55, 0]);
    group.add(parentCell);

    const daughterGroup = new THREE.Group();
    daughterGroup.position.set(0, 0.55, 0);
    const cellMat = new THREE.MeshPhysicalMaterial({ color: '#38bdf8', transparent: true, opacity: 0.65, roughness: 0.2 });
    const nucMat = new THREE.MeshStandardMaterial({ color: '#a855f7', roughness: 0.35 });
    const dMeshes: THREE.Group[] = [];
    for (let i = 0; i < 4; i++) {
      const cell = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), cellMat);
      const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), nucMat);
      cell.add(body, nuc);
      dMeshes.push(cell);
      daughterGroup.add(cell);
    }
    registerPart(daughterGroup, parts, 'daughter_cells', 'الخلايا الناتجة عن الانقسام', 'في المتساوي تنتج خليتان متطابقتان للنمو وتعويض التالف؛ وفي المنصف ٤ خلايا جنسية بنصف عدد الكروموسومات.', [0, -0.3, 0.4]);
    group.add(daughterGroup);

    const spindle = new THREE.Group();
    spindle.position.set(0, 1.05, 0);
    const rodMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 });
    for (let i = -1; i <= 1; i += 2) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 10), rodMat);
      rod.rotation.z = i * 0.45;
      rod.position.x = i * 0.35;
      spindle.add(rod);
    }
    registerPart(spindle, parts, 'spindle', 'الخيوط المغزلية والكروماتيدات', 'تسحب الخيوط المغزلية الكروموسومات إلى قطبي الخلية بدقة قبل انفصال السيتوبلازم.', [0, 0, -0.45]);
    group.add(spindle);

    updater = (elapsed, explode, variant) => {
      applyExplode(parts, explode);
      const isMeiosis = variant === 1;
      const spread = 0.7 + Math.sin(elapsed * 1.4) * 0.14;
      dMeshes[0].position.set(-spread, 0, isMeiosis ? 0.45 : 0);
      dMeshes[1].position.set(spread, 0, isMeiosis ? 0.45 : 0);
      dMeshes[2].visible = isMeiosis;
      dMeshes[3].visible = isMeiosis;
      dMeshes[2].position.set(-spread * 0.85, 0, -0.55);
      dMeshes[3].position.set(spread * 0.85, 0, -0.55);
      dMeshes.forEach((d) => {
        const s = isMeiosis ? 0.82 : 1.05;
        d.scale.setScalar(s);
      });
    };
  } else if (id === 'genetics_dna') {
    titleAr = 'الحمض النووي (DNA) والجينات الوراثية';
    defaultCameraPos = [0, 2.0, 4.8];
    defaultTarget = [0, 1.2, 0];

    const helixGroup = new THREE.Group();
    helixGroup.position.set(0, 1.25, 0);
    const backboneMat1 = new THREE.MeshStandardMaterial({ color: '#4f46e5', roughness: 0.35, metalness: 0.25 });
    const backboneMat2 = new THREE.MeshStandardMaterial({ color: '#0d9488', roughness: 0.35, metalness: 0.25 });
    const pairColors = ['#ef4444', '#eab308', '#22c55e', '#3b82f6'];

    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const t = (i / (steps - 1) - 0.5) * 2.2;
      const angle = i * 0.55;
      const rad = 0.65;

      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), backboneMat1);
      s1.position.set(Math.cos(angle) * rad, t, Math.sin(angle) * rad);

      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), backboneMat2);
      s2.position.set(Math.cos(angle + Math.PI) * rad, t, Math.sin(angle + Math.PI) * rad);

      const rung = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, rad * 2, 12),
        new THREE.MeshStandardMaterial({ color: pairColors[i % 4], roughness: 0.45 }),
      );
      rung.position.set(0, t, 0);
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = -angle;

      helixGroup.add(s1, s2, rung);
    }
    registerPart(helixGroup, parts, 'dna_strand', 'شريطا الحلزون المزدوج (DNA)', 'جزيء عملاق داخل النواة يحمل التعليمات الكيميائية والصفات الوراثية من الآباء للأبناء.', [0, 0.25, 0.3]);
    group.add(helixGroup);

    const dominantGene = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.32, 0.09, 64, 12),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3, metalness: 0.4 }),
    );
    dominantGene.position.set(-1.35, 1.15, 0);
    registerPart(dominantGene, parts, 'dominant_gene', 'الجين السائد (الصفة السائدة)', 'جين قوي يظهر تأثيره ويمنع الصفة المتنحية من الظهور عند اجتماعهما (مثل البذور الملساء).', [-0.6, 0.2, 0]);
    group.add(dominantGene);

    const recessiveGene = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 1),
      new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.5, metalness: 0.2 }),
    );
    recessiveGene.position.set(1.35, 1.15, 0);
    registerPart(recessiveGene, parts, 'recessive_gene', 'الجين المتنحي (حامل الصفة)', 'صفة تختفي بوجود جين سائد ولا تظهر إلا عندما يرث الابن جينين متنحيين من الأبوين.', [0.6, 0.2, 0]);
    group.add(recessiveGene);

    updater = (elapsed, explode) => {
      applyExplode(parts, explode);
      helixGroup.rotation.y = elapsed * 0.65;
      dominantGene.rotation.y = -elapsed * 0.8;
      recessiveGene.rotation.x = elapsed * 0.6;
    };
  } else if (id === 'plant_processes') {
    titleAr = 'تركيب النبات والبناء الضوئي والتلقيح';
    defaultCameraPos = [0.2, 2.2, 5.1];
    defaultTarget = [0, 1.25, 0];

    const soilPot = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 0.95, 0.42, 32),
      new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 }),
    );
    soilPot.position.set(0, 0.21, 0);
    group.add(soilPot);

    const roots = new THREE.Group();
    roots.position.set(0, 0.15, 0);
    const rootMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.7 });
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6;
      const r = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.75, 10), rootMat);
      r.position.set(Math.cos(ang) * 0.35, -0.05, Math.sin(ang) * 0.35);
      r.rotation.z = Math.PI + Math.cos(ang) * 0.6;
      r.rotation.x = Math.sin(ang) * 0.6;
      roots.add(r);
    }
    registerPart(roots, parts, 'roots', 'الجذور والشعيرات الجذرية', 'تثبت النبات في التربة وتمتص الماء والأملاح المعدنية؛ وتزيد الشعيرات مساحة الامتصاص.', [0, -0.5, 0]);
    group.add(roots);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.15, 1.9, 18),
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.6 }),
    );
    stem.position.set(0, 1.25, 0);
    registerPart(stem, parts, 'stem', 'الساق والأوعية الناقلة (الخشب واللحاء)', 'ينقل الخشب الماء والأملاح من الجذور للأعلى، وينقل اللحاء السكر المصنوع في الأوراق.', [0, 0, 0]);
    group.add(stem);

    const leaves = new THREE.Group();
    leaves.position.set(0, 1.3, 0);
    const leafMat = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.5, side: THREE.DoubleSide });
    for (let side of [-1, 1]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 14), leafMat);
      leaf.scale.set(1.4, 0.14, 0.65);
      leaf.position.set(side * 0.62, side * 0.18, 0);
      leaf.rotation.z = side * 0.32;
      leaves.add(leaf);
    }
    registerPart(leaves, parts, 'leaf', 'الورقة والبناء الضوئي والثغور', 'تمتص أشعة الشمس بالكلوروفيل وتدخل CO₂ عبر الثغور لصنع السكر وإطلاق الأكسجين وبخار الماء (النتح).', [0.7, 0.2, 0.35]);
    group.add(leaves);

    const flower = new THREE.Group();
    flower.position.set(0, 2.28, 0);
    const pistil = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.35, 16), new THREE.MeshStandardMaterial({ color: '#84cc16', roughness: 0.4 }));
    flower.add(pistil);
    const petalMat = new THREE.MeshStandardMaterial({ color: '#fb7185', roughness: 0.45 });
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), petalMat);
      petal.scale.set(1.2, 0.2, 0.7);
      petal.position.set(Math.cos(ang) * 0.38, 0, Math.sin(ang) * 0.38);
      petal.rotation.y = -ang;
      petal.rotation.z = 0.25;
      flower.add(petal);
    }
    const antherMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.3 });
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + 0.4;
      const anther = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), antherMat);
      anther.position.set(Math.cos(ang) * 0.2, 0.22, Math.sin(ang) * 0.2);
      flower.add(anther);
    }
    registerPart(flower, parts, 'flower', 'الزهرة (السداة والكربلة والتلقيح)', 'ينتج المتك حبوب اللقاح التي تنتقل للميسم في التلقيح لتتكون البذور داخل المبيض.', [0, 0.65, 0]);
    group.add(flower);

    updater = (elapsed, explode) => {
      applyExplode(parts, explode);
      flower.rotation.y = Math.sin(elapsed * 0.9) * 0.25;
      leaves.rotation.y = Math.sin(elapsed * 0.6) * 0.1;
    };
  } else if (id === 'microorganisms') {
    titleAr = 'المخلوقات الحية الدقيقة (الميكروبات)';
    defaultCameraPos = [0, 2.2, 5.0];
    defaultTarget = [0, 0.95, 0];

    const paramecium = new THREE.Group();
    paramecium.position.set(-1.35, 1.05, 0.15);
    const paraBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 0.75, 12, 24),
      new THREE.MeshPhysicalMaterial({ color: '#06b6d4', transparent: true, opacity: 0.78, roughness: 0.2 }),
    );
    paraBody.rotation.z = 0.35;
    paramecium.add(paraBody);
    registerPart(paramecium, parts, 'paramecium', 'البراميسيوم (الطلائعيات)', 'مخلوق وحيد الخلية يتحرك بالأهداب، يتكاثر لاجنسيًا بالانشطار الثنائي وجنسيًا بالاقتران.', [-0.65, 0.2, 0.2]);
    group.add(paramecium);

    const yeast = new THREE.Group();
    yeast.position.set(0, 1.0, 0.35);
    const yMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.45 });
    const yMom = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), yMat);
    const yBud = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 18), yMat);
    yBud.position.set(0.38, 0.34, 0.1);
    yeast.add(yMom, yBud);
    registerPart(yeast, parts, 'yeast', 'فطر الخميرة (التبرعم)', 'فطر نافع وحيد الخلية ينفخ عجين الخبز بإطلاق ثاني أكسيد الكربون، ويتكاثر لاجنسيًا بالتبرعم.', [0, 0.3, 0.65]);
    group.add(yeast);

    const mold = new THREE.Group();
    mold.position.set(1.35, 0.55, -0.1);
    const hyphaMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.6 });
    const sporeMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 });
    for (let i = -1; i <= 1; i++) {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.85, 10), hyphaMat);
      stalk.position.set(i * 0.28, 0.45, 0);
      const sporangium = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), sporeMat);
      sporangium.position.set(i * 0.28, 0.92, 0);
      mold.add(stalk, sporangium);
    }
    registerPart(mold, parts, 'bread_mold', 'عفن الخبز ومحافظ الأبواغ', 'تفرز الخيوط الفطرية إنزيمات لهضم الغذاء، وتحمل الخيوط العلوية محافظ الأبواغ للتكاثر.', [0.65, 0.2, -0.2]);
    group.add(mold);

    updater = (elapsed, explode) => {
      applyExplode(parts, explode);
      paramecium.position.y = 1.05 + explode * 0.2 + Math.sin(elapsed * 2.2) * 0.08;
      paramecium.rotation.y = elapsed * 0.7;
      yBud.scale.setScalar(0.85 + Math.sin(elapsed * 2) * 0.15);
    };
  } else if (id === 'human_systems_1') {
    titleAr = 'أجهزة الهضم والتنفس والدوران والإخراج 3D';
    defaultCameraPos = [0, 2.0, 4.9];
    defaultTarget = [0, 1.25, 0];

    const torsoFrame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.82, 2.35, 32),
      new THREE.MeshPhysicalMaterial({ color: '#e2e8f0', transparent: true, opacity: 0.22, roughness: 0.2 }),
    );
    torsoFrame.scale.set(1.25, 1, 0.72);
    torsoFrame.position.set(0, 1.28, 0);
    group.add(torsoFrame);

    const lungs = new THREE.Group();
    lungs.position.set(0, 1.75, 0.05);
    const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.65, 16), new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.4 }));
    trachea.position.y = 0.45;
    const lungMat = new THREE.MeshStandardMaterial({ color: '#fb7185', roughness: 0.6 });
    const lungL = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), lungMat);
    lungL.scale.set(0.85, 1.25, 0.75);
    lungL.position.set(-0.46, 0, 0);
    const lungR = lungL.clone();
    lungR.position.x = 0.46;
    lungs.add(trachea, lungL, lungR);
    registerPart(lungs, parts, 'lungs', 'الجهاز التنفسي (القصبة والرئتان)', 'يدخل الهواء بالحجاب الحاجز عبر القصبة الهوائية إلى الحويصلات حيث يتزود الدم بالأكسجين.', [0, 0.55, 0.45]);
    group.add(lungs);

    const heart = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 24, 24),
      new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.35 }),
    );
    heart.scale.set(0.95, 1.2, 0.9);
    heart.position.set(-0.12, 1.65, 0.28);
    registerPart(heart, parts, 'heart', 'القلب وجهاز الدوران المغلق', 'يضخ القلب الدم غير المؤكسج للرئتين ثم المؤكسج عبر الشرايين لجميع خلايا الجسم.', [-0.45, 0.2, 0.75]);
    group.add(heart);

    const digestive = new THREE.Group();
    digestive.position.set(0, 0.78, 0.1);
    const stomach = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.22, 0.36, 10, 20),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.5 }),
    );
    stomach.rotation.z = 0.7;
    stomach.position.set(-0.18, 0.25, 0.08);
    const intestine = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.13, 14, 32),
      new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.55 }),
    );
    intestine.position.set(0, -0.22, 0.04);
    digestive.add(stomach, intestine);
    registerPart(digestive, parts, 'digestive', 'الجهاز الهضمي (المعدة والأمعاء)', 'تفكك المعدة الطعام بالحمض والإنزيمات، وتمتص الأمعاء الدقيقة الغذاء والغليظة الماء.', [0, -0.35, 0.65]);
    group.add(digestive);

    const kidneys = new THREE.Group();
    kidneys.position.set(0, 0.95, -0.28);
    const kMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.45 });
    for (let sx of [-0.45, 0.45]) {
      const k = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.2, 8, 16), kMat);
      k.position.set(sx, 0, 0);
      kidneys.add(k);
    }
    registerPart(kidneys, parts, 'kidneys', 'الكليتان (الجهاز الإخراجي)', 'تنقيان الدم من الفضلات السائلة عبر أكثر من مليون وحدة كلوية (نفرون) لتكوين البول.', [0, 0, -0.7]);
    group.add(kidneys);

    updater = (elapsed, explode) => {
      applyExplode(parts, explode);
      const pulse = 1 + Math.sin(elapsed * 6) * 0.07;
      heart.scale.set(0.95 * pulse, 1.2 * pulse, 0.9 * pulse);
      const breath = 1 + Math.sin(elapsed * 2) * 0.05;
      lungL.scale.set(0.85 * breath, 1.25 * breath, 0.75 * breath);
      lungR.scale.set(0.85 * breath, 1.25 * breath, 0.75 * breath);
    };
  } else if (id === 'human_systems_2') {
    titleAr = 'الجهاز الهيكلي والعضلي والجهاز العصبي 3D';
    defaultCameraPos = [0, 2.1, 4.9];
    defaultTarget = [0, 1.25, 0];

    const skeleton = new THREE.Group();
    skeleton.position.set(0, 1.15, 0);
    const boneMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.45 });
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), boneMat);
    skull.position.set(0, 1.15, 0);
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.4, 16), boneMat);
    spine.position.set(0, 0.2, -0.05);
    const humerus = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.85, 14), boneMat);
    humerus.position.set(0.55, 0.35, 0);
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 14), boneMat);
    forearm.position.set(0.92, 0.08, 0.25);
    forearm.rotation.z = -1.1;
    skeleton.add(skull, spine, humerus, forearm);
    registerPart(skeleton, parts, 'skeleton', 'الجهاز الهيكلي والمفاصل', 'يدعم الجسم ويحمي الأعضاء كالدماغ، وترتبط عظامه الـ ٢٠٦ بالأربطة والعضلات.', [-0.45, 0, -0.4]);
    group.add(skeleton);

    const muscles = new THREE.Group();
    muscles.position.set(0.55, 1.45, 0.12);
    const biceps = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.15, 0.45, 10, 20),
      new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.45 }),
    );
    const triceps = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.42, 10, 20),
      new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.5 }),
    );
    triceps.position.set(0.18, 0, -0.15);
    muscles.add(biceps, triceps);
    registerPart(muscles, parts, 'muscles', 'العضلات المتقابلة والأوتار', 'تعمل العضلات في أزواج بالشد فقط (تنقبض الأمامية بينما تنبسط الخلفية) وتحرك العظم عبر الأوتار.', [0.7, 0.15, 0.45]);
    group.add(muscles);

    const nervous = new THREE.Group();
    nervous.position.set(0, 1.8, 0.06);
    const brain = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 20, 20),
      new THREE.MeshStandardMaterial({ color: '#eab308', emissive: '#ca8a04', emissiveIntensity: 0.3, roughness: 0.35 }),
    );
    brain.position.set(0, 0.5, 0);
    const spinalCord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.45, 12),
      new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#eab308', emissiveIntensity: 0.4 }),
    );
    spinalCord.position.set(0, -0.45, -0.05);
    nervous.add(brain, spinalCord);
    registerPart(nervous, parts, 'nervous', 'الجهاز العصبي (الدماغ والحبل الشوكي)', 'يستقبل الإشارات من أعضاء الحس ويعالجها في الدماغ ويرسل الأوامر للعضلات والغدد الصماء.', [0, 0.65, -0.35]);
    group.add(nervous);

    updater = (elapsed, explode) => {
      applyExplode(parts, explode);
      const flex = Math.sin(elapsed * 2.1);
      biceps.scale.set(1 + flex * 0.12, 1 - flex * 0.08, 1 + flex * 0.12);
      triceps.scale.set(1 - flex * 0.1, 1 + flex * 0.06, 1 - flex * 0.1);
    };
  } else if (id === 'ecosystems_pyramid') {
    titleAr = 'هرم الطاقة والسلسلة الغذائية (قاعدة ١٠٪)';
    defaultCameraPos = [2.6, 2.4, 4.6];
    defaultTarget = [0, 1.15, 0];

    const tierSpecs: Array<{
      key: string;
      label: string;
      desc: string;
      top: number;
      bottom: number;
      height: number;
      y: number;
      color: string;
    }> = [
      {
        key: 'producers',
        label: 'المستوى ١: المنتجات (١٠٠٪ طاقة)',
        desc: 'النباتات والطحالب والعوالق؛ تصنع غذاءها بضوء الشمس وتمد الهرم بكامل طاقته.',
        top: 1.55,
        bottom: 2.0,
        height: 0.56,
        y: 0.28,
        color: '#16a34a',
      },
      {
        key: 'primary_consumers',
        label: 'المستوى ٢: المستهلكات الأولى (١٠٪ طاقة)',
        desc: 'آكلات الأعشاب كالغزلان والجراد؛ يحصل مستواها على عُشر (١٠٪) طاقة المنتجات فقط.',
        top: 1.1,
        bottom: 1.5,
        height: 0.54,
        y: 0.86,
        color: '#65a30d',
      },
      {
        key: 'secondary_consumers',
        label: 'المستوى ٣: المستهلكات الثانية (١٪ طاقة)',
        desc: 'آكلات اللحوم والقارتة؛ تتغذى على آكلات الأعشاب وتحصل على ١٠٪ من طاقتها.',
        top: 0.65,
        bottom: 1.05,
        height: 0.52,
        y: 1.42,
        color: '#d97706',
      },
      {
        key: 'top_predators',
        label: 'المستوى ٤: المفترسات العليا (٠٫١٪ طاقة)',
        desc: 'كالنسور والأسود في قمة الهرم؛ عددها هو الأقل لتضاؤل الطاقة المتبقية.',
        top: 0.06,
        bottom: 0.58,
        height: 0.58,
        y: 2.0,
        color: '#dc2626',
      },
    ];

    tierSpecs.forEach((tier, idx) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(tier.top, tier.bottom, tier.height, 4),
        new THREE.MeshStandardMaterial({ color: tier.color, roughness: 0.45, metalness: 0.08 }),
      );
      mesh.rotation.y = Math.PI / 4;
      mesh.position.set(0, tier.y, 0);
      registerPart(mesh, parts, tier.key, tier.label, tier.desc, [0, idx * 0.38, 0]);
      group.add(mesh);
    });

    const sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 20),
      new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#f59e0b', emissiveIntensity: 0.8 }),
    );
    sunOrb.position.set(-1.6, 2.4, -0.4);
    registerPart(sunOrb, parts, 'sun_source', 'الشمس (المصدر الأول للطاقة)', 'تُطلق الطاقة الضوئية التي تقتنصها المنتجات لتبدأ السلاسل الغذائية.', [-0.4, 0.5, 0]);
    group.add(sunOrb);

    updater = (elapsed, explode) => {
      applyExplode(parts, explode);
      sunOrb.position.y = 2.4 + explode * 0.5 + Math.sin(elapsed * 2) * 0.08;
    };
  } else {
    // soil_energy
    titleAr = 'نطاقات التربة الثلاثة ومصادر الطاقة المتجددة';
    defaultCameraPos = [2.6, 2.5, 5.2];
    defaultTarget = [0, 1.15, 0];

    const soilTex = createSoilTexture();
    const solarTex = createSolarGridTexture();
    textures.push(soilTex, solarTex);

    const soilGroup = new THREE.Group();
    soilGroup.position.set(-1.05, 0.72, 0.1);
    const horC = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.45, 1.35), new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.9 }));
    horC.position.y = -0.46;
    const horB = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.42, 1.35), new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.85 }));
    horB.position.y = 0;
    const horA = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.36, 1.35), new THREE.MeshStandardMaterial({ map: soilTex, roughness: 0.9 }));
    horA.position.y = 0.42;
    const grassTop = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.09, 1.38), new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.8 }));
    grassTop.position.y = 0.64;
    soilGroup.add(horC, horB, horA, grassTop);
    registerPart(soilGroup, parts, 'soil', 'نطاقات التربة (أ، ب، ج)', 'النطاق أ غني بالدبال والجذور، النطاق ب قليل الدبال، والنطاق ج يحوي قطع الصخور الكبيرة المتجواة.', [-0.65, 0, 0.4]);
    group.add(soilGroup);

    const solarPanel = new THREE.Group();
    solarPanel.position.set(1.25, 0.7, 0.5);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 12), new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.7, roughness: 0.3 }));
    pole.position.y = -0.3;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 0.82), new THREE.MeshStandardMaterial({ map: solarTex, roughness: 0.2, metalness: 0.4 }));
    panel.position.y = 0.15;
    panel.rotation.x = 0.42;
    solarPanel.add(pole, panel);
    registerPart(solarPanel, parts, 'solar', 'الخلية الشمسية (طاقة متجددة)', 'تحوّل ضوء الشمس مباشرةً إلى كهرباء نظيفة دون انبعاثات كربونية كما في جامعة الملك عبدالله.', [0.55, 0.25, 0.5]);
    group.add(solarPanel);

    const windGroup = new THREE.Group();
    windGroup.position.set(1.25, 1.4, -0.75);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 2.2, 16), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 }));
    tower.position.y = -0.3;
    const rotor = new THREE.Group();
    rotor.position.set(0, 0.8, 0.12);
    const bladeMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3 });
    for (let i = 0; i < 3; i++) {
      const bHolder = new THREE.Group();
      bHolder.rotation.z = (i * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.78, 0.03), bladeMat);
      blade.position.y = 0.42;
      bHolder.add(blade);
      rotor.add(bHolder);
    }
    windGroup.add(tower, rotor);
    registerPart(windGroup, parts, 'wind', 'توربين طاقة الرياح', 'تدفع الرياح الشفرات لتوليد الكهرباء دون حرق الوقود الأحفوري.', [0.65, 0.4, -0.4]);
    group.add(windGroup);

    const hydroDam = new THREE.Group();
    hydroDam.position.set(0.05, 0.45, -0.85);
    const damWall = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.35), new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.8 }));
    const waterFlow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.48), new THREE.MeshPhysicalMaterial({ color: '#0ea5e9', roughness: 0.15, transparent: true, opacity: 0.8 }));
    waterFlow.position.set(0, -0.05, 0.28);
    hydroDam.add(damWall, waterFlow);
    registerPart(hydroDam, parts, 'hydro', 'السد والطاقة الكهرومائية', 'تندفع المياه من السد لتدير التوربينات في القاعدة وتنتج طاقة كهرومائية نظيفة.', [0, 0.25, -0.6]);
    group.add(hydroDam);

    updater = (elapsed, explode) => {
      applyExplode(parts, explode);
      rotor.rotation.z = -elapsed * 2.2;
      waterFlow.scale.y = 0.92 + Math.sin(elapsed * 4) * 0.06;
    };
  }

  return {
    id,
    titleAr,
    group,
    parts,
    hasVariantToggle,
    variantLabels,
    defaultCameraPos,
    defaultTarget,
    update: updater,
    dispose: () => {
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) m.dispose();
        }
      });
      textures.forEach((t) => t.dispose());
    },
  };
}
