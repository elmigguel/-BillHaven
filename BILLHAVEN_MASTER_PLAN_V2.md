# BillHaven Master Plan V2: From MVP to Market Leader
**Generated:** 2025-12-05
**Status:** Strategic Pivot - Awaiting Final Direction

## 1. Executive Summary: The Strategic Crossroads

BillHaven is at a critical juncture. The initial 'no-KYC' vision, while powerful, is legally untenable in the target EU market. This plan outlines a strategic pivot, transforming BillHaven into a **compliance-first, user-experience-obsessed platform.** We will shift our unique selling proposition from anonymity to **unparalleled trust, security, and functionality,** creating a durable, profitable, and investor-ready business. This document serves as the single source of truth for this new direction.

---

## 2. The New KYC Strategy: Gelaagde Verificatie

The "crypto users anonymous, fiat users KYC" model is not compliant. Instead, we adopt a tiered approach that balances user experience with legal obligations.

*   **Niveau 1: Gast Toegang (Geen Verificatie)**
    *   **Toegang:** Publieke bills bekijken, platform verkennen.
    *   **Restricties:** Geen transacties.

*   **Niveau 2: Crypto Gebruiker (Snelle Verificatie - 2 min)**
    *   **Vereiste:** Volledige geautomatiseerde KYC (ID + Selfie via Sumsub/Onfido).
    *   **Toegang:** Alle crypto-naar-crypto functies (escrow, swaps, staking) met transactielimieten (bv. €15k/jaar).

*   **Niveau 3: Fiat Gebruiker (Uitgebreide Verificatie)**
    *   **Vereiste:** Niveau 2 KYC + Bewijs van Adres.
    *   **Toegang:** Alle platformfuncties, inclusief iDEAL/creditcard, en hogere limieten.

---

## 3. De "Dikke Upgrade": Feature Expansie & Inkomsten

### 3.1. Ingebouwde Swap Functionaliteit
*   **Concept:** Een "Wisselen" tabblad voor directe crypto-naar-crypto swaps.
*   **Technologie:** Integratie van de **LI.FI API** om de beste wisselkoersen over 30+ exchanges te aggregeren.
*   **Monetisatie:** **0.15% - 0.25% platform fee** bovenop de wisselkoers.
*   **Inkomstenpotentieel:** €15k - €25k per maand bij €10M volume.

### 3.2. "BillHaven Earn": Staking & Farming
*   **BLC Staking:** Gebruikers staken de (toekomstige) BLC-token en ontvangen een deel (bv. 20%) van alle platformwinst. Dit creëert directe vraag en utility voor de token.
*   **Liquidity Farming:** Creëer een BLC/USDC pool op Uniswap. Gebruikers die liquiditeit verschaffen, kunnen hun LP-tokens op BillHaven staken voor extra hoge BLC-beloningen. Dit zorgt voor een diepe, stabiele markt voor de token.

### 3.3. Nieuwe Crypto-Koopmethoden
*   **"Bijvullen" Functie:** Een simpele "Koop Crypto" pagina waar gebruikers direct met iDEAL/creditcard crypto kunnen kopen voor zichzelf.
*   **Periodiek Kopen (DCA):** Een "set-and-forget" feature waarmee gebruikers automatisch wekelijks of maandelijks een vast bedrag aan crypto kopen. Een krachtige tool voor klantenbinding en voorspelbare inkomsten.

### 3.4. Affiliate & "Learn & Earn" Model 2.0
*   **Gelaagd Affiliate Systeem:** Standaard gebruikers krijgen 20% van de fees van hun referrals (1 jaar). "Ambassadeurs" met veel referrals krijgen 30% levenslang.
*   **Learn & Earn (B2B Inkomsten):** Werk samen met nieuwe cryptoprojecten. Zij betalen BillHaven om educatieve content en een quiz te plaatsen. Gebruikers die slagen, verdienen tokens van dat project. BillHaven verdient het verschil.

