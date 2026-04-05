import { useState, useMemo, useRef } from "react";

const S = [
  // ── PRE-MARKET 07:00–09:00 ──
  ["Overnight Inventory Imbalance","pre","07–09","5/5","60–65%","1.5:1","High","◈","↕","Overnight net long/short corrects at cash open. Net long overnight → early sell. Net short → early buy.","ON range vs prior VA, Globex volume profile, cumulative delta","ON VPOC, PDH/PDL, ON high/low"],
  ["Gap Assessment & Bias","pre","07–09","4/5","55–60%","1.5:1","Med+","◈","↕","Classify gap: into value (accept) vs away from value (reject/fill). Sets pre-open directional bias.","Gap size vs ATR, gap vs prior VA, pre-mkt vol","Prior close, VAH/VAL, weekly VPOC"],
  ["Globex Range Breakout","pre","07–09","3/5","55–60%","2:1","Med","○","↕","Narrow overnight range breaks at cash open. Breakout direction defines morning trend.","ON range width, cash open break, volume surge","ON range, gap direction, inventory"],
  ["Pre-Market Level Map","pre","07–09","5/5","—","—","—","◈","↕","Not a trade — preparation. Map PDH/PDL, ON H/L, VA edges, VPOC, weekly levels, Fib, round numbers before open.","All key levels plotted on chart","Multi-timeframe confluence zones"],
  ["Overnight VPOC as Magnet","pre","07–09","4/5","60–65%","1:1","High","◈","↕","If price opens away from overnight VPOC, expect a drift back to it in the first 30 min.","Distance from ON VPOC, volume profile shape","ON VPOC, VWAP, prior close"],

  // ── EU CASH OPEN 09:00–09:15 ──
  ["Opening Drive (OD)","open","09–09:15","2/5","65–70%","2:1+","High","◈","↕","Strong first 5–10 min move, no pullback, conviction vol. Signals trend day.","1st bar > 1.5× avg, vol > 2×, no reversal wick","ON inventory, gap, sector flow"],
  ["Opening Range Breakout (ORB)","open","09–09:15","3/5","55–60%","2:1","Med+","◈","↕","5–15 min range forms, breaks with volume. Breakout sets next 1–2 hr direction.","OR width vs avg, vol contraction→expansion","VWAP slope, ON H/L, prior close"],
  ["Opening Range Trap (OR Trap)","open","09–09:15","3/5","60–65%","2.5:1","High","◈","↕","False break of OR, traps breakout traders, reverses through opposite side. Stop-hunt / Wyckoff spring-UT.","False poke 1–3 ticks, reversal in 1–3 bars","Key level at OR edge, delta div"],
  ["Gap & Go","open","09–09:15","1/5","60–65%","2:1+","Med+","◈","↕","Gap continues without fill. First pullback to VWAP/EMA is entry. Strong catalyst required.","Gap > 0.3%, no fill attempt, PB to VWAP holds","Sector confirm, ON trend, VWAP"],
  ["Gap Fill / Gap Fade","open","09–09:15","2/5","55–60%","1.5:1","Med","◈","↕","Gap shows early rejection → fills back to prior close. Common when gap is into value or counter-trend.","Weak 1st bar, no vol follow-through","Prior VPOC, VWAP reject, delta div"],
  ["Open Auction Reversal","open","09–09:15","2/5","55–60%","2:1","Med","○","↕","First 1–3 min spike one way (stop hunt), immediate sharp reversal. No range formation — pure fake + reverse.","Sharp 1–3 min move > 0.5× ATR, immediate reversal","PDH/PDL at open, footprint div"],
  ["Wyckoff Spring at Open","open","09–09:15","1/5","65–70%","3:1","High✓","◈","↑","Dip below key support at open, no follow-through selling, sharp reclaim. Final shakeout.","Break below by 2–5 ticks, absorption, quick reclaim","Accumulation structure, delta shift, HTF demand"],
  ["Wyckoff Upthrust at Open","open","09–09:15","1/5","65–70%","3:1","High✓","◈","↓","Spike above resistance at open, no follow-through buying, reverses below. Trap of breakout longs.","Break above by 2–5 ticks, rejection, sell delta","Distribution structure, delta shift, HTF supply"],
  ["Overnight Level Reclaim","open","09–09:30","2/5","60–65%","2:1","Med+","◈","↕","Key ON level lost overnight gets reclaimed at cash open. Cash disagrees with overnight move.","Level reclaim with vol, holds after","ON H/L, Globex VPOC, prior day levels"],
  ["Open Near PDH/PDL","open","09–09:15","2/5","55–60%","2:1","Med+","◈","↕","When cash opens within 0.1% of PDH or PDL, expect a decisive reaction (break or reject) within 10 min.","Open price vs PDH/PDL proximity","PDH/PDL, ON direction, gap context"],

  // ── POST-OPEN / INITIAL BALANCE 09:15–10:00 ──
  ["Initial Balance Breakout (IB Break)","post","09:15–10","3/5","55–60%","2:1","Med+","◈","↕","Break of first 30/60 min range. Narrow IB = higher prob. of extension. Direction often sets the session.","IB width vs avg, vol on break, delta confirm","VWAP slope, ON bias, 80% rule"],
  ["Initial Balance Failure (IB Fade)","post","09:15–10","2/5","55–60%","2:1","Med","○","↕","IB breaks but fails. Trapped directional traders fuel reversal. Signals balanced/rotation day.","Break holds < 15 min, low vol on break, delta div","Wide IB, key level just beyond, poor excess"],
  ["First Pullback After OD","post","09:15–10","2/5","65–70%","2:1+","High","◈","↕","After strong opening drive, first pullback to VWAP/EMA/bar low. Shallow, orderly, declining volume.","PB < 50% of initial move, vol dries up","VWAP hold, 9/21 EMA, Fib 38–50%"],
  ["Open-Test-Drive (OTD)","post","09:15–10","2/5","60–65%","2:1","Med+","◈","↕","Open → brief test one direction → reverses and drives opposite. Test sets session extreme, drive sets trend.","Test lasts 5–15 min, < 30% of expected range","ON bias, prior close, VWAP cross"],
  ["Failed Auction","post","09:15–10","2/5","60–65%","2:1","Med+","○","↕","Auction to one side finds no responsive participants. Lack of interest → reversal to find other side's liquidity.","Single prints at extreme, quick reversal 2–3 attempts","Poor high/low, delta div, VPOC migrating"],
  ["Single Print Fill","post","09:15–10","3/5","70–75%","1.5:1","High","◈","↕","Single prints (traded at only one TPO) are magnets. Price returns to fill them. High WR but moderate RR.","Single prints on TPO, price approaching","Poor structure, LVN at singles, mean reversion"],
  ["Excess High/Low Reversal","post","09:15–10","1/5","60–65%","2:1","Med+","○","↕","Long tail/wick + climactic volume at extreme = aggressive responsive defense. Strong rejection and reversal.","Tail > 50% of bar, vol climax, delta shift","Prior swing, PDH/PDL, weekly level, Fib ext"],
  ["Double Top/Bottom at IB Edge","post","09:15–10","2/5","55–60%","2:1","Med","○","↕","Two tests of IB extreme both fail. Second test on lower volume. Second failure = entry.","2 tests in 30 min, 2nd on lower vol, no new extreme","RSI div, delta div, key level alignment"],

  // ── MID-MORNING 10:00–11:30 ──
  ["Trend Continuation Pullback","mid","10–11:30","4/5","60–65%","2:1","High","◈","↕","Bread-and-butter. After IB direction set, PB to EMA/VWAP/prior swing. Most common daily setup.","PB 38–62% of prior leg, declining vol, key MA hold","VWAP slope, 9/21 EMA, Fib, delta"],
  ["VWAP Mean Reversion","mid","10–11:30","5/5","55–60%","1.5:1","Med+","◈","↕","Price extends > 1.5 SD from VWAP, reverts back. Works best on rotational/balanced days.","Price > 1.5 SD, reversal candle, declining momentum","VWAP bands, BB extreme, RSI, delta div"],
  ["Breakout-Pullback-Continuation","mid","10–11:30","3/5","60–65%","2:1","High","◈","↕","Break key level → pull back to retest (old R = new S) → continue. The retest is the entry.","Clean break with vol, PB on declining vol, level holds","Role reversal, VWAP, delta on retest, Fib"],
  ["Failed Breakout Reversal","mid","10–11:30","2/5","55–60%","2.5:1","Med","○","↕","Key level breaks but fails to hold → reversal. Trapped traders' stops fuel the move.","Break + failure in 3–5 bars, higher vol on reversal","HTF trend, momentum div, Wyckoff UT/spring"],
  ["Balance Area Breakout","mid","10–11:30","2/5","55–60%","2:1+","Med","○","↕","30–60+ min balance (HVN) on vol profile breaks with volume. New value area migration begins.","HVN visible, breakout with 1.5× vol, delta confirm","Vol profile, TPO, VWAP slope shift"],
  ["Wyckoff Re-accumulation","mid","10–11:30","1/5","60–65%","2.5:1","Med+","○","↑","After upward move, consolidation with Wyckoff characteristics. Spring/LPS → continuation higher.","Support holds, vol declines, spring low vol, SOS breaks","Wyckoff phases, delta, HTF demand, VWAP floor"],
  ["Wyckoff Re-distribution","mid","10–11:30","1/5","60–65%","2.5:1","Med+","○","↓","After downward move, consolidation with distribution features. Upthrust/LPSY → continuation lower.","Resistance holds, vol declines, UT low vol, SOW breaks","Wyckoff phases, delta, HTF supply, VWAP ceiling"],
  ["Trend Day One-Time Framing","mid","10–11:30","1/5","70–75%","3:1+","High✓","★","↕","Each 30-min bar makes higher low (up) or lower high (down). Every pullback is an add. Rare, powerful.","3+ OTF bars, VWAP trending, IB broken, VPOC migrating","IB break, VWAP, P/b profile, cum delta trend"],
  ["Poor High/Low Repair","mid","10–11:30","2/5","60–65%","1.5:1","Med+","◈","↕","Flat top/bottom on profile (poor high/low from IB) attracts price back to create proper excess.","Poor H/L on TPO, price moved away, vol supports repair","Profile structure, unfinished auction, VPOC"],
  ["Value Area Migration Trade","mid","10–11:30","2/5","55–60%","2:1","Med","○","↕","Developing VA shifting vs prior day VA. Buy PBs to developing VAL (migrating up), sell rallies to VAH (down).","Dev VA above/below prior VA, VPOC migrating","Dev VPOC, VWAP slope, prior VA edges"],
  ["3-Bar Pullback","mid","10–11:30","3/5","55–60%","2:1","Med+","◈","↕","Exactly 3 counter-trend bars on declining vol then continuation. Clean, quick pullback pattern.","3 small bars against trend, vol drops each bar","Trend direction, EMA, VWAP, Fib 38%"],
  ["EMA Fan Confluence","mid","10–11:30","2/5","60–65%","2:1","Med+","◈","↕","9, 21, and 50 EMA converge then fan out in trend direction. Entry at the convergence point.","EMAs converging, price at convergence, fan begins","EMA stack, VWAP, vol pickup at fan"],

  // ── EU LUNCH / QUIET 11:30–13:30 ──
  ["Range Compression Squeeze","lunch","11:30–13:30","3/5","55–60%","2:1","Med","◈","↕","Lunch volatility compresses. BB narrow, ATR drops. Stores energy for pre-US/US expansion. Trade the break.","Range < 30% morning, BB width at low, vol at low","BB squeeze, ATR, vol dry-up, inside bars"],
  ["Quiet Period Fade","lunch","11:30–13:30","3/5","60–65%","1.5:1","Med+","◈","↕","Low-vol lunch → any move to range extremes tends to fade. Fade extremes back to VWAP/center.","At morning range extreme, low vol, no catalyst","Morning range, VWAP center, time-of-day stats"],
  ["VWAP Magnet (Lunch)","lunch","11:30–13:30","5/5","60–65%","1:1","High","◈","↕","Price gravitates to VWAP during quiet periods. If away from VWAP during lunch, expect drift back.","Price > 0.5 SD from VWAP, VWAP flat, slow grind","VWAP SD bands, mean reversion, low vol"],
  ["Lunch Range Breakout","lunch","11:30–13:30","0–1/5","50–55%","2.5:1+","Low","★","↕","Rare but powerful: lunch range breaks on news/US pre-mkt move. Most traders sidelined = thin liquidity.","Break on vol > 2× lunch avg, US futs moving, news","US futs correlation, news catalyst, morning trend"],
  ["Absorption at Extremes","lunch","11:30–13:30","2/5","60–65%","1.5:1","Med+","○","↕","Large passive orders absorb at morning range edges during lunch. Visible on footprint. Multiple failed tests.","3+ tests of level, large resting orders, no break","Key level defense, footprint, multiple tests"],
  ["Flag / Pennant (Lunch)","lunch","11:30–13:30","2/5","55–60%","2:1","Med","○","↕","Morning trend move → lunch flag/pennant (declining vol, narrowing range). Break in trend direction.","Clear pole + pattern, declining vol, narrowing width","Morning trend, vol decline, VWAP as pattern S/R"],
  ["Developing VPOC Stall","lunch","11:30–13:30","3/5","55–60%","1:1","Med","◈","↕","Developing VPOC stops migrating during lunch. Price consolidates at VPOC. Useful for bias: VPOC at highs = bullish day.","VPOC location vs range, stalled migration","VPOC position, day type assessment, VA shape"],

  // ── PRE-US SESSION 13:30–15:30 ──
  ["Pre-US Positioning Move","preus","13:30–15:30","3/5","55–60%","1.5:1","Med+","◈","↕","Institutional flow increases toward US open. Directional move aligns with US futs pre-market direction.","Vol increase vs lunch 1.5×, directional move, US futs align","US futs, DAX-ES corr, sector flow, pre-mkt data"],
  ["US Economic Data Spike","preus","13:30–15:30","2/5","50–55%","2:1+","Med","○","↕","CPI/NFP/PPI/FOMC at 14:30/15:00 CET → volatility spike. Wait 2–5 min, trade the follow-through or fade.","Scheduled release, wait 2–5 min, enter on first clean setup","Data vs expectations, US futs, bond reaction"],
  ["Range Extension Attempt","preus","13:30–15:30","3/5","55–60%","2:1","Med","○","↕","Post-lunch, market tries to extend morning range. First test of expansion since morning. Break lunch range in AM trend dir.","Break of lunch range, vol up, AM trend aligns","Morning trend, US futs, lunch range, vol confirm"],
  ["Divergence Reversal","preus","13:30–15:30","1/5","55–60%","2:1","Med","○","↕","New session high/low with RSI / cum delta divergence. Signals weakening trend at extended level.","New extreme + RSI div + delta div + declining vol","RSI, delta div, key level, Fib ext, vol thin zone"],
  ["News Spike Fade","preus","13:30–15:30","1/5","50–55%","2:1+","Med","○","↕","Unexpected news → spike overshoots → fades. Wait for stall at key level, reversal candle.","Sharp spike > 0.5% in 1–2 min, into key level, vol climax","Key level at spike, vol climax, prior balance"],
  ["EU/US Correlation Catch-Up","preus","13:30–15:30","2/5","55–60%","1.5:1","Med","◈","↕","US pre-mkt moves >0.3% while EU is flat → EU catches up. Trade the lagging EU instrument.","US futs moving, EU flat, historical corr > 0.7","US futs, corr coefficient, no EU counter-catalyst"],
  ["London Fix Flow (SI/Metals)","preus","15:00–15:30","5/5","50–55%","1.5:1","Med","○","↕","Institutional flow around London fix creates predictable pressure 30–60 min before fix. Affects SI, gold-correlated.","Time approaching fix, directional flow in metals","Fix timing, institutional flow, metal correlation"],
  ["Pre-US Flag Breakout","preus","14:00–15:30","2/5","55–60%","2:1","Med","○","↕","Bull/bear flag forms during 13:30–14:30 consolidation, breaks in trend direction as US activity increases.","Flag pattern, declining vol in flag, break with vol","Morning trend, US futs, vol on break"],
  ["Afternoon Trend Resumption","preus","14:00–15:30","2/5","60–65%","2:1","Med+","◈","↕","Morning trend resumes after lunch pause. Key signal: price holds above/below VWAP throughout lunch.","VWAP held during lunch, vol returning, delta resuming","VWAP slope, morning trend, developing VA"],

  // ── US CASH OPEN 15:30–16:30 ──
  ["US Open Drive","us","15:30–16:30","2/5","60–65%","2:1+","Med+","◈","↕","Strong US cash open move. Extends EU trend or reverses it. First 10–15 min set direction.","Strong 1st 5-min bar, vol > 2× pre-mkt, delta confirms","US futs IB break, DAX-ES corr, sector flow"],
  ["US Open Reversal","us","15:30–16:30","2/5","55–60%","2.5:1","Med","○","↕","US open reverses extended EU session. Fresh US liquidity fades the EU trend. Traps late EU followers.","EU extended > 1× ADR, US shows counter-flow, delta shifts","Extended EU, reversal at key level, trapped EU traders"],
  ["US ORB on EU Instruments","us","15:30–16:30","3/5","55–60%","2:1","Med+","◈","↕","Apply ORB concept to EU instruments using US open as trigger. First 5–15 min range after 15:30 CET.","Range first 5–15 min post-US open, break with vol","ES/NQ direction, US vol, EU key level, VWAP"],
  ["Second Leg / Measured Move","us","15:30–16:30","2/5","60–65%","2:1","Med+","○","↕","AM = first leg, lunch = consolidation, US open triggers second leg. Second leg = first leg measured.","1st leg defined, lunch consolidation, US breaks pattern","Measured move, flag break, US confirm, AM trend"],
  ["US Gap on EU Sympathy","us","15:30–16:30","1/5","55–60%","1.5:1","Med","○","↕","US cash gaps vs prior US close → EU instruments move in sympathy. Trade the EU catch-up or EU reversal.","US gap > 0.3%, EU moves in sympathy","US gap stats, EU-US corr, EU key level"],
  ["MOC / Close Flow","us","16:30–17:30","5/5","50–55%","1:1","Med","○","↕","Last 30–60 min of EU cash: MOC orders + portfolio rebalancing. Trend days close at extreme, range days at center.","Vol increasing final 30 min, direction vs session type","Session type, MOC indicators, vol pattern"],

  // ── ALL-DAY / ANY TIME ──
  ["VWAP Bounce","any","Any","5/5","60–65%","1.5:1","High","◈","L above/S below","PB to VWAP → bounce in trend direction. Most reliable intraday dynamic S/R.","VWAP approach, slope confirms, vol declines on PB","Trend, VWAP slope, EMA, prior swing at VWAP"],
  ["VWAP Rejection / Cross Fail","any","Any","5/5","55–60%","2:1","Med+","◈","↕","Rally/sell into VWAP from losing side gets rejected. Prevailing side still in control.","Strong rejection candle, vol spike, VWAP holds","Trend, multiple VWAP tests, delta rejection"],
  ["PDH / PDL Test","any","Any","5/5","55–60%","2:1","Med+","◈","↕","PDH/PDL tested almost daily. First test = higher rejection prob. Fade if holds, join if breaks with conviction.","Approaching PDH/PDL, 1st test, candle pattern","VA edges, Fib, round numbers, ON H/L, VWAP"],
  ["VPOC Magnet","any","Any","5/5","65–70%","1.5:1","High","◈","↕","VPOC acts as magnet. Price away from VPOC drifts back. High WR, moderate RR.","Price > 0.5× ATR from VPOC, non-trend day, vol declining","Prior/dev VPOC, VWAP, mean reversion stats"],
  ["VAH / VAL Fade","any","Any","5/5","55–60%","1.5:1","Med+","◈","↕","Price tests VA edges. 80% rule context: open inside VA, fade VA edge back to VPOC.","At VAH/VAL, opened inside VA, rejection candle","80% rule, PDH/PDL, VWAP, responsive activity"],
  ["80% Rule Trade","any","Any","3/5","65–70%","1.5:1","High","◈","↕","Open inside prior VA → reaches one edge → 80% prob of traveling to opposite edge. Statistical edge from auction theory.","Open in VA, reaches VA edge, edge holds, no trend signals","VA edges, VPOC intermediate target, balanced profile"],
  ["Key Level Confluence (3+)","any","Any","1/5","65–70%","3:1","High","★","↕","3+ independent levels converge at same price → super-level. Reactions more reliable and powerful. Best trades.","3+ levels within 2–3 ticks, reversal candle, vol/delta confirm","PDH/PDL, VAH/VAL, VPOC, Fib, round #, weekly/monthly"],
  ["Engulfing at Key Level","any","Any","3/5","55–60%","2:1","Med+","◈","↕","Bullish/bearish engulfing at key level. Shift in control + key level = high prob entry.","Full body engulf, at key level, vol > prior bar, delta shift","Key level, vol surge, delta, time of day"],
  ["Pin Bar / Hammer at Key Level","any","Any","3/5","55–60%","2:1","Med","◈","↕","Pin bar (wick > 2× body) at key level shows rejection. Wick = tested and defended.","Wick > 2× body, at key level, vol spike on wick","Key level, vol, delta rejection, HTF S/R"],
  ["Inside Bar Breakout at Level","any","Any","2/5","55–60%","2:1","Med","○","↕","Inside bar at key level = compression. Break in direction supported by key level. Tight stop.","IB < 50% prior bar, at key level, break with vol","Key level, compression, vol, trend direction"],
  ["Measured Move / AB=CD","any","Any","2/5","55–60%","2:1","Med","○","↕","Equal legs: AB move → BC pullback → CD = AB. Project for targets and reversal zones.","Clear AB leg, BC 38–62%, reversal candle at projected D","Fib projections, key level at target, vol at D"],
  ["Three Drives Pattern","any","Any","1/5","55–60%","2.5:1","Med","○","↕","Three pushes one direction, each declining momentum. Third = exhaustion. Reversal after 3rd.","3 drives, declining momentum each, Fib ext alignment","Fib extensions, momentum div, vol decline, key level"],
  ["Head & Shoulders (Intraday)","any","Any","1/5","55–60%","2:1","Med","○","↕","Classic H&S on 5/15-min. Left shoulder → head → right shoulder. Neckline break = entry. Measured move target.","3 swings, declining vol L→R, neckline break with vol","Vol decline, neckline at key level, momentum div"],
  ["Trend Reversal: Climax + Channel Break","any","Any","1/5","55–60%","3:1","Med","★","↕","Extended trend → climactic bar at extreme → channel trendline break. Meaningful reversal, not just PB.","4+ swings in channel, climax bar widest/highest vol, channel break","Channel, climax, key level, mom div, vol climax"],
  ["Double Distribution Day","any","Full","1/5","65–70%","3:1+","High✓","★","↕","Two balance areas connected by single-print bridge. Strongest trend day type. Profile shows clear P or b shape.","1st balance, migration (singles), 2nd balance, VPOC migrates","IB break, single prints, VPOC migration, OTF"],
  ["P-Profile Day (Trend Up)","any","Full","1/5","60–65%","2:1","Med+","○","↑","Profile = P. Thin tail at bottom, wide value at top. Buying throughout. Value at highs.","Early low on vol, steady buying, VA in upper 40%","VWAP rising, OTF up, VA migrating higher"],
  ["b-Profile Day (Trend Down)","any","Full","1/5","60–65%","2:1","Med+","○","↓","Profile = b. Thin tail at top, wide value at bottom. Selling throughout. Value at lows.","Early high on vol, steady selling, VA in lower 40%","VWAP falling, OTF down, VA migrating lower"],
  ["Neutral Day Fade","any","Full","2/5","60–65%","1.5:1","Med+","◈","↕","Range limited, rotates around VWAP/VPOC. No trend. Fade extremes to center. Narrow IB, balanced profile.","IB < 50% avg, VWAP flat, D-shape profile, low vol","Narrow IB, flat VWAP, balanced, prior trend day"],
  ["Wyckoff Accumulation (Intraday)","any","30–90 min","1/5","60–65%","3:1","Med+","★","↑","Full Wyckoff accum: PS→SC→AR→ST→Spring→Test→SOS→LPS→Breakout. Spring or LPS = entry.","Downtrend into range, Wyckoff phases, vol pattern, spring low vol","Wyckoff, delta at phases, HTF demand, key levels"],
  ["Wyckoff Distribution (Intraday)","any","30–90 min","1/5","60–65%","3:1","Med+","★","↓","Full Wyckoff distrib: PSY→BC→AR→ST→UT/UTAD→SOW→LPSY→Breakdown. Upthrust or LPSY = entry.","Uptrend into range, Wyckoff phases, vol pattern, UT low vol","Wyckoff, delta at phases, HTF supply, key levels"],
  ["SOS Breakout","any","Any","1/5","60–65%","2:1","Med+","○","↑","After accumulation, first strong rally breaking above range with wide spread + high vol. Confirms accum complete.","Wide spread bar, high vol, breaks above range, follow-through","Wyckoff accum, vol surge, delta shift, VWAP break"],
  ["SOW Breakdown","any","Any","1/5","60–65%","2:1","Med+","○","↓","After distribution, first strong decline breaking below range. Confirms distrib complete.","Wide spread bar, high vol, breaks below range","Wyckoff distrib, vol surge, delta shift, VWAP break"],
  ["Fibonacci Cluster Reversal","any","Any","2/5","55–60%","2:1","Med","○","↕","Multiple Fib levels from different swings cluster at same price → strong S/R zone.","2+ Fibs converge, reversal candle at cluster, vol confirms","Multiple Fib levels, key level, mom div"],
  ["Round Number / Psych Level","any","Any","5/5","50–55%","1.5:1","Med","◈","↕","Round numbers (DAX 100s, ES 25s/50s, NQ 50s/100s) as psychological S/R. First test strongest.","Approaching round #, first test, reversal signal","Other key levels at round #, options, institutional"],
  ["Opening Price Retest","any","Within 2h","5/5","55–60%","1.5:1","Med+","◈","↕","Cash open price = key reference. Price retests it after initial move. Reaction (hold/break) gives direction.","Return to open price, vol/delta at test","VWAP near open, prior close, ON VPOC"],
  ["Spike and Ledge","any","Any","1/5","60–65%","2:1","Med+","○","↕","Sharp spike to new level → tight consolidation (ledge) = acceptance. Ledge break in spike direction continues.","Spike + 3–5 tight bars, ledge holds > 50%, break with vol","Spike momentum, acceptance, trend direction"],
  ["Midpoint Magnet (50% Rule)","any","Any","5/5","60–65%","1:1","High","◈","↕","50% of any significant range (prior day, IB, ON) acts as magnet. Expect trade-through or reaction.","Midpoint of range, price approaching, vol at midpoint","50% prior day, 50% IB, 50% ON, VWAP proximity"],
  ["Island Reversal","any","Any","Rare","65–70%","3:1+","High✓","★","↕","Gap up → brief trade → gap down. Isolated price 'island'. Trapped traders with no nearby levels to defend.","Two gaps (up then down), brief island, vol on reversal gap","Two gaps, vol, trapped traders, key reversal level"],
  ["Short Squeeze","any","Any","Rare","60–65%","3:1+","Med✓","★","↑","Heavy shorts forced to cover → accelerating rally. Feedback loop. Visible as accelerating price + surging buy delta.","Extended downtrend, heavy short interest, accelerating rally","Short positioning, catalyst, vol surge, delta accel"],
  ["Liquidation Break Fade","any","Any","Rare","55–60%","3:1+","Med","★","↑","Forced selling (margin calls, stop cascade) overshoots fair value. V-bottom opportunity. Wait for vol climax + reversal.","Sharp decline > 2% in < 30 min, vol climax 3×+, delta shift","Vol climax, delta shift, key level overshoot, HTF support"],
  ["DAX-ES Divergence Trade","any","Any","2/5","55–60%","1.5:1","Med","○","↕","When DAX and ES diverge intraday (>0.3%), expect convergence. Lagger catches up or leader reverses.","Divergence > 0.3%, historical corr strong, no specific catalyst","Historical correlation, beta, sector flow, no specific news"],
  ["Ascending/Descending Triangle","any","30–60 min","1/5","55–60%","2:1","Med","○","↕","Flat top/bottom + rising/falling trendline. Compression against level. Break of flat edge with vol.","Flat edge + diagonal, vol declining, break with vol","Key level at flat edge, vol, trend direction"],
  ["Wedge Reversal","any","Any","1/5","55–60%","2.5:1","Med","○","↕","Rising wedge (bearish) or falling wedge (bullish). Converging trendlines with declining vol. Break against wedge direction.","Converging trendlines, declining vol, break against wedge","Momentum div, vol decline, key level at apex"],
  ["Cup and Handle (Intraday)","any","1–2 hours","1/5","55–60%","2:1","Med","○","↑","Rounded bottom (cup) + small pullback (handle). Break above handle with vol = continuation entry.","Rounded cup, handle PB < 50% of cup, break with vol","Vol pattern, trend direction, VWAP, key level at rim"],
  ["VWAP Cross and Hold","any","Any","3/5","55–60%","2:1","Med+","◈","↕","Price crosses VWAP with conviction and holds on retest. Signals shift in intraday control. Retest = entry.","Cross with strong bar + vol, retest holds, no recross","VWAP, vol on cross, delta shift, prior rejections"],
  ["Stacked Imbalances on Footprint","any","Any","3/5","60–65%","2:1","Med+","◈","↕","3+ consecutive imbalance bars on footprint chart stacked in one direction = institutional conviction.","3+ stacked imbalances, direction clear, vol confirms","Footprint, delta, institutional flow, key level"],
  ["Volume Shelf Bounce","any","Any","2/5","60–65%","2:1","Med+","○","↕","HVN (high volume node) on profile acts as support/resistance. Price bounces off the shelf of volume.","HVN clearly visible, price approaches, reversal signal","Vol profile, HVN, VWAP, prior swing at shelf"],
  ["Low Volume Node Acceleration","any","Any","3/5","55–60%","2:1","Med","◈","↕","LVN (low volume node) = price moves quickly through. When price enters an LVN, expect acceleration to the next HVN.","LVN on profile, price entering, expect fast traverse","Vol profile, LVN→HVN target, VWAP, trend direction"],
];

