import os,sys
sys.path.insert(0,"src")
import build as B
from build import word,svg,f,NAVY,MAG
RD="#ff6fb0"
def marks(c,d,small=False):
    return {
     "B":(30,26,239,230),"C":(34,34,232,232)}
def sym_b(c,d,sw=28,small=False):
    if small: return (f'<circle cx="94" cy="56" r="30" fill="{c}"/><path d="M42 224v-60a54 54 0 0 1 108 0v60" fill="none" stroke="{c}" stroke-width="40" stroke-linecap="round"/>'
        f'<circle cx="208" cy="138" r="22" fill="{d}"/><path d="M186 222v-18a22 22 0 0 1 44 0v18" fill="none" stroke="{d}" stroke-width="32" stroke-linecap="round"/>'),(22,26,246,238)
    return (f'<circle cx="96" cy="50" r="24" fill="{c}"/><path d="M44 216V158a52 52 0 0 1 104 0v58" fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round"/>'
        f'<circle cx="206" cy="132" r="17" fill="{d}"/><path d="M184 219V197a22 22 0 0 1 44 0v22" fill="none" stroke="{d}" stroke-width="22" stroke-linecap="round"/>'),(30,26,239,230)
def ring(x,y,c,sw,centre=True):
    s=90;r=sw/2
    o=f'<rect x="{x+r}" y="{y+r}" width="{s-sw}" height="{s-sw}" rx="22" fill="none" stroke="{c}" stroke-width="{sw}"/>'
    if centre: o+=f'<rect x="{x+34}" y="{y+34}" width="22" height="22" rx="6" fill="{c}"/>'
    return o
def sym_c(c,d,sw=22,small=False):
    sw=30 if small else sw
    o=ring(34,34,c,sw,not small)+ring(142,34,c,sw,not small)+ring(34,142,c,sw,not small)
    o+=f'<circle cx="187" cy="187" r="{40 if small else 36}" fill="{d}"/>'
    return o,(34,34,232,232)
def sq(body,bb,ty=0,sc=1):
    x0,y0,x1,y1=bb;return body
def horiz(fn,c,d,tc,H=188):
    body,(x0,y0,x1,y1)=fn(c,d); s=H/(y1-y0); ws=(x1-x0)*s; bx=ws+34
    a,wa=word("SIAP",bx,0,118,19,0.14,tc); b,_=word("PPA",bx,140,48,9,0.30,tc)
    g=f'<g transform="scale({f(s)}) translate({-x0} {-y0})">{body}</g>'
    return svg(bx+wa,H,g+a+b,"SIAP PPA")
def stack(fn,c,d,tc,H=188):
    body,(x0,y0,x1,y1)=fn(c,d); s=H/(y1-y0); ws=(x1-x0)*s
    s_,a=word("SIAP",0,0,64,10.5,0.14,tc);p_,b=word("PPA",0,0,64,10.5,0.14,tc)
    gap=40;tw=a+gap+b;wd=max(tw,ws)
    g=f'<g transform="translate({f((wd-ws)/2)} 0) scale({f(s)}) translate({-x0} {-y0})">{body}</g>'
    s2,_=word("SIAP",(wd-tw)/2,H+30,64,10.5,0.14,tc);p2,_=word("PPA",(wd-tw)/2+a+gap,H+30,64,10.5,0.14,tc)
    return svg(wd,H+30+64,g+s2+p2,"SIAP PPA")
def sq256(fn,c,d,small=False,sw=None):
    body,(x0,y0,x1,y1)=fn(c,d,small=small) if small else fn(c,d)
    s=min(176/(x1-x0),176/(y1-y0)); tx=128-s*(x0+x1)/2; ty=124-s*(y0+y1)/2
    return svg(256,256,f'<g transform="translate({f(tx)} {f(ty)}) scale({f(s)})">{body}</g>',"SIAP PPA")
for k,fn in (("b",sym_b),("c",sym_c)):
    os.makedirs(f"alt-{k}",exist_ok=True)
    W=lambda n,s:open(f"alt-{k}/siap-{n}.svg","w",encoding="utf-8").write(s)
    W("symbol",sq256(fn,NAVY,MAG)); W("symbol-small",sq256(fn,NAVY,MAG,small=True))
    W("symbol-reversed",sq256(fn,"#ffffff",RD))
    W("horizontal",horiz(fn,NAVY,MAG,NAVY)); W("stacked",stack(fn,NAVY,MAG,NAVY))
    W("horizontal-reversed",horiz(fn,"#ffffff",RD,"#ffffff")); W("stacked-reversed",stack(fn,"#ffffff",RD,"#ffffff"))
print("ok")
