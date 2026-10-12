import math
NAVY="#0f2a63"; MAG="#d6247c"
def f(v): return ("%.2f"%v).rstrip("0").rstrip(".")
def glyph(ch,x,y,cap,t):
    top=y+t/2; bot=y+cap-t/2; s=x+t/2
    if ch=="I": return f"M{f(s)} {f(top)}V{f(bot)}",t
    if ch=="P":
        hb=0.58*cap; r=(hb-t)/2; w=0.30*cap
        return f"M{f(s)} {f(bot)}V{f(top)}H{f(s+w)}a{f(r)} {f(r)} 0 0 1 0 {f(2*r)}H{f(s)}",t/2+w+r+t/2
    if ch=="A":
        wa=0.78*cap; xm=x+wa/2; xl=x+t/2; xr=x+wa-t/2
        yb=y+0.70*cap; fr=(bot-yb)/(bot-top)
        a=xl+fr*(xm-xl); b=xr-fr*(xr-xm)
        return f"M{f(xl)} {f(bot)}L{f(xm)} {f(top)}L{f(xr)} {f(bot)}M{f(a)} {f(yb)}H{f(b)}",wa
    if ch=="S":
        r=(cap-t)/4; cx=x+t/2+r; c1=y+t/2+r
        k=math.radians(38)
        sx=cx+r*math.cos(k); sy=c1-r*math.sin(k)
        c2=y+cap-t/2-r
        ex=cx-r*math.cos(k); ey=c2+r*math.sin(k)
        return f"M{f(sx)} {f(sy)}A{f(r)} {f(r)} 0 1 0 {f(cx)} {f(y+cap/2)}A{f(r)} {f(r)} 0 1 1 {f(ex)} {f(ey)}",2*r+t
def word(txt,x,y,cap,t,track=0.16,color=NAVY):
    d=[];cx=x
    for ch in txt:
        p,w=glyph(ch,cx,y,cap,t); d.append(p); cx+=w+track*cap
    cx-=track*cap
    return f'<path d="{"".join(d)}" fill="none" stroke="{color}" stroke-width="{f(t)}" stroke-linecap="round" stroke-linejoin="round"/>',cx-x
def sym(cx=128,top=41,color=NAVY,dot=MAG,sw=30,scale=1,ox=0,oy=0):
    return (f'<g transform="translate({f(ox)} {f(oy)}) scale({f(scale)})">'
     f'<path d="M60 214V124a68 68 0 0 1 136 0v90" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'
     f'<circle cx="128" cy="150" r="24" fill="{dot}"/></g>')
def svg(w,h,body,title,y0=0): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {f(y0)} {f(w)} {f(h)}" role="img"><title>{title}</title>{body}</svg>\n'
def w(name,s): open(name,"w",encoding="utf-8").write(s)

# symbol (arch spans x45..211, y41..229)
w("siap-symbol.svg",svg(256,256,sym(oy=-7),"SIAP PPA"))
# small cut: heavier stroke, bigger dot, narrower hole stays open
w("siap-symbol-small.svg",svg(256,256,
 '<g transform="translate(0 -7)"><path d="M56 218V124a72 72 0 0 1 144 0v94" fill="none" stroke="%s" stroke-width="42" stroke-linecap="round"/><circle cx="128" cy="154" r="32" fill="%s"/></g>'%(NAVY,MAG),"SIAP PPA small"))
# horizontal: symbol height 41..229 (188). SIAP cap 118 + gap 22 + PPA cap 48
sc=1.0; sx=-45  # shift symbol so left edge at 0
bx=166+34  # text start after symbol width (166) + gap
siap,wS=word("SIAP",bx,41,118,19,0.14)
ppa,wP=word("PPA",bx,41+118+22,48,9,0.30)
W=bx+max(wS,wP)
def horiz(c,d,bg=None,tc=NAVY):
    siap_,_=word("SIAP",bx,41,118,19,0.14,tc); ppa_,_=word("PPA",bx,181,48,9,0.30,tc)
    return svg(W,188,sym(color=c,dot=d,ox=-45,oy=0).replace("translate(-45 0)","translate(-45 0)")+siap_+ppa_,"SIAP PPA",41)
w("siap-horizontal.svg",horiz(NAVY,MAG))
# stacked: symbol centred above SIAP PPA on one line
def stacked(c,d,tc):
    s_,ws=word("SIAP",0,0,64,10.5,0.14,tc); p_,wp=word("PPA",0,0,64,10.5,0.14,tc)
    gap=40; tw=ws+gap+wp
    wd=max(tw,170)+0
    ox=(wd-166)/2-45
    tx=(wd-tw)/2
    s2,_=word("SIAP",tx,244,64,10.5,0.14,tc); p2,_=word("PPA",tx+ws+gap,244,64,10.5,0.14,tc)
    return svg(wd,267,sym(color=c,dot=d,ox=ox)+s2+p2,"SIAP PPA",41)
w("siap-stacked.svg",stacked(NAVY,MAG,NAVY))
w("siap-wordmark.svg",svg(W-bx,188,"".join([word("SIAP",0,0,118,19,0.14)[0],word("PPA",0,140,48,9,0.30)[0]]),"SIAP PPA"))
# reversed (thinned strokes, lighter magenta)
RD="#ff6fb0"
w("siap-symbol-reversed.svg",svg(256,256,sym(color="#ffffff",dot=RD,sw=28,oy=-7),"SIAP PPA"))
w("siap-horizontal-reversed.svg",horiz("#ffffff",RD,tc="#ffffff").replace('stroke-width="19"','stroke-width="18"'))
w("siap-stacked-reversed.svg",stacked("#ffffff",RD,"#ffffff"))
print("ok",W)
