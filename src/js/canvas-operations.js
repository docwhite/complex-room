/** Resize the WebGL context when the parent DOM's dimensions are changed */
function handleResizing(canvas_name) {
  console.log("RES");
  var canvas = document.getElementById(canvas_name);
  var container = document.getElementById(canvas_name+'-wrapper');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, false);

  function resizeCanvas() {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }
}

/**
* Creates and initializes a WebGL context on a given <canvas>. The way the DOMs
* should be structured in the html file is a <div> named [your-name]-wrapper
* which hosts a <canvas> with name [your-name]. Then, on the same level as the
* <div> we should have two <script> named [your-name]-shader-fs and
* [your-name]-shader-vs with type "x-shader/x-fragment" and "x-shader/x-vertex"
* containing all the GLSL source code to be picked up by the OpenGL program and
* linked to the program.
*/
function addFragmentDoll(canvas_name, uniform_callback) {
  var gl;

  /** Initializes the context for a given canvas */
  function initWebGL(canvas) {
    gl = null;
    try {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    } catch (e) {}

    if (!gl) {
      alert("Unable to initialize WebGL.");
      gl = null;
    }

    return gl;
  }

  /** Prepares a shader given the id of the <script> in the html file */
  function getFragmentShader(gl, id) {
    // Read shader source
    var shader_script = document.getElementById(id);
    if (!shader_script) {
      alert("No fragment shader script found: " + id);
      return null;
    }

    var shader_source = '';
    var k = shader_script.firstChild;
    while(k) {
      if (k.nodeType == 3) { shader_source += k.textContent; }
      k = k.nextSibling;
    }

    /** Create shader */
    var shader;
    if (shader_script.type == 'x-shader/x-fragment') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
      alert("Just fragment shaders are acceptet into the x-shader/x-fragment scripts");
      return null;
    }

    /** Attach source code to shader and compile */
    gl.shaderSource(shader, shader_source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  /** Prepare quad vertex shader */
  function getVertexShader() {
    var shader_source = 'precision mediump float; \
      attribute vec3 aVertexPosition; \
      attribute vec2 aVertexUV; \
      uniform mat4 uMVMatrix; \
      uniform mat4 uPMatrix; \
      uniform vec2 uViewportSize; \
      varying vec2 uv; \
      void main(void) { \
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); \
        uv = aVertexUV; \
      }';

    var shader = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(shader, shader_source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  /**
  * Load shaders, attach, link, use program and prepare the locations to bring
  * in data  later in setBasicUniforms
  */
  function initShaders(canvas_name) {
    var vertexShader = getVertexShader();
    var fragmentShader = getFragmentShader(gl, canvas_name+"-fragment");

    var shader_program = gl.createProgram();
    gl.attachShader(shader_program, vertexShader);
    gl.attachShader(shader_program, fragmentShader);
    gl.linkProgram(shader_program);

    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
      alert(gl.getProgramInfoLog(shader_program));
      return;
    }

    gl.useProgram(shader_program);

    // Position attribute
    shader_program.vertexPositionAttribute = gl.getAttribLocation(
      shader_program,
      'aVertexPosition'
    );
    gl.enableVertexAttribArray(shader_program.vertexPositionAttribute);

    // UV attribute
    shader_program.vertexUVAttribute = gl.getAttribLocation(
      shader_program,
      'aVertexUV'
    );
    gl.enableVertexAttribArray(shader_program.vertexUVAttribute);

    // Uniforms
    shader_program.pMatrixUniform = gl.getUniformLocation(
      shader_program,
      'uPMatrix'
    );
    shader_program.mvMatrixUniform = gl.getUniformLocation(
      shader_program,
      'uMVMatrix'
    );
    shader_program.ViewportSizeUniform = gl.getUniformLocation(
      shader_program,
      'uViewportSize'
    );
    shader_program.TimeUniform = gl.getUniformLocation(
      shader_program,
      'time'
    );

    return shader_program;
  }

  var time = 0;
  /** Pass all the basic uniform data */
  function setBasicUniforms(shader_program, matrices) {
    gl.uniformMatrix4fv(shader_program.pMatrixUniform, false, matrices.pMatrix);
    gl.uniformMatrix4fv(shader_program.mvMatrixUniform, false, matrices.mvMatrix);
    gl.uniform2f(
        shader_program.ViewportSizeUniform,
        gl.viewportWidth,
        gl.viewportHeight
    );

    time += 40/1000;

    gl.uniform1f(shader_program.TimeUniform, time);
  }

  /** Creates the buffers and pipes in all the vertex data */
  function initBuffers() {
    // Quad positions
    var squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    var vertices = [
       1.0,  1.0,  0.0,
      -1.0,  1.0,  0.0,
       1.0, -1.0,  0.0,
      -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;

    // Quad UVs
    var squareVertexUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexUVBuffer);
    var uvs = [
        1.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        0.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    squareVertexUVBuffer.itemSize = 2;
    squareVertexUVBuffer.numItems = 4;

    // Return buffers
    return {
      positionBuffer: squareVertexPositionBuffer,
      uvBuffer: squareVertexUVBuffer
    };
  }

  /** Draw loop */
  function drawScene(buffers, shader_program, uniform_callback) {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var matrices = {
      pMatrix: mat4.create(),
      mvMatrix: mat4.create()
    };

    matrices.pMatrix = mat4.ortho(matrices.pMatrix, -1, 1, -1, 1, 0.01, 10);
    matrices.mvMatrix = mat4.fromTranslation(
      matrices.mvMatrix,
      vec3.fromValues(0.0, 0.0, -0.01)
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
    gl.vertexAttribPointer(
      shader_program.vertexPositionAttribute,
      buffers.positionBuffer.itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uvBuffer);
    gl.vertexAttribPointer(
      shader_program.vertexUVAttribute,
      buffers.uvBuffer.itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );

    setBasicUniforms(shader_program, matrices);
    uniform_callback(gl, shader_program);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffers.positionBuffer.numItems);
  }

  /** Entry point function */
  function startWebGL(canvas_name, uniform_callback) {
    var canvas = document.getElementById(canvas_name);
    gl = initWebGL(canvas);
    if (gl) {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);
      var shader_program = initShaders(canvas_name);
      var buffers = initBuffers();
      setInterval(drawScene, 40, buffers, shader_program, uniform_callback);
    }
  }
  startWebGL(canvas_name, uniform_callback);
}
