import { useEffect, useRef } from 'react';
import { Renderer, Transform, Vec3, Color, Polyline } from 'ogl';
import './Ribbons.css';

const VERTEX = `
  precision highp float;
  attribute vec3 position;
  attribute vec3 next;
  attribute vec3 prev;
  attribute vec2 uv;
  attribute float side;
  uniform vec2 uResolution;
  uniform float uDPR;
  uniform float uThickness;
  varying vec2 vUV;
  vec4 getPosition() {
    vec4 current = vec4(position, 1.0);
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 nextScreen = next.xy * aspect;
    vec2 prevScreen = prev.xy * aspect;
    vec2 tangent = normalize(nextScreen - prevScreen);
    vec2 normal = vec2(-tangent.y, tangent.x);
    normal /= aspect;
    normal *= mix(1.0, 0.1, pow(abs(uv.y - 0.5) * 2.0, 2.0));
    float dist = length(nextScreen - prevScreen);
    normal *= smoothstep(0.0, 0.02, dist);
    float pixelWidthRatio = 1.0 / (uResolution.y / uDPR);
    float pixelWidth = current.w * pixelWidthRatio;
    normal *= pixelWidth * uThickness;
    current.xy -= normal * side;
    return current;
  }
  void main() {
    vUV = uv;
    gl_Position = getPosition();
  }
`;

const FRAGMENT = `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uEnableFade;
  varying vec2 vUV;
  void main() {
    float fade = 1.0;
    if (uEnableFade > 0.5) fade = 1.0 - smoothstep(0.0, 1.0, vUV.y);
    gl_FragColor = vec4(uColor, uOpacity * fade);
  }
`;

export default function Ribbons({
  colors = ['#a78bfa', '#7c3aed', '#4f46e5'],
  baseSpring = 0.03,
  baseFriction = 0.9,
  baseThickness = 18,
  offsetFactor = 0.04,
  pointCount = 50,
  speedMultiplier = 0.6,
  enableFade = true,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    Object.assign(gl.canvas.style, { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', pointerEvents: 'none' });
    container.appendChild(gl.canvas);

    const scene = new Transform();
    const mouse = new Vec3();
    const tmp = new Vec3();
    const lines = [];

    colors.forEach((color, i) => {
      const spring = baseSpring + i * 0.005;
      const friction = baseFriction - i * 0.01;
      const thickness = baseThickness - i * 2;
      const mouseOffset = new Vec3(
        (Math.random() - 0.5) * offsetFactor,
        (Math.random() - 0.5) * offsetFactor,
        0
      );
      const points = Array.from({ length: pointCount }, () => new Vec3());
      const line = { spring, friction, mouseVelocity: new Vec3(), mouseOffset, points };

      line.polyline = new Polyline(gl, {
        points,
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms: {
          uColor: { value: new Color(color) },
          uThickness: { value: thickness },
          uOpacity: { value: 0.85 },
          uEnableFade: { value: enableFade ? 1.0 : 0.0 },
        },
      });
      line.polyline.mesh.setParent(scene);
      lines.push(line);
    });

    const onMouseMove = (e) => {
      mouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        (-(e.clientY / window.innerHeight) * 2 + 1) * speedMultiplier,
        0
      );
    };
    window.addEventListener('mousemove', onMouseMove);

    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      lines.forEach(l => l.polyline.resize());
    };
    window.addEventListener('resize', resize);
    resize();

    let rafId;
    const update = () => {
      rafId = requestAnimationFrame(update);
      lines.forEach(line => {
        tmp.copy(mouse).add(line.mouseOffset).sub(line.points[0]).multiply(line.spring);
        line.mouseVelocity.add(tmp).multiply(line.friction);
        line.points[0].add(line.mouseVelocity);
        for (let i = 1; i < line.points.length; i++) {
          line.points[i].lerp(line.points[i - 1], 0.9);
        }
        line.polyline.updateGeometry();
      });
      renderer.render({ scene });
    };
    update();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
      try { container.removeChild(gl.canvas); } catch (_) {}
    };
  }, []);

  return <div ref={containerRef} className="ribbons-container" />;
}
