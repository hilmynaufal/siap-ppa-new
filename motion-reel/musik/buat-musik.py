"""Membuat musik latar motion reel SIAP PPA (komposisi orisinal, disintesis dari nol).

Tidak memakai sampel atau rekaman pihak lain, jadi bebas hak cipta: dilepas CC0 (domain publik).
Jalankan: python3 musik/buat-musik.py  ->  musik/siap-ppa-reel.wav  (lalu ffmpeg ke .m4a, lihat README)
Durasi mengikuti linimasa reel (46 detik). Kunci C mayor, 96 BPM, progresi C - G - Am - F.
"""
import numpy as np, wave, os

SR, DUR, BPM = 44100, 46.0, 96
N = int(SR * DUR)
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)

mtof = lambda m: 440 * 2 ** ((m - 69) / 12)

def add(buf, start, sig, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N: return
    sig = sig[: N - i]
    gl, gr = gain * np.sqrt((1 - pan) / 2), gain * np.sqrt((1 + pan) / 2)
    L[i:i + len(sig)] += sig * gl
    R[i:i + len(sig)] += sig * gr

def env(n, a, r, curve=3.0):
    x = np.arange(n) / SR
    e = np.minimum(1, x / max(a, 1e-4)) * np.exp(-curve * x / max(r, 1e-4))
    return e

def tone(freq, length, a=.01, r=.6, harm=(1, .35, .12), curve=3.0, detune=0.0):
    n = int(length * SR); x = np.arange(n) / SR
    s = sum(h * np.sin(2 * np.pi * freq * (k + 1) * (1 + detune) * x) for k, h in enumerate(harm))
    return s * env(n, a, r, curve)

def pad(freq, length):
    n = int(length * SR); x = np.arange(n) / SR
    s = 0
    for d in (-.004, 0, .004):
        s = s + np.sin(2 * np.pi * freq * (1 + d) * x) + .3 * np.sin(2 * np.pi * 2 * freq * (1 + d) * x)
    a = np.minimum(1, x / 1.2); r = np.minimum(1, (length - x) / 1.4)
    return s * a * r * (1 + .08 * np.sin(2 * np.pi * .23 * x))

CH = [  # (akor pad, bas, nada arpeggio)
    ([48, 52, 55, 64], 36, [60, 64, 67, 72]),   # C
    ([43, 50, 55, 62], 31, [59, 62, 67, 71]),   # G
    ([45, 52, 57, 60], 33, [57, 60, 64, 69]),   # Am
    ([41, 48, 53, 57], 29, [57, 60, 65, 69]),   # F
]
BELL = [76, 79, 81, 79, 76, 79, 83, 81]  # E5 G5 A5 ... pentatonik C

def lvl(t, pts):  # interpolasi linear tingkat kekerasan menurut waktu
    return float(np.interp(t, [p[0] for p in pts], [p[1] for p in pts]))

nbar = int(DUR / BAR) + 1
for b in range(nbar):
    t0 = b * BAR
    pads, bass, arp = CH[b % 4]
    last = t0 + BAR >= 42.0
    # pad: selalu ada, makin penuh setelah 7 detik
    pv = lvl(t0, [(0, .5), (7, .75), (36, .9), (42, .8)])
    for m in pads:
        add(None, t0, pad(mtof(m), BAR + .6) * .05 * pv, pan=(m % 7 - 3) / 12)
    # bas lembut mulai ~15 detik
    if t0 >= 14.5:
        for k in (0, 2):
            add(None, t0 + k * BEAT, tone(mtof(bass), 2 * BEAT, a=.02, r=1.2, harm=(1, .25), curve=2.0) * .16)
    # arpeggio kalimba delapanan mulai ~7.4 detik
    if 7.2 <= t0 < 44.0:
        av = lvl(t0, [(7, .5), (15, .8), (26, .7), (36.5, 1.0), (42, .6)])
        order = [0, 1, 2, 3, 2, 1, 2, 1]
        for k, o in enumerate(order):
            tt = t0 + k * BEAT / 2
            vel = (1.0 if k % 4 == 0 else .62) * av
            add(None, tt, tone(mtof(arp[o]), .9, a=.004, r=.35, harm=(1, .4, .15, .06), curve=4.5) * .09 * vel, pan=(-.35 if k % 2 else .35))
    # lonceng sparse: pembuka tiap 2 bar dan melodi setelah 15 detik
    if b % 2 == 0 and t0 < 7.2:
        add(None, t0 + BEAT, tone(mtof(BELL[b // 2 % 8] + 12), 2.2, a=.005, r=1.0, harm=(1, .2, .05), curve=2.6) * .07, pan=.2)
    if 15 <= t0 < 44:
        mel = [BELL[(b * 2) % 8], BELL[(b * 2 + 1) % 8]]
        for k, m in enumerate(mel):
            add(None, t0 + (1 + 2 * k) * BEAT, tone(mtof(m), 1.4, a=.006, r=.7, harm=(1, .25, .08), curve=3.2) * .08 * lvl(t0, [(15, .7), (36.5, 1.0), (42, .5)]), pan=-.2)
    # perkusi sangat halus: kick lembut + shaker mulai ~15 detik
    if 14.5 <= t0 < 43.0:
        pv2 = lvl(t0, [(14.5, .6), (36.5, 1.0), (42, .5)])
        for k in (0, 2):
            n = int(.35 * SR); x = np.arange(n) / SR
            kick = np.sin(2 * np.pi * (48 + 60 * np.exp(-x * 30)) * x) * np.exp(-x * 11)
            add(None, t0 + k * BEAT, kick * .16 * pv2)
        for k in range(8):
            if k % 2 == 1:
                n = int(.07 * SR); nz = rng.standard_normal(n); nz = np.diff(nz, prepend=0)  # sapuan frekuensi tinggi
                add(None, t0 + k * BEAT / 2, nz * np.exp(-np.arange(n) / SR * 55) * .035 * pv2, pan=.4)

# akor penutup yang panjang (C mayor) sekitar detik 42
for m in (48, 55, 64, 72, 76):
    add(None, 41.8, pad(mtof(m), 4.4) * .05, pan=(m % 5 - 2) / 8)
add(None, 41.9, tone(mtof(84), 3.5, a=.005, r=1.6, harm=(1, .2), curve=2.0) * .07, pan=.1)

# gaung ruangan sederhana (konvolusi dengan derau meluruh)
def reverb(x, secs=2.2, wet=.28):
    n = int(secs * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.2)
    ir[:int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR)); ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
    return x * (1 - wet) + y * wet * 1.6
L = reverb(L); R = reverb(R[::-1])[::-1] if False else reverb(R)

# fade in/out dan normalisasi (puncak -3 dBFS)
fade = np.minimum(1, t_all / 1.5) * np.minimum(1, (DUR - t_all) / 2.5)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max()); L *= .708 / peak; R *= .708 / peak
out = (np.stack([L, R], 1) * 32767).astype('<i2')
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'siap-ppa-reel.wav')
with wave.open(path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ditulis', path)
