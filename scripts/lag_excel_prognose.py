"""Lager modellering/prognose/treaarsprognose-eksempel.xlsx.

Samme modell som kalkulatoren på /modellering/prognose/ (regnemotoren er
forecast() i modellering/modellering.js), med Medistim ASA 2025 som startverdier.
Alle tall utenom forutsetningene er ekte Excel-formler, så filen regner om
når brukeren endrer en blå celle. Ingen makroer.

Kjør fra repo-rota:  python scripts/lag_excel_prognose.py
"""
from datetime import datetime
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, Side

UT = Path(__file__).resolve().parent.parent / 'modellering' / 'prognose' / 'treaarsprognose-eksempel.xlsx'

# Medistim ASA, konsernregnskap 2025, tusen kroner (samme som EKS i prognose.js).
START = [
    ('Omsetning i fjor', 699767, 'Driftsinntekter i resultatregnskapet'),
    ('Anleggsmidler', 165484, 'Varige driftsmidler og immaterielle eiendeler'),
    ('Arbeidskapital', 182598, 'Varelager + fordringer − leverandørgjeld − annen kortsiktig gjeld'),
    ('Bankinnskudd', 212088, 'Kontanter og bankinnskudd'),
    ('Rentebærende gjeld', 49271, 'Banklån, obligasjoner og leieforpliktelser'),
    ('Egenkapital', 468407, 'Sum egenkapital i balansen'),
]
# (navn, forklaring, verdier år 1–3, er prosent)
FORUT = [
    ('Inntektsvekst', 'Økning i omsetning fra året før', [0.10, 0.08, 0.06], True),
    ('Driftsmargin før avskrivninger', 'Andel av omsetningen (EBITDA-margin)', [0.315] * 3, True),
    ('Avskrivninger', 'Andel av omsetningen', [0.035] * 3, True),
    ('Investeringer', 'Andel av omsetningen', [0.047] * 3, True),
    ('Arbeidskapital', 'Andel av omsetningen', [0.26] * 3, True),
    ('Rente på gjeld', 'Av gjelden ved starten av året', [0.013] * 3, True),
    ('Skattesats', '22 % for aksjeselskap', [0.22] * 3, True),
    ('Utbytte', 'Andel av årsresultatet', [0.92] * 3, True),
    ('Nytt lån (+) eller avdrag (−)', 'Beløp per år', [0, 0, 0], False),
]

TALL = '#,##0;-#,##0;0'          # Excel viser mellomrom som tusenskille med norske innstillinger
PROS = '0.0%'
BLA = Font(color='1F4E9E')        # forutsetninger brukeren kan endre
FET = Font(bold=True)
TITTEL = Font(bold=True, size=14)
LINJE = Border(top=Side(style='thin', color='808080'))
AAR = ['C', 'D', 'E']             # år 1–3 står i samme kolonner på alle ark
F = 'Forutsetninger'

wb = Workbook()


def ark(navn, tittel, undertittel, med_start=False):
    ws = wb.active if wb.active.title == 'Sheet' else wb.create_sheet()
    ws.title = navn
    ws['A1'] = tittel
    ws['A1'].font = TITTEL
    ws['A2'] = undertittel
    ws['A2'].font = Font(italic=True, color='595959')
    ws['A3'] = 'Tusen kroner'
    ws['A3'].font = FET
    if med_start:
        ws['B3'] = 'Start'
    for i, k in enumerate(AAR):
        ws[f'{k}3'] = f'År {i + 1}'
    for k in 'BCDE':
        ws[f'{k}3'].font = FET
        ws[f'{k}3'].alignment = Alignment(horizontal='right')
    ws.column_dimensions['A'].width = 44
    for k in 'BCDE':
        ws.column_dimensions[k].width = 14
    ws.freeze_panes = 'B4'
    return ws


def rad(ws, r, tekst, formler, fmt=TALL, sum_=False):
    """formler: dict kolonne -> formel/verdi."""
    ws[f'A{r}'] = tekst
    for k, v in formler.items():
        c = ws[f'{k}{r}']
        c.value = v
        c.number_format = fmt
    if sum_:
        for k in 'ABCDE':
            ws[f'{k}{r}'].font = FET
            ws[f'{k}{r}'].border = LINJE


def per_aar(fn):
    """fn(kolonne, forrige_kolonne) -> formel, for år 1–3."""
    return {k: fn(k, chr(ord(k) - 1)) for k in AAR}


# ---------- Forutsetninger ----------
ws = ark(F, 'Treårsprognose: forutsetninger',
         'Eksempel: Medistim ASA, konsernregnskap 2025. Blå tall kan endres, resten regnes ut. Regneeksempel, ikke investeringsråd.')
