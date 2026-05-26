import * as THREE from "three";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { TeapotGeometry } from "three/addons/geometries/TeapotGeometry.js";
import type { PrimitiveType } from "../editor/types";

export function createPrimitiveGeometry(type: PrimitiveType): THREE.BufferGeometry {
  switch (type) {
    case "cube":
      return new THREE.BoxGeometry(2.4, 2.4, 2.4, 10, 10, 10);
    case "sphere":
      return new THREE.SphereGeometry(1.45, 64, 32);
    case "cone":
      return new THREE.ConeGeometry(1.35, 2.8, 64, 16);
    case "cylinder":
      return new THREE.CylinderGeometry(1.15, 1.15, 2.8, 64, 16);
    case "torus":
      return new THREE.TorusGeometry(1.2, 0.38, 32, 96);
    case "teapot":
      return new TeapotGeometry(1.25, 14);
    case "torusKnot":
      return new THREE.TorusKnotGeometry(1, 0.34, 140, 20, 2, 3);
    case "tetrahedron":
      return new THREE.TetrahedronGeometry(1.7, 1);
    case "octahedron":
      return new THREE.OctahedronGeometry(1.65, 1);
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(1.55, 1);
    case "icosahedron":
      return new THREE.IcosahedronGeometry(1.6, 1);
    case "tube":
      return new THREE.TubeGeometry(new StudioCurve(), 96, 0.22, 18, false);
    case "parametric":
      return new ParametricGeometry((u: number, v: number, target: THREE.Vector3) => {
        const x = (u - 0.5) * 4;
        const z = (v - 0.5) * 4;
        const y = Math.sin(x * 2.2) * Math.cos(z * 2.2) * 0.55 + 0.75;
        target.set(x, y, z);
      }, 64, 64);
    case "extrude":
      return createExtrudedStar();
  }
}

export function normalizedGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return geometry;
  const center = new THREE.Vector3();
  box.getCenter(center);
  geometry.translate(-center.x, -box.min.y, -center.z);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function labelForPrimitive(type: PrimitiveType): string {
  const labels: Record<PrimitiveType, string> = {
    cube: "Cube",
    sphere: "Sphere",
    cone: "Cone",
    cylinder: "Cylinder",
    torus: "Wheel Torus",
    teapot: "Teapot",
    torusKnot: "Torus Knot",
    tetrahedron: "Tetrahedron",
    octahedron: "Octahedron",
    dodecahedron: "Dodecahedron",
    icosahedron: "Icosahedron",
    tube: "Tube Curve",
    parametric: "Parametric Surface",
    extrude: "Extruded Star"
  };
  return labels[type];
}

export function createSampleModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.name = "Built-in Sample Drone";

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.35, 0.9, 4, 2, 4),
    new THREE.MeshStandardMaterial({ color: "#d8dadf", roughness: 0.38, metalness: 0.18 })
  );
  body.position.y = 0.8;
  group.add(body);

  const armMaterial = new THREE.MeshStandardMaterial({ color: "#293036", roughness: 0.5, metalness: 0.2 });
  const rotorMaterial = new THREE.MeshStandardMaterial({ color: "#20bfa9", roughness: 0.32, metalness: 0.08 });
  for (const [x, z] of [
    [-1.25, -0.8],
    [1.25, -0.8],
    [-1.25, 0.8],
    [1.25, 0.8]
  ]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.08), armMaterial);
    arm.position.set(x * 0.52, 0.8, z * 0.52);
    arm.rotation.y = Math.atan2(z, x);
    group.add(arm);

    const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 12, 36), rotorMaterial);
    rotor.position.set(x, 0.83, z);
    rotor.rotation.x = Math.PI / 2;
    group.add(rotor);
  }

  const camera = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 24, 12),
    new THREE.MeshStandardMaterial({ color: "#df6b80", roughness: 0.2, metalness: 0.1 })
  );
  camera.position.set(0, 0.66, -0.52);
  group.add(camera);

  return group;
}

class StudioCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
    const angle = t * Math.PI * 2;
    const radius = 1 + Math.sin(angle * 3) * 0.28;
    return optionalTarget.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.55 + 1.1, Math.sin(angle) * radius);
  }
}

function createExtrudedStar(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const points = 10;
  for (let i = 0; i < points; i += 1) {
    const radius = i % 2 === 0 ? 1.25 : 0.58;
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.55,
    bevelEnabled: true,
    bevelSegments: 8,
    bevelSize: 0.12,
    bevelThickness: 0.12,
    curveSegments: 32
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}
