# KuhAI pitch (3 min)

Prezentacija u three.js, u stilu aplikacije KuhAI (iste boje, fontovi, ikone i fotke jela).
Lonac iz loga je 3D. Slajdovi se mijenjaju pokretom kamere i namirnica.
Na kraju idu QR kod koji vodi na aplikaciju, pa crtić (promo video, 37 s), a zatim zadnji slajd uroni u lonac i odmah otvori aplikaciju.

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

## Slajdovi i tekst za govor (3:00)

Videi uzimaju 77 s (demo 40 s + crtić 37 s), za govor ostaje oko 100 s.

| # | slajd | ~s | što reći |
|---|---|---|---|
| 1 | KuhAI | 8 | Bok! Mi smo KuhAI. Aplikacija koja umjesto tebe smisli što ćeš jesti cijeli tjedan, od onoga što već imaš u frižideru. |
| 2 | 20 min scrollaš… | 12 | Je li ovo tvoja večera? Tražiš recept, 20 minuta kasnije još scrollaš… i na kraju naručiš dostavu za dvadesetak eura. |
| 3 | 71 kg | 12 | A ono što već imaš doma završi u smeću. U Hrvatskoj 71 kg hrane po osobi godišnje, tri četvrtine u kućanstvima. |
| 4 | STOP. KUHAJ → KUHAI | 6 | Zato: stop. Kuhaj. A AI ti pomaže, zato KuhAI. |
| 5 | Kako radi | 12 | Tri koraka: slikaš frižider, dobiješ tjedan, košarica je gotova. Evo uživo. |
| 6 | demo (40 s) | 40 | Pričaj preko snimke (bez zvuka): Par brzih pitanja, slikam frižider, AI prepozna ciklu, jagode i krastavac. Swipeom biram što mi se jede i za minutu imam cijeli tjedan s meal prepom. Ne paše mi jelo? Protresem. I košarica u Konzumu, naručeno. |
| 7 | Brojke | 15 | Primjer tjedna: cijela košarica 58 €, to je 250 € manje nego dostava. I 11 € hrane spašeno od bacanja. |
| 8 | Ispod poklopca: Što smo skuhali | 15 | Iz jedne fotke zna što imaš i što ističe. Za oko minutu složi cijeli tjedan, prvo ono što bi se bacilo. Košarica iz 249 pravih Konzumovih proizvoda. I radi uživo, probajte. |
| 9 | QR | 10 | Ne vjerujte nam na riječ. Skenirajte i probajte odmah. |
| 10 | crtić (37 s) | 37 | Pušta se sam, sa zvukom. Kad završi, sam ide na zadnji slajd. |
| 11 | → aplikacija | | Kamera uroni u lonac i otvori se aplikacija. |

Demo i crtić idu sami i na kraju sami prelaze na sljedeći slajd; tipka dalje ih preskače.
Slajd „Tvoj tjedan“ (kartice jela u 3D) izbačen je jer demo pokazuje isto uživo; vraća se iz git povijesti.

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
- `npm run qa`: cijela provjera u Chromeu (prolaz naprijed/natrag, videi, brzo klikanje, odlazak na aplikaciju, 16:10, 4:3, mobitel)

## Demo aplikacije (snimka ekrana)

```
node demo/record.mjs     # prođe kroz živu aplikaciju na mobitelu (390×844) i snimi ekran → demo/out/rec
node demo/compose.mjs    # telefon u okviru + naslovi poglavlja, čekanje na AI ubrzano → demo/out/kuhai-demo.mp4 (82 s)
node demo/compose.mjs --kratko   # 40 s za pitch (bez AI pitanja i recepta) → demo/out/kuhai-demo-kratko.mp4 = public/demo.mp4
```

Snimanje traje oko 4 minute jer pravi AI pozivi traju (plan 60–90 s). U videu je to ubrzano uz oznaku „ubrzano ×N“.
Fotka frižidera: `demo/frizider.jpg` ([Pexels 4443433](https://www.pexels.com/photo/4443433/), Pexels License).
