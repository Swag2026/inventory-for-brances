import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/** Animated light streak behind the login card (additive glow on dark, normal blend on light). */
export default function LoginBackground({ dark }) {
  const mount = useRef(null)
  const mats = useRef([])

  useEffect(() => {
    const el = mount.current
    if (!el) return
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch (_) { return } // no WebGL → just skip the effect
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-15, -4, 0), new THREE.Vector3(2, 3, 0), new THREE.Vector3(18, 0.8, 0))
    const vertexShader = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }'
    const core = 'uniform float time; varying vec2 vUv; void main(){ vec3 c1=vec3(1.0,0.2,0.1); vec3 c2=vec3(0.8,0.1,0.6); vec3 c3=vec3(0.44,0.29,0.4); vec3 col=mix(c1,c2,vUv.x); col=mix(col,c3,vUv.x*0.7); float glow=1.0-abs(vUv.y-0.5)*2.0; glow=pow(glow,2.0); float fade=1.0; if(vUv.x>0.85){ fade=1.0-smoothstep(0.85,1.0,vUv.x);} float pulse=sin(time*2.0)*0.1+0.9; gl_FragColor=vec4(col*glow*pulse*fade, glow*fade*0.8); }'
    const halo = 'uniform float time; varying vec2 vUv; void main(){ vec3 c1=vec3(1.0,0.3,0.2); vec3 c2=vec3(0.0,0.5,0.52); vec3 col=mix(c1,c2,vUv.x); float glow=1.0-abs(vUv.y-0.5)*2.0; glow=pow(glow,4.0); float fade=1.0; if(vUv.x>0.85){ fade=1.0-smoothstep(0.85,1.0,vUv.x);} float pulse=sin(time*1.5)*0.05+0.95; gl_FragColor=vec4(col*glow*pulse*fade, glow*fade*0.3); }'
    const mk = (frag) => new THREE.ShaderMaterial({ vertexShader, fragmentShader: frag, uniforms: { time: { value: 0 } }, transparent: true, side: THREE.DoubleSide })
    const m1 = mk(core), m2 = mk(halo)
    mats.current = [m1, m2]
    const g1 = new THREE.TubeGeometry(curve, 200, 0.8, 32, false)
    const g2 = new THREE.TubeGeometry(curve, 200, 1.5, 32, false)
    const streak = new THREE.Mesh(g1, m1), glowL = new THREE.Mesh(g2, m2)
    scene.add(streak, glowL)
    camera.position.set(0, -0.8, 7)
    applyBlend(dark)

    let raf
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (document.hidden) return
      const t = performance.now() * 0.001
      m1.uniforms.time.value = t; m2.uniforms.time.value = t
      streak.rotation.z = glowL.rotation.z = Math.sin(t * 0.2) * 0.05
      renderer.render(scene, camera)
    }
    loop()
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      g1.dispose(); g2.dispose(); m1.dispose(); m2.dispose(); renderer.dispose()
      renderer.domElement.remove()
      mats.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyBlend(isDark) {
    mats.current.forEach((m) => { m.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending; m.needsUpdate = true })
  }
  useEffect(() => { applyBlend(dark) }, [dark])

  return <div ref={mount} className="pointer-events-none fixed inset-0 z-0" />
}
