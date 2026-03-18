# Mobile Scroll/Navigation Issues Analysis - finanskalkulator.html

## Issues Found

### ISSUE 1: Multiple Sticky Headers Creating Offset Problems
**Severity: HIGH**

**Location:**
- Line 179: `header` - `position:sticky; top:0; z-index:200`
- Line 221: `.calc-nav` - `position:sticky; top:65px; z-index:100`

**Problem:**
The page has TWO stacked sticky elements:
1. The header at the top (65px on desktop, variable on mobile)
2. The calc-nav (tab bar) that sticks below the header

When `scrollIntoView()` is called, it doesn't account for these sticky headers. On mobile especially, the content gets hidden behind the sticky elements.

**How it manifests on mobile:**
- When switching tabs, the content scrolls into view but gets hidden behind the sticky header/nav
- When expanding cards, the same issue occurs
- On small screens, the header might take up 15-20% of viewport, causing significant content loss

**Suggested Fix:**
Use custom scroll offset calculations consistently. The code already has a fix in line 4487 and 5328, but it's not used everywhere. Example from line 4487:
```javascript
const headerH = document.querySelector('header').offsetHeight + 
                document.querySelector('.calc-nav').offsetHeight + 16;
const top = el.getBoundingClientRect().top + window.scrollY - headerH;
window.scrollTo({top, behavior:'smooth'});
```