---

## 4. De Fee-Structuur: Slim & Aantrekkelijk

*   **Inclusieve Prijzen:** Verwerk de fee in de wisselkoers ("Voor €100 krijg je 0.025 ETH"). Toon een opsplitsing achter een info-icoon voor volledige transparantie. Dit voelt psychologisch beter.
*   **Eerste Transactie Korting:** Geef elke nieuwe, geverifieerde gebruiker **50% korting** op de platform-fee van hun eerste transactie (tot €1.000). Dit is een krachtige incentive om de KYC te voltooien.
*   **Houd BLC, Betaal Minder:** Een gelaagd kortingssysteem gebaseerd op de hoeveelheid BLC-tokens die een gebruiker in zijn wallet heeft. Dit stimuleert vraag en loyaliteit.

---

## 5. UI/UX: Van Goed naar Onvergetelijk

*   **Fundamenten:**
    *   **Contextuele Uitleg:** Overal microcopy die uitlegt *waarom* een actie (zoals KYC) nodig is.
    *   **Professionele Iconen:** Vervang alle emoji's door scherpe, officiële SVG-logo's.
    *   **Transparante Fees:** Een `FeeBreakdown` component bij elke transactie.
*   **Premium Gevoel:**
    *   **Subtiele Animaties:** Consistente, soepele animaties voor knoppen, modals en pagina-overgangen met Framer Motion.
    *   **Skeleton Loaders:** Vervang spinners door pulserende placeholders voor een snellere gevoelservaring.
    *   **Dashboard Makeover:** Visuele KPI's, grafieken en een activiteit-feed die inspireert.
*   **"Wow"-Factor:**
    *   **Light & Dark Mode:** Een absolute must-have voor een premium app.
    *   **Geanimeerde Marquee:** Een oneindig scrollende band met logo's op de homepage.
    *   **Elegante Notificaties:** Gebruik `sonner` voor alle pop-up berichten.

---

## 6. Smart Contract & Veiligheid: Prioriteit Nul

*   **Onmiddellijke Acties (Niet Onderhandelbaar):**
    1.  **Fix `emergencyWithdraw`:** Vervang de functie die diefstal door de admin mogelijk maakt door een veilige `rescueStuckFunds` variant.
    2.  **Fix Oracle Replay:** Voeg `chainId` toe aan alle oracle-handtekeningen.
    3.  **Implementeer Multi-Sig:** Alle admin-functies moeten via een Gnosis Safe (2-of-3 of 3-of-5) lopen.
    4.  **Implementeer Timelock:** Alle kritieke parameterwijzigingen (fees, pauzeren) moeten een vertraging van 24-48 uur hebben.
*   **Architectuur:** Het contract **moet** upgradeable worden gemaakt (UUPS proxy pattern) om toekomstige bugs te kunnen fixen zonder een volledige migratie.

---
## 7. Implementatie Roadmap (Voorlopig)

*   **Sprint 1 (2 Weken): Fundamenten leggen**
    *   **Week 1:** Veiligheid & Compliance. Implementeer alle P0/P1 smart contract fixes. Start integratie KYC-provider. Herschrijf alle publieke documentatie (README, etc.) met de nieuwe, compliance-first boodschap.
    *   **Week 2:** UI & Logica. Integreer de KYC-flow in de onboarding. Vervang alle emoji's door logo's.
*   **Sprint 2 (2 Weken): Kernfuncties Bouwen**
    *   Bouw de "Bijvullen" (koop crypto) functie.
    *   Integreer de LI.FI API voor de swap-functionaliteit.
*   **Sprint 3 (2 Weken): "Earn" & Retentie**
    *   Ontwikkel de smart contracts voor BLC staking.
    *   Bouw de front-end voor de "Periodiek Kopen" (DCA) feature.
*   **Verdere Sprints:** Implementeer de overige features en UI/UX polijstwerk.