ws['B3'] = 'Startpunkt'
ws['A4'] = 'Startpunkt: siste årsregnskap'
ws['A4'].font = FET
S = {}                                     # navn -> cellereferanse
for i, (navn, verdi, forkl) in enumerate(START):
    r = 5 + i
    ws[f'A{r}'] = navn
    ws[f'B{r}'] = verdi
    ws[f'B{r}'].number_format = TALL
    ws[f'B{r}'].font = BLA
    ws[f'F{r}'] = forkl
    S[navn] = f"{F}!$B${r}"
rad(ws, 11, 'Andre poster, netto', {'B': '=B10+B9-B6-B7-B8'}, sum_=True)
ws['F11'] = 'Egenkapital + gjeld − anleggsmidler − arbeidskapital − bank. Holdes fast.'
S['Andre'] = f"{F}!$B$11"

ws['A13'] = 'Forutsetninger per år'
ws['A13'].font = FET
P = {}                                     # navn -> radnummer
for i, (navn, forkl, verdier, pros) in enumerate(FORUT):
    r = 14 + i
    ws[f'A{r}'] = navn
    for k, v in zip(AAR, verdier):
        ws[f'{k}{r}'] = v
        ws[f'{k}{r}'].number_format = PROS if pros else TALL
        ws[f'{k}{r}'].font = BLA
    ws[f'F{r}'] = forkl
    P[navn] = r
ws.column_dimensions['F'].width = 60


def fo(navn, k):
    return f"{F}!{k}${P[navn]}"


# ---------- Resultat ----------
R = 'Resultat'
ws = ark(R, 'Resultatregnskap', 'Kostnader og skatt står med minus. Renten regnes av gjelden ved starten av året.')
rad(ws, 4, 'Driftsinntekter', {'C': f"={S['Omsetning i fjor']}*(1+{fo('Inntektsvekst', 'C')})",
                               'D': f"=C4*(1+{fo('Inntektsvekst', 'D')})",
                               'E': f"=D4*(1+{fo('Inntektsvekst', 'E')})"})
rad(ws, 5, '   Vekst', per_aar(lambda k, p: f"={fo('Inntektsvekst', k)}"), fmt=PROS)
rad(ws, 6, 'Driftskostnader før avskrivninger', per_aar(lambda k, p: f"=-{k}4*(1-{fo('Driftsmargin før avskrivninger', k)})"))
rad(ws, 7, 'Driftsresultat før avskrivninger', per_aar(lambda k, p: f"={k}4+{k}6"), sum_=True)
rad(ws, 8, 'Avskrivninger', per_aar(lambda k, p: f"=-{k}4*{fo('Avskrivninger', k)}"))
rad(ws, 9, 'Driftsresultat', per_aar(lambda k, p: f"={k}7+{k}8"), sum_=True)
rad(ws, 10, 'Rentekostnad', per_aar(lambda k, p: f"=-Balanse!{p}10*{fo('Rente på gjeld', k)}"))
rad(ws, 11, 'Resultat før skatt', per_aar(lambda k, p: f"={k}9+{k}10"), sum_=True)
rad(ws, 12, 'Skattekostnad', per_aar(lambda k, p: f"=-MAX(0,{k}11)*{fo('Skattesats', k)}"))
rad(ws, 13, 'Årsresultat', per_aar(lambda k, p: f"={k}11+{k}12"), sum_=True)
rad(ws, 14, '   Herav utbytte', per_aar(lambda k, p: f"=MAX(0,{k}13)*{fo('Utbytte', k)}"))
ws['A16'] = 'Underskudd gir ingen skatt og ikke utbytte i modellen.'

# ---------- Balanse ----------
B = 'Balanse'
ws = ark(B, 'Balanse ved slutten av året', 'Start = siste årsregnskap. Bank kommer fra arket Kontantstrøm.', med_start=True)
K = 'Kontantstrøm'
rad(ws, 4, 'Anleggsmidler', {'B': f"={S['Anleggsmidler']}", **per_aar(lambda k, p: f"={p}4-'{K}'!{k}8+Resultat!{k}8")})
rad(ws, 5, 'Arbeidskapital', {'B': f"={S['Arbeidskapital']}", **per_aar(lambda k, p: f"=Resultat!{k}4*{fo('Arbeidskapital', k)}")})
rad(ws, 6, 'Andre poster, netto', {k: f"={S['Andre']}" for k in 'BCDE'})
rad(ws, 7, 'Bankinnskudd', {'B': f"={S['Bankinnskudd']}", **per_aar(lambda k, p: f"={p}7+'{K}'!{k}12")})
rad(ws, 8, 'Sum eiendeler (netto)', {k: f"=SUM({k}4:{k}7)" for k in 'BCDE'}, sum_=True)
rad(ws, 9, 'Egenkapital', {'B': f"={S['Egenkapital']}", **per_aar(lambda k, p: f"={p}9+Resultat!{k}13-Resultat!{k}14")})
rad(ws, 10, 'Rentebærende gjeld', {'B': f"={S['Rentebærende gjeld']}", **per_aar(lambda k, p: f"={p}10+{fo('Nytt lån (+) eller avdrag (−)', k)}")})
rad(ws, 11, 'Sum egenkapital og gjeld', {k: f"={k}9+{k}10" for k in 'BCDE'}, sum_=True)
rad(ws, 13, 'Balansen går opp (eiendeler minus egenkapital og gjeld, skal være 0)',
    {k: f"=ROUND({k}8-{k}11,2)" for k in 'BCDE'}, sum_=True)
