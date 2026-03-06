import { useEffect, useRef } from 'react'
import { usePerformance } from '@/hooks/usePerformance'

export const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { canUse3D } = usePerformance()

  useEffect(() => {
    if (!canUse3D || !canvasRef.current) return

    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl')
    if (!gl) return

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Vertex Shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    // Fragment Shader (Gradient animado)
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      
      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution;
        
        // Gradiente animado
        vec3 color1 = vec3(0.54, 0.36, 0.96); // Purple
        vec3 color2 = vec3(0.92, 0.36, 0.6);  // Pink
        vec3 color3 = vec3(0.23, 0.51, 0.96); // Blue
        
        // Movimento ondulante
        float wave = sin(st.x * 3.0 + u_time * 0.5) * 0.5 + 0.5;
        float wave2 = cos(st.y * 2.0 + u_time * 0.3) * 0.5 + 0.5;
        
        // Mix das cores
        vec3 color = mix(color1, color2, wave);
        color = mix(color, color3, wave2);
        
        // Adicionar ruído suave
        float noise = fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
        color += noise * 0.05;
        
        gl_FragColor = vec4(color, 0.15); // 15% opacity
      }
    `

    // Compile shaders
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER)
    const fragmentShader = compileShader(
      fragmentShaderSource,
      gl.FRAGMENT_SHADER,
    )

    // Create program
    const program = gl.createProgram()!
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    // Setup geometry (full screen quad)
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')

    // Animation loop
    const startTime = Date.now()
    let animationFrameId: number

    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000

      gl.uniform1f(timeLocation, currentTime)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
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