const COLS = ["Setup Name","Time","Window","Freq","WR","R:R","Prob","Type","Bias","Description","Parameters & Conditions","Confluences"];

const TIME_META = {
  "pre":  { label: "Pre-Market", color: "#7C4DFF", bg: "#7C4DFF18" },
  "open": { label: "EU Open", color: "#FF6D00", bg: "#FF6D0018" },
  "post": { label: "Post-Open/IB", color: "#00C853", bg: "#00C85318" },
  "mid":  { label: "Mid-Morning", color: "#00B0FF", bg: "#00B0FF18" },
  "lunch":{ label: "Lunch/Quiet", color: "#78909C", bg: "#78909C18" },
  "preus":{ label: "Pre-US", color: "#E91E63", bg: "#E91E6318" },
  "us":   { label: "US Open", color: "#FF3D00", bg: "#FF3D0018" },
  "any":  { label: "All-Day", color: "#AA00FF", bg: "#AA00FF18" },
};

const TYPE_ICONS = {
  "◈": { label: "Base Hit", color: "#00E676" },
  "○": { label: "Standard", color: "#448AFF" },
  "★": { label: "High Value / Rare", color: "#FFD740" },
};

export default function PlaybookTable() {
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const tableRef = useRef(null);

  const data = useMemo(() => {
    let rows = S.map((r, i) => ({ id: i, d: r }));
    if (timeFilter !== "all") rows = rows.filter(r => r.d[1] === timeFilter);
    if (typeFilter !== "all") rows = rows.filter(r => r.d[7] === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.d.some(cell => cell.toLowerCase().includes(q)));
    }
    if (sortCol !== null) {
      rows.sort((a, b) => {
        const av = a.d[sortCol], bv = b.d[sortCol];
        return av.localeCompare(bv) * sortDir;
      });
    }
    return rows;
  }, [search, timeFilter, typeFilter, sortCol, sortDir]);

  const handleSort = (ci) => {
    if (sortCol === ci) setSortDir(d => d * -1);
    else { setSortCol(ci); setSortDir(1); }
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', 'Menlo', 'Consolas', monospace", background: "#08090D", color: "#D4D4D8", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Instrument+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-track { background: #12141A; }
        ::-webkit-scrollbar-thumb { background: #2A2D38; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #3A3D48; }

        .hdr { 
          background: linear-gradient(180deg, #0F1118 0%, #08090D 100%);
          border-bottom: 1px solid #1E2030;
          padding: 20px 20px 14px;
          position: sticky; top: 0; z-index: 20;
        }
        .title {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 22px; font-weight: 700; color: #F4F4F5;
          letter-spacing: -0.5px;
          display: flex; align-items: center; gap: 12px;
        }
        .title-accent { color: #7C4DFF; }
        .stats-bar {
          display: flex; gap: 16px; margin-top: 8px; font-size: 11px; color: #71717A;
        }
        .stats-bar span { display: flex; align-items: center; gap: 4px; }
        .stats-num { color: #A1A1AA; font-weight: 600; }

        .filters {
          display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; align-items: center;
        }
        .search-box {
          flex: 1; min-width: 200px; position: relative;
        }
        .search-box input {
          width: 100%; padding: 7px 10px 7px 30px;
          background: #12141A; border: 1px solid #1E2030; border-radius: 6px;
          color: #D4D4D8; font-family: inherit; font-size: 12px; outline: none;
        }
        .search-box input:focus { border-color: #7C4DFF; box-shadow: 0 0 0 1px #7C4DFF33; }
        .search-box .ico { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: #52525B; font-size: 12px; }
        
        .fbtn {
          padding: 5px 10px; border-radius: 5px; border: 1px solid #1E2030;
          background: #12141A; color: #71717A; font-family: inherit; font-size: 10px;
          cursor: pointer; transition: all 0.12s; white-space: nowrap;
          text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
        }
        .fbtn:hover { border-color: #3F3F46; color: #A1A1AA; }
        .fbtn.on { background: #7C4DFF22; border-color: #7C4DFF; color: #B794FF; }

        .tbl-wrap {
          overflow-x: auto; padding: 0 8px 40px;
        }
        table {
          width: 100%; border-collapse: collapse; font-size: 11.5px;
          table-layout: auto;
        }
        thead { position: sticky; top: 0; z-index: 10; }
        thead th {
          background: #0F1118; border-bottom: 2px solid #7C4DFF44;
          padding: 8px 8px; text-align: left; color: #71717A;
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px;
          font-weight: 600; cursor: pointer; white-space: nowrap;
          user-select: none; transition: color 0.12s;
        }
        thead th:hover { color: #B794FF; }
        thead th.sorted { color: #B794FF; }

        tbody tr {
          border-bottom: 1px solid #1A1C26;
          cursor: pointer; transition: background 0.1s;
        }
        tbody tr:hover { background: #12141A; }
        tbody tr.expanded { background: #12141A; border-bottom-color: transparent; }

        td {
          padding: 7px 8px; vertical-align: top;
          max-width: 200px;
        }
        td.name-cell {
          font-weight: 600; color: #F4F4F5; white-space: nowrap;
          font-size: 12px; min-width: 180px;
        }
        td.desc-cell {
          color: #A1A1AA; font-size: 11px; line-height: 1.5;
          min-width: 240px; max-width: 340px;
        }
        td.param-cell {
          color: #8B8B9A; font-size: 10.5px; line-height: 1.5;
          min-width: 200px; max-width: 280px;
        }
        td.conf-cell {
          color: #7C6DAF; font-size: 10.5px; line-height: 1.5;
          min-width: 180px; max-width: 260px;
        }

        .time-tag {
          display: inline-block; padding: 2px 6px; border-radius: 3px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; white-space: nowrap;
        }
        .type-dot {
          display: inline-block; width: 8px; height: 8px; border-radius: 50%;
          margin-right: 3px; vertical-align: middle;
        }
        .bias-tag {
          font-size: 10px; font-weight: 600;
        }
        .wr-cell { font-weight: 600; }
        .rr-cell { font-weight: 600; color: #FFB74D; }
        .prob-cell { font-size: 11px; }

        .expanded-detail {
          background: #0C0E14; border-bottom: 1px solid #1A1C26;
        }
        .expanded-detail td {
          padding: 14px 12px;
        }
        .detail-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 12px; max-width: 900px;
        }
        .detail-section {}
        .detail-label {
          font-size: 9px; text-transform: uppercase; letter-spacing: 1px;
          color: #7C4DFF; font-weight: 700; margin-bottom: 4px;
        }
        .detail-text {
          font-size: 11.5px; line-height: 1.6; color: #A1A1AA;
        }

        .legend {
          display: flex; gap: 14px; font-size: 10px; color: #52525B;
          padding: 8px 20px; align-items: center; flex-wrap: wrap;
        }
        .legend-item { display: flex; align-items: center; gap: 4px; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.15s ease; }
      `}</style>

      <div className="hdr">
        <div className="title">
          <span className="title-accent">▊</span> Trading Playbook Encyclopedia
        </div>
        <div className="stats-bar">
          <span><span className="stats-num">{data.length}</span> / {S.length} setups shown</span>
          <span>•</span>
          <span>Stockholm CET timezone</span>
          <span>•</span>
          <span>EU open → US open range</span>
        </div>
        <div className="filters">
          <div className="search-box">
            <span className="ico">⌕</span>
            <input placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className={`fbtn ${timeFilter === "all" ? "on" : ""}`} onClick={() => setTimeFilter("all")}>All Times</button>
          {Object.entries(TIME_META).map(([k, v]) => (
            <button key={k} className={`fbtn ${timeFilter === k ? "on" : ""}`} onClick={() => setTimeFilter(timeFilter === k ? "all" : k)}
              style={timeFilter === k ? { borderColor: v.color, color: v.color, background: v.bg } : {}}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="filters" style={{ marginTop: 6 }}>
          <button className={`fbtn ${typeFilter === "all" ? "on" : ""}`} onClick={() => setTypeFilter("all")}>All Types</button>
          {Object.entries(TYPE_ICONS).map(([k, v]) => (
            <button key={k} className={`fbtn ${typeFilter === k ? "on" : ""}`} onClick={() => setTypeFilter(typeFilter === k ? "all" : k)}
              style={typeFilter === k ? { borderColor: v.color, color: v.color, background: v.color + "18" } : {}}>
              <span className="type-dot" style={{ background: v.color }}></span> {v.label}
            </button>
          ))}
        </div>
        <div className="legend">
          <span style={{ color: "#71717A", fontWeight: 600 }}>Legend:</span>
          <span className="legend-item"><span className="type-dot" style={{ background: "#00E676" }}></span> Base Hit (daily repeater)</span>
          <span className="legend-item"><span className="type-dot" style={{ background: "#448AFF" }}></span> Standard</span>
          <span className="legend-item"><span className="type-dot" style={{ background: "#FFD740" }}></span> High Value / Rare</span>
          <span className="legend-item">↑ Long only</span>
          <span className="legend-item">↓ Short only</span>
          <span className="legend-item">↕ Both</span>
          <span className="legend-item" style={{ color: "#52525B" }}>Click any row to expand</span>
        </div>
      </div>

      <div className="tbl-wrap" ref={tableRef}>
        <table>
          <thead>
            <tr>
              {COLS.map((c, i) => (
                <th key={i} className={sortCol === i ? "sorted" : ""} onClick={() => i < 9 && handleSort(i)}>
                  {c} {sortCol === i ? (sortDir === 1 ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(({ id, d }) => {
              const tm = TIME_META[d[1]];
              const tp = TYPE_ICONS[d[7]];
              const isExp = expandedRow === id;
              const wrNum = parseInt(d[4]);
              const wrColor = wrNum >= 65 ? "#00E676" : wrNum >= 55 ? "#B2FF59" : "#FFD740";
              const probColor = d[6].startsWith("High") ? "#00E676" : d[6].startsWith("Med") ? "#FFD740" : d[6] === "Low" ? "#FF5252" : "#A1A1AA";
              return (
                <>
                  <tr key={id} className={isExp ? "expanded" : ""} onClick={() => setExpandedRow(isExp ? null : id)}>
                    <td className="name-cell">{d[0]}</td>
                    <td><span className="time-tag" style={{ background: tm.bg, color: tm.color }}>{tm.label}</span></td>
                    <td style={{ color: "#71717A", fontSize: 10, whiteSpace: "nowrap" }}>{d[2]}</td>
                    <td style={{ color: "#A1A1AA", whiteSpace: "nowrap" }}>{d[3]}</td>
                    <td className="wr-cell" style={{ color: wrColor }}>{d[4]}</td>
                    <td className="rr-cell">{d[5]}</td>
                    <td className="prob-cell" style={{ color: probColor }}>{d[6]}</td>
                    <td><span className="type-dot" style={{ background: tp?.color || "#666" }}></span></td>
                    <td className="bias-tag" style={{ color: d[8] === "↑" ? "#00E676" : d[8] === "↓" ? "#FF5252" : d[8].includes("above") ? "#00E676" : "#448AFF" }}>{d[8]}</td>
                    <td className="desc-cell">{d[9]}</td>
                    <td className="param-cell">{d[10]}</td>
                    <td className="conf-cell">{d[11]}</td>
                  </tr>
                  {isExp && (
                    <tr className="expanded-detail fade-in" key={id + "_exp"}>
                      <td colSpan={12}>
                        <div className="detail-grid">
                          <div className="detail-section">
                            <div className="detail-label">Full Description</div>
                            <div className="detail-text">{d[9]}</div>
                          </div>
                          <div className="detail-section">
                            <div className="detail-label">Parameters & Conditions</div>
                            <div className="detail-text">{d[10]}</div>
                          </div>
                          <div className="detail-section">
                            <div className="detail-label">Confluences & Confirmation</div>
                            <div className="detail-text">{d[11]}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 24, marginTop: 12, paddingTop: 10, borderTop: "1px solid #1A1C26" }}>
                          <div><span style={{ color: "#7C4DFF", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Win Rate </span><span style={{ color: wrColor, fontWeight: 700 }}>{d[4]}</span></div>
                          <div><span style={{ color: "#7C4DFF", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>R:R </span><span style={{ color: "#FFB74D", fontWeight: 700 }}>{d[5]}</span></div>
                          <div><span style={{ color: "#7C4DFF", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Frequency </span><span style={{ color: "#A1A1AA", fontWeight: 600 }}>{d[3]}</span></div>
                          <div><span style={{ color: "#7C4DFF", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Probability </span><span style={{ color: probColor, fontWeight: 700 }}>{d[6]}</span></div>
                          <div><span style={{ color: "#7C4DFF", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Time </span><span style={{ color: tm.color, fontWeight: 600 }}>{tm.label} ({d[2]})</span></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {data.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#52525B" }}>No setups match your filters.</div>
        )}
      </div>
    </div>
  );
}
