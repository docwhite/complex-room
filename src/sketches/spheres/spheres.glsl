precision mediump float;

uniform float uParameter;
uniform float time;
uniform vec2 uViewportSize;

varying vec2 uv;

void main(void) {
    gl_FragColor =  vec4(uv.x, uParameter, 1.0+0.5*sin(time), 1.0);
}