This approach needs to be applied to ALL `scrollIntoView()` calls (see Issue #3).

---

### ISSUE 2: Inconsistent Scroll Handling Between switchCalc() and switchCalcMode()
**Severity: HIGH**

**Location:**
- Line 4474-4489: `switchCalc()` function
- Line 5287-5329: `switchCalcMode()` function

**Problem:**
- `switchCalc()` (line 4487) properly calculates offset for header + nav
- `switchCalcMode()` (line 5328) uses a simplified approach that only accounts for header, not the calc-nav

`switchCalcMode()` code at line 5328:
```javascript
const headerH = document.querySelector('header').offsetHeight;
const top = nav.getBoundingClientRect().top + window.scrollY - headerH;
```

This is missing the calc-nav height calculation!

**How it manifests on mobile:**
- When switching calculator modes (Basic → Finance → Scientific, or currency/unit/pension), the scroll position is wrong
- The nav scrolls into view but the active panel might still be hidden behind the nav

**Suggested Fix:**
Update line 5328 to match the pattern used in switchCalc():
```javascript
const nav = document.querySelector('.calc-nav');
const headerH = document.querySelector('header').offsetHeight + 
                (nav && nav.offsetHeight ? nav.offsetHeight + 8 : 0);
const top = nav.getBoundingClientRect().top + window.scrollY - headerH;
```

---

### ISSUE 3: scrollIntoView() Calls Missing Offset Calculations
**Severity: MEDIUM**

**Location:**
Lines with direct `scrollIntoView()` calls:
- Line 533: Help link → `c.scrollIntoView({behavior:'smooth',block:'center'})`
- Line 972: VAT adjustment help → `c.scrollIntoView({behavior:'smooth',block:'center'})`
- Line 3747: goToDeprCard() → `card.scrollIntoView({behavior:'smooth',block:'center'})`
- Line 4610, 4672, 4721, 4750, 4828, 4877, 4952, 5565: Result panels
- Various calculation results use `scrollIntoView({behavior:'smooth',block:'nearest'})`

**Problem:**
These calls don't account for the sticky header or calc-nav height. The `scrollIntoView()` method automatically scrolls content, but it doesn't know about fixed/sticky overlays.

**How it manifests on mobile:**
- Help text links scroll to correct elements but the content is hidden behind sticky header
- Result cards (salary, mortgage, NPV, VAT results) scroll into view but are obscured
- The card expand function (toggleCard) has a workaround (line 3758-3763) with manual scrollTo, but most scrollIntoView calls don't

**Suggested Fix:**
Create a helper function for all scrollIntoView scenarios:
```javascript
function scrollToElement(el, block = 'center') {
  if (!el) return;
  const headerH = document.querySelector('header')?.offsetHeight || 0;
  const nav = document.querySelector('.calc-nav');
  const navH = (nav && !nav.classList.contains('hidden')) ? nav.offsetHeight + 8 : 0;
  const totalOffset = headerH + navH;
  const top = el.getBoundingClientRect().top + window.scrollY - totalOffset - 12;
  window.scrollTo({top, behavior:'smooth'});
}
```

Replace all `scrollIntoView()` calls with this function.

---

### ISSUE 4: toggleCard() Has Partial Fix But Timing Issue
**Severity: MEDIUM**

**Location:**
Lines 3750-3765: `toggleCard()` function

**Code:**
```javascript
function toggleCard(card){
  const wasCollapsed = card.classList.contains('collapsed');
  card.classList.toggle('collapsed');
  if(wasCollapsed){
    setTimeout(()=>{
      const nav = document.querySelector('.calc-nav');
      const headerH = document.querySelector('header').offsetHeight + 
                      (nav && nav.offsetHeight ? nav.offsetHeight + 8 : 0);
      const top = card.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({top, behavior:'smooth'});
    }, 250);
  }
}
```

**Problem:**
- The 250ms delay tries to wait for expand animation, but this is fragile
- If the animation takes longer than 250ms on slow mobile devices, the scroll happens mid-animation
- The calculation subtracts 12px for padding, which is hardcoded and not adjustable
- On very narrow screens (< 375px), the header might not even fit properly

**How it manifests on mobile:**
- Expanding a card sometimes shows it partway behind the sticky header
- On slow devices, the scroll animation conflicts with the card expand animation
- Multiple rapid card toggles can cause unpredictable scrolling

**Suggested Fix:**
Listen for the animation to complete instead of using a fixed timeout:
```javascript
function toggleCard(card){
  const wasCollapsed = card.classList.contains('collapsed');
  card.classList.toggle('collapsed');
  if(wasCollapsed){
    // Wait for expand animation to complete
    card.addEventListener('transitionend', function scrollAfterExpand() {
      const headerH = document.querySelector('header').offsetHeight + 
                      (document.querySelector('.calc-nav')?.offsetHeight || 0) + 8;
      const top = card.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({top, behavior:'smooth'});
      card.removeEventListener('transitionend', scrollAfterExpand);
    }, {once: true});
  }
}
```

---

### ISSUE 5: Horizontal Overflow / Tab Navigation Not Responsive on Mobile
**Severity: LOW-MEDIUM**

**Location:**
Lines 221-224: `.calc-nav` CSS and line 222: `.calc-tab` styling

**CSS:**
```css
.calc-nav{display:flex;gap:4px;background:var(--surface);border:1.5px solid var(--border);border-radius:13px;padding:5px;margin-bottom:28px;flex-wrap:wrap;...}
.calc-tab{flex:1;min-width:120px;...white-space:nowrap;}
```

**Problem:**
- The tabs use `flex:1` with `min-width:120px`
- On mobile (e.g., 375px screen), with 6 tabs × 120px minimum = 720px minimum width needed
- `flex-wrap:wrap` will cause tabs to wrap, creating a 2-row nav bar
- On wrapped rows, the layout looks cramped and clicking tabs is awkward
- The `white-space:nowrap` prevents text wrapping in tab labels

**How it manifests on mobile:**
- On phones < 720px wide, tabs wrap to multiple rows
- The nav takes up more screen real estate than intended
- Scrolling to the nav area requires more thumb movement
- Touch targets become smaller when wrapped

**Suggested Fix:**
Add media query to make tabs scrollable on mobile:
```css
@media(max-width:600px){
  .calc-nav{
    flex-wrap:nowrap;
    overflow-x:auto;
    -webkit-overflow-scrolling:touch;
    scroll-behavior:smooth;
  }
  .calc-tab{
    flex:0 0 auto;
    min-width:80px;
    font-size:12px;
    padding:8px 12px;
  }
}
```

Alternatively, use a carousel/swiper for mobile tabs, but horizontal scroll is simpler.

---

### ISSUE 6: No Mobile Viewport Offset Awareness in switchCalc() Dashboard Mode
**Severity: LOW**

**Location:**
Line 4482-4483: Dashboard scroll behavior

**Code:**
```javascript
if(n==='dashboard'){
  setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),50);
}
```

**Problem:**
- When switching to dashboard, it scrolls to absolute top (0)
- But the page has a topbar (line 175) + header that should stay visible
- On mobile, user might want to see the dashboard content below these fixed elements

**How it manifests on mobile:**
- Clicking "Hjem" (Home/Dashboard) scrolls to the very top
- User sees the app branding bar, not the actual dashboard content
- Minor UX issue, but consistent with the offset problems

**Suggested Fix:**
Scroll to hero section instead of absolute top:
```javascript
if(n==='dashboard'){
  setTimeout(()=>{
    const hero = document.querySelector('.hero');
    if(hero) {
      const headerH = document.querySelector('header').offsetHeight;
      const top = hero.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({top, behavior:'smooth'});
    } else {
      window.scrollTo({top:0,behavior:'smooth'});
    }
  },50);
}
```

---

### ISSUE 7: No Media Query for Very Small Screens (< 375px)
**Severity: LOW**

**Location:**
Line 228: Only one media query exists
```css
@media(max-width:900px){.calc-grid{grid-template-columns:1fr;}}
@media(max-width:768px){#calc-basic{grid-template-columns:1fr!important;}}
```

**Problem:**
- Only 2 media queries for breakpoints
- No specific handling for phones < 375px (older iPhones, budget Android devices)
- Header might not fit text properly on these devices
- Container padding (28px on both sides = 56px total) leaves only 319px for content on a 375px screen

**How it manifests on mobile:**
- Text can become cramped on very small screens
- Some calculated panels might overflow horizontally
- Tab labels could be truncated

**Suggested Fix:**
Add media query for small phones:
```css
@media(max-width:375px){
  .container{padding:0 16px;}
  .calc-tab{font-size:11px;padding:8px 10px;min-width:70px;}
  .hero h1{font-size:clamp(24px,5vw,36px);}
  .hdr{gap:8px;}
  .region-cur{font-size:12px;padding:6px 10px;}
}
```

---

### ISSUE 8: Overlay Fixed Positioning Might Interfere
**Severity: LOW**

**Location:**
Lines 317, 334: Privacy and contact overlays
```css
.priv-overlay{position:fixed;inset:0;z-index:9999;background:#fff;overflow-y:auto;...}
.contact-overlay{position:fixed;inset:0;z-index:9999;background:#fff;overflow-y:auto;...}
```

**Problem:**
- These use `position:fixed;inset:0` which takes full viewport
- When open, they disable body scroll (line 4405-4406: `document.body.style.overflow='hidden'`)
- On some mobile browsers, this can cause layout shift or scroll position jump when closed
- The overlays have `overflow-y:auto` which is correct, but on iOS Safari, this needs `-webkit-overflow-scrolling`

**How it manifests on mobile:**
- Opening privacy/contact overlay causes a small scroll/layout jump
- Closing overlay might not restore scroll position perfectly
- On iOS, scrolling inside overlay feels less smooth

**Suggested Fix:**
Add smooth scrolling to overlays and implement scroll restoration:
```css
.priv-overlay, .contact-overlay {
  -webkit-overflow-scrolling: touch;
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #fff;
  overflow-y: auto;
  overflow-x: hidden;
}
```

And preserve scroll position:
```javascript
let lastScrollY = 0;
function openPrivacy() {
  lastScrollY = window.scrollY;
  updatePrivacyUI();
  document.getElementById('priv-overlay').classList.add('open');
  document.body.style.overflow='hidden';
}
function closePrivacy() {
  document.getElementById('priv-overlay').classList.remove('open');
  document.body.style.overflow='';
  window.scrollTo(0, lastScrollY);
}
```

---

## Summary Table

| Issue | Severity | Type | Affects | Fix Complexity |
|-------|----------|------|---------|-----------------|
| Multiple sticky headers | HIGH | Scroll math | All tab switches, card expands | Medium |
| Inconsistent switchCalcMode | HIGH | Scroll math | Calculator mode switches | Low |
| scrollIntoView calls | MEDIUM | Scroll offset | Help links, results | Medium |
| toggleCard timing | MEDIUM | Animation sync | Card expand/collapse | Medium |
| Horizontal nav overflow | LOW-MED | Layout | Small screens | Low |
| Dashboard scroll to top | LOW | UX | Home button | Low |
| Small screen media queries | LOW | Responsive | Phones < 375px | Low |
| Overlay scroll issues | LOW | Polish | Privacy/contact overlays | Low |

---

## Recommended Implementation Priority

1. **First:** Issue #1 - Apply consistent sticky header offset calculations everywhere
2. **Second:** Issue #2 - Fix switchCalcMode scroll calculation  
3. **Third:** Issue #3 - Create and use scroll helper function for all scrollIntoView calls
4. **Fourth:** Issue #4 - Improve toggleCard animation timing
5. **Then:** Issues #5-8 - Polish and minor improvements

---
