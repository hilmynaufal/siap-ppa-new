# Musik latar motion reel

`siap-ppa-reel.m4a` adalah komposisi orisinal yang disintesis dari nol oleh `buat-musik.py` (gelombang sinus dan derau,
tanpa sampel, rekaman, atau melodi milik pihak lain). Karena itu tidak ada hak cipta pihak ketiga dan tidak perlu atribusi.
Dilepas sebagai **CC0 (domain publik)**: bebas dipakai, diubah, dan disebarkan, termasuk untuk keperluan pemerintah.

Buat ulang: `python3 musik/buat-musik.py` lalu
`ffmpeg -i musik/siap-ppa-reel.wav -c:a aac -b:a 192k musik/siap-ppa-reel.m4a`. Durasi 46 dtk mengikuti linimasa reel
(`T` di `index.html`); ubah `DUR` di skrip bila linimasa berubah.

Dua versi: `siap-ppa-reel.m4a` (46 dtk, untuk reel lama `siap-ppa-reel.mp4`) dan `siap-ppa-reel-vo.m4a` (84,7 dtk, untuk
`siap-ppa-reel-vo.mp4` yang memakai jeda voice over). Versi panjang: `python3 musik/buat-musik.py 84.7 siap-ppa-reel-vo.wav`.
