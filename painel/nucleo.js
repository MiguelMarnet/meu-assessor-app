/* ============================================================
   ASSESSOR.IA — Shader do núcleo (fonte única)

   O GLSL do núcleo vivia inline no index.html. Quando o mini-app
   precisou da mesma linguagem visual, copiar seria criar uma segunda
   verdade — dois shaders pra manter em sincronia. Então mora aqui.

   Hoje quem importa é só o index.html. O mini-app chegou a montar um
   núcleo 3D próprio a partir daqui, mas o 3D foi retirado de lá a
   pedido — ficou clean, sem WebGL e sem interação. As funções de
   montagem foram removidas junto, pra não deixar código morto.
   ============================================================ */

export const NOISE = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  float shapeRadius(vec3 d, float id){
    if (id < 0.5) return 1.0;
    else if (id < 1.5){ float e=3.0; float k=pow(pow(abs(d.x),e)+pow(abs(d.y),e)+pow(abs(d.z),e),1.0/e); return 0.92/max(k,0.35); }
    else if (id < 2.5){ float a=atan(d.z,d.x); float b=acos(clamp(d.y,-1.0,1.0)); return 1.0+0.24*sin(6.0*a)*sin(5.0*b); }
    else if (id < 3.5){ float a=atan(d.z,d.x); return (0.96+0.12*abs(sin(4.0*a)))*(1.0-0.16*abs(d.y)); }
    else { float a=atan(d.z,d.x); return (1.0+0.15*(1.0-abs(d.y)))*(1.0-0.35*smoothstep(0.6,1.0,abs(d.y)))*(1.0+0.04*sin(8.0*a)); }
  }
  vec3 distort(vec3 p, float uTime, float uFreq, float uSpeed, float uAmp, float sA, float sB, float sMix){
    vec3 dir=normalize(p); float baseR=length(p);
    float shape=mix(shapeRadius(dir,sA), shapeRadius(dir,sB), sMix);
    float n=snoise(p*uFreq+vec3(uTime*uSpeed));
    n+=0.5*snoise(p*uFreq*1.9+vec3(-uTime*uSpeed*0.7));
    return dir*(baseR*shape + n*uAmp);
  }`;
