import { useEffect, useRef } from 'react'
import { usePerformance } from '@/hooks/usePerformance'

export const PlasmaShader = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { canUse3D } = usePerformance()

  useEffect(() => {
    if (!canUse3D || !canvasRef.current) return

    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl')
    if (!gl) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let mouseX = canvas.width / 2
    let mouseY = canvas.height / 2

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = window.innerHeight - e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const plasmaShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      
      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution;
        
        // Plasma effect
        float plasma = 0.0;
        plasma += sin((st.x + u_time * 0.5) * 10.0);
        plasma += sin((st.y + u_time * 0.3) * 10.0);
        plasma += sin((st.x + st.y + u_time * 0.4) * 10.0);
        plasma += sin(length(st - 0.5) * 20.0 + u_time);
        
        // Mouse interaction
        vec2 mouse = u_mouse / u_resolution;
        float dist = length(st - mouse);
        plasma += sin(dist * 30.0 - u_time * 2.0) * 0.5;
        
        plasma *= 0.2;
        
        // Color palette
        vec3 color;
        color.r = sin(plasma + 0.0) * 0.5 + 0.5;
        color.g = sin(plasma + 2.0) * 0.5 + 0.5;
        color.b = sin(plasma + 4.0) * 0.5 + 0.5;
        
        // Purple/Pink tint
        color *= vec3(0.8, 0.6, 1.0);
        
        gl_FragColor = vec4(color, 0.2);
      }
    `

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER)
    const fragmentShader = compileShader(plasmaShaderSource, gl.FRAGMENT_SHADER)

    const program = gl.createProgram()!
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse')

    const startTime = Date.now()
    let animationFrameId: number

    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000

      gl.uniform1f(timeLocation, currentTime)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform2f(mouseLocation, mouseX, mouseY)

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [canUse3D])

  if (!canUse3D) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
