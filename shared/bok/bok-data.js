/* ──────────────────────────────────────────────────────────────────────────
   shared/bok/bok-data.js — datalaget for bokføringsoppslagene under /regnskap/.

   FASE 1 (2026-09-22): inneholder KUN konstantene skatteavstemmingen trenger.
   Ingen kontoplan, ingen mva-koder, ingen kontoklasser, ingen bransjeliste.
   De kommer i fase 2, og kontoplanen har egne rettslige rammer som må avklares først.

   Hvorfor .js og ikke .json: én forespørsel, ingen ekstra rundtur, cachet på
   tvers av oppslag, og virker fra file:// under utvikling.

   KONTRAKTEN FOR EN KONSTANT — alle felt er obligatoriske:
     verdi        maskinlesbar verdi (desimaltall, ikke prosent)
     visning      slik den skrives for mennesker
     navn         hva den heter
     kilde        primærkilden, med paragraf
     url          direktelenke til primærkilden
     kontrollert  ISO-dato. Satt av mennesket som faktisk slo opp kilden.
     utloper      ISO-dato. Motoren setter varselet SELV når denne er passert.
     gjelderFra   ISO-dato
     nektVedUtlop false = vis med varsel · true = nekt å vise verdien
                  Regelen: satser som inngår i et bilagsforslag skal nekte,
                  satser som bare informerer skal vise med varsel. Skatte-
                  avstemmingen produserer ingen bilag, så begge står på false.
     bruktI       hvilke oppslag som bruker den. Fase 6 bygger /regnskap/satser/
                  på dette feltet, så det skal være riktig fra første konstant.

   MERK OM KLOKKA: utløpsvarselet leser klientens egen klokke. En maskin med
   feil dato får varselet for tidlig eller for sent. Det står også på siden.
   ────────────────────────────────────────────────────────────────────────── */

window.BOK_DATA = {

  konstanter: {

    skattesats_alminnelig: {
      verdi:        0.22,
      visning:      '22 %',
      navn:         'Skattesats på alminnelig inntekt for selskap',
      kilde:        'Stortingets skattevedtak for inntektsåret 2026 § 3-3 første ledd',
      url:          'https://lovdata.no/dokument/STV/forskrift/2025-12-18-2747/KAPITTEL_3',
      kontrollert:  '2026-09-22',
      utloper:      '2027-01-01',
      gjelderFra:   '2026-01-01',
      nektVedUtlop: false,
      bruktI:       ['l6-skatteavstemming']
    },

    skattesats_finansskatt: {
      verdi:        0.25,
      visning:      '25 %',
      navn:         'Skattesats for selskap som svarer finansskatt på lønn',
      kilde:        'Stortingets skattevedtak for inntektsåret 2026 § 3-3 annet ledd, jf. folketrygdloven § 23-2 a',
      url:          'https://lovdata.no/dokument/STV/forskrift/2025-12-18-2747/KAPITTEL_3',
      kontrollert:  '2026-09-22',
      utloper:      '2027-01-01',
      gjelderFra:   '2026-01-01',
      nektVedUtlop: false,
      bruktI:       ['l6-skatteavstemming']
    },

    fritaksmetode_sjablong: {
      verdi:        0.03,
      visning:      '3 %',
      navn:         'Treprosentregelen i fritaksmetoden',
      kilde:        'Skatteloven § 2-38 sjette ledd bokstav a',
      url:          'https://lovdata.no/lov/1999-03-26-14/%C2%A72-38',
      kontrollert:  '2026-09-22',
      utloper:      '2027-01-01',
      gjelderFra:   '2026-01-01',
      nektVedUtlop: false,
      bruktI:       ['l6-skatteavstemming']
    }

  }

};
