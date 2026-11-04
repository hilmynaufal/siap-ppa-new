# Musik latar motion reel

`siap-ppa-reel.m4a` adalah komposisi orisinal yang disintesis dari nol oleh `buat-musik.py` (gelombang sinus dan derau,
tanpa sampel, rekaman, atau melodi milik pihak lain). Karena itu tidak ada hak cipta pihak ketiga dan tidak perlu atribusi.
Dilepas sebagai **CC0 (domain publik)**: bebas dipakai, diubah, dan disebarkan, termasuk untuk keperluan pemerintah.

Buat ulang: `python3 musik/buat-musik.py` lalu
`ffmpeg -i musik/siap-ppa-reel.wav -c:a aac -b:a 192k musik/siap-ppa-reel.m4a`. Durasi 46 dtk mengikuti linimasa reel
(`T` di `index.html`); ubah `DUR` di skrip bila linimasa berubah.