ws['A14'] = 'Går balansen opp alle år?'
ws['B14'] = '=IF(SUMPRODUCT(ABS(B13:E13))<0.5,"Ja","Nei")'
ws['B14'].alignment = Alignment(horizontal='right')

# ---------- Kontantstrøm ----------
ws = ark(K, 'Kontantstrøm og avstemming mot bank', 'Indirekte metode. Penger ut står med minus.')
rad(ws, 4, 'Årsresultat', per_aar(lambda k, p: f"=Resultat!{k}13"))
rad(ws, 5, 'Pluss avskrivninger', per_aar(lambda k, p: f"=-Resultat!{k}8"))
rad(ws, 6, 'Minus økning i arbeidskapital', per_aar(lambda k, p: f"=-(Balanse!{k}5-Balanse!{p}5)"))
rad(ws, 7, 'Kontantstrøm fra drift', per_aar(lambda k, p: f"=SUM({k}4:{k}6)"), sum_=True)
rad(ws, 8, 'Investeringer', per_aar(lambda k, p: f"=-Resultat!{k}4*{fo('Investeringer', k)}"), sum_=True)
rad(ws, 9, 'Nytt lån eller avdrag', per_aar(lambda k, p: f"={fo('Nytt lån (+) eller avdrag (−)', k)}"))
rad(ws, 10, 'Utbytte', per_aar(lambda k, p: f"=-Resultat!{k}14"))
rad(ws, 11, 'Kontantstrøm fra finansiering', per_aar(lambda k, p: f"={k}9+{k}10"), sum_=True)
rad(ws, 12, 'Endring i bank', per_aar(lambda k, p: f"={k}7+{k}8+{k}11"), sum_=True)
rad(ws, 13, 'Bank ved starten av året', per_aar(lambda k, p: f"=Balanse!{p}7"))
rad(ws, 14, 'Bank ved slutten av året', per_aar(lambda k, p: f"={k}13+{k}12"), sum_=True)
rad(ws, 15, 'Bank i balansen', per_aar(lambda k, p: f"=Balanse!{k}7"))
rad(ws, 16, 'Kontroll (skal være 0)', per_aar(lambda k, p: f"=ROUND({k}14-{k}15,2)"), sum_=True)

# ---------- Fri kontantstrøm ----------
ws = ark('Fri kontantstrøm', 'Fri kontantstrøm til verdsettelsen',
         'Pengene driften gir før renter og avdrag. Skatten regnes av driftsresultatet, som om selskapet ikke hadde gjeld.')
rad(ws, 4, 'Driftsresultat', per_aar(lambda k, p: f"=Resultat!{k}9"))
rad(ws, 5, 'Minus skatt på driftsresultatet', per_aar(lambda k, p: f"=-{k}4*{fo('Skattesats', k)}"))
rad(ws, 6, 'Pluss avskrivninger', per_aar(lambda k, p: f"='{K}'!{k}5"))
rad(ws, 7, 'Minus investeringer', per_aar(lambda k, p: f"='{K}'!{k}8"))
rad(ws, 8, 'Minus økning i arbeidskapital', per_aar(lambda k, p: f"='{K}'!{k}6"))
rad(ws, 9, 'Fri kontantstrøm', per_aar(lambda k, p: f"=SUM({k}4:{k}8)"), sum_=True)
ws['A11'] = 'Til DCF-en trenger du også:'
ws['A11'].font = FET
rad(ws, 12, 'Rentebærende gjeld (start)', {'C': f"={S['Rentebærende gjeld']}"})
rad(ws, 13, 'Bankinnskudd (start)', {'C': f"={S['Bankinnskudd']}"})
ws['A15'] = 'Skriv de tre tallene for fri kontantstrøm inn i DCF-kalkulatoren på hverdagsverktoy.com/modellering/dcf/'

# Faste metadata, så filen blir lik hver gang skriptet kjøres
wb.properties.creator = 'hverdagsverktoy.com'
wb.properties.title = 'Treårsprognose, eksempel Medistim 2025'
wb.properties.created = wb.properties.modified = datetime(2026, 11, 14)
wb.active = 0
wb.calculation.fullCalcOnLoad = True       # Excel regner alt ved åpning
wb.save(UT)
print(f'Skrev {UT} ({UT.stat().st_size} byte)')
