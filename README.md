# KuhAI pitch (3 min)

Prezentacija u three.js, u stilu aplikacije KuhAI (iste boje, fontovi, ikone i fotke jela).
Lonac iz loga je 3D. Slajdovi se mijenjaju pokretom kamere i namirnica.
Na kraju idu QR kod koji vodi na aplikaciju, pa crtić (promo video, 45 s), a zatim zadnji slajd uroni u lonac i odmah otvori aplikaciju.

## Pokretanje

```
npm install
npm run dev        # razvoj, otvara preglednik
npm run build      # → dist/index.html (jedan fajl, sve unutra)
```

**Na dan pitcha:** otvori `dist/index.html` dvoklikom u Chromeu i pritisni **F** za cijeli zaslon.
`dist/crtic.mp4` mora biti u istoj mapi kao `index.html` (kopiraj cijelu mapu `dist`).
Radi i bez interneta. Internet treba samo zadnjem slajdu, koji otvara aplikaciju.

Adresa aplikacije (QR kod i zadnji slajd) je u `src/config.js`.

## Kontrole

| tipka | radnja |
|---|---|
| → ↓ razmaknica Enter PageDown, klik | sljedeći slajd |
| ← ↑ PageUp Backspace, desni klik | prethodni |
| 1–9, Home | skok na slajd |
| F | cijeli zaslon |
| T | štoperica 3:00 (crvena zadnjih 15 s) |
| N | bilješke za govor |

Daljinski za prezentacije (clicker) radi jer šalje PageDown/PageUp.
`?noredirect` u adresi isključuje odlazak na aplikaciju (za probu).

## Slajdovi i tekst za govor

Crtić traje 45 s, pa za govor ostaje oko 2:15.

| # | slajd | ~s | što reći |
|---|---|---|---|
| 1 | KuhAI | 10 | Bok! Mi smo KuhAI. Aplikacija koja umjesto tebe smisli što ćeš jesti cijeli tjedan, od onoga što već imaš u frižideru. |
| 2 | 20 min scrollaš… | 15 | Je li ovo tvoja večera? Tražiš recept, 20 minuta kasnije još scrollaš… i na kraju naručiš dostavu za dvadesetak eura. |
| 3 | 71 kg | 15 | A namirnice koje već imaš doma završe u smeću. U Hrvatskoj se baci 71 kg hrane po osobi godišnje, tri četvrtine toga u kućanstvima. |
| 4 | STOP. KUHAJ → KUHAI | 10 | Zato: stop. Kuhaj. A AI ti pomaže, zato KuhAI. |
| 5 | Kako radi | 25 | Odgovoriš na par brzih pitanja i slikaš frižider. AI prepozna namirnice i što uskoro ističe. Dobiješ cijeli tjedan: jelovnik, meal prep u dva bloka i košaricu u Konzumu. |
| 6 | Tvoj tjedan | 25 | Svaki obrok ima razlog: špinat ističe sutra, pa ide prvi. Ne jede ti se nešto? Protreseš mobitel i dobiješ novo jelo od istih namirnica. |
| 7 | Brojke | 20 | Primjer tjedna iz aplikacije: cijela košarica 58 €, to je 250 € manje nego dostava. I 11 € hrane spašeno od bacanja. |
| 8 | Ispod poklopca | 20 | Gemini prepoznaje namirnice s fotke, planer slaže tjedan u četiri paralelna AI poziva, košarica se puni iz pravog Konzumova kataloga. |
| 9 | QR | 20 | Ne vjerujte nam na riječ. Skenirajte i probajte odmah. |
| 10 | crtić | 45 | Pušta se sam, sa zvukom (`public/crtic.mp4`). Kad završi, sam ide na zadnji slajd. Dalje ga preskače. |
| 11 | → aplikacija | | Kamera uroni u lonac i otvori se aplikacija. |

## Izvori i napomene

- 71 kg / 76 %: istraživanje Ministarstva gospodarstva RH o otpadu od hrane (2021.), metodologija EU
  ([TheMayor.eu](https://themayor.eu/en/a/view/40-of-the-food-croatian-households-discard-is-edible-9708),
  [Total Croatia News](https://total-croatia-news.com/news/croatian-food-waste-2/)).
- Brojke tjedna (58,40 €, 251,60 €, 11,20 €) su primjer iz aplikacije.
- Fotke jela i ikone su iz aplikacije KuhAI.

## Struktura

- `index.html`: tekst slajdova (HTML sloj iznad 3D scene)
- `src/world.js`: 3D svijet (lonac, namirnice, kartice jela, para) i rasporedi po slajdu
- `src/main.js`: redoslijed slajdova, prijelazi, kontrole
- `src/style.css`: tokeni iz aplikacije
- `tools/shots.mjs`: snimke svih slajdova za provjeru (`node tools/shots.mjs shots 1920 1080`, nakon builda)
