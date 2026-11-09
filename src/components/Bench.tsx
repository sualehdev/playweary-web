"use client";

/* eslint-disable @next/next/no-img-element */

/**
 * The Dress-Up Bench: drag (or tap) hair, an outfit, shoes — and for her, a
 * bag — onto the printed character.
 *
 * React owns what is worn, what is owned and what the shirt looks like. GSAP
 * owns the movement: pop-in and tear-off tweens, and Draggable for the drags.
 * The two meet at a small `Api` ref that always points at the latest render, so
 * a Draggable created once never reads stale state.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { pieceArt, pieceSize, pieceSrc } from "@/content/art";
import {
  CHARACTERS,
  SLOT_LABEL,
  TRAY_TITLE,
  comboFor,
  findPiece,
  lookForHour,
  lookNumber,
  setById,
  slotAnchor,
  totalLooks,
  wornCount,
  type CharacterId,
  type Piece,
  type SlotType,
  type Worn,
} from "@/content/characters";
import { DEFAULT_SIZE, SIZES, kitId, money, productById } from "@/content/products";
import { flyToCart } from "@/lib/effects";
import { Draggable, gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { useShop } from "@/store/ShopProvider";
import CharacterToggle from "./CharacterToggle";
import Tee from "./Tee";

type Leaving = { key: number; character: CharacterId; slot: SlotType; id: string; from: { x: number; y: number } };

type Api = {
  character: CharacterId;
  worn: Worn;
  isOwned: (p: Piece) => boolean;
  wear: (p: Piece, silent?: boolean) => void;
  remove: (slot: SlotType, from?: { x: number; y: number }) => void;
  flashLock: (el: Element, p: Piece) => void;
  slotEls: Partial<Record<SlotType, HTMLElement | null>>;
  basket: HTMLElement | null;
};

const Z: Record<SlotType, number> = { outfit: 2, shoes: 3, hair: 4, bag: 5 };

const centreOf = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** The slot nearest the dragged piece, if it is close enough to count. */
function slotUnder(api: Api, el: Element): SlotType | null {
  const c = centreOf(el);
  let best: SlotType | null = null;
  let bd = Infinity;
  for (const type of CHARACTERS[api.character].slots) {
    const slot = api.slotEls[type];
    if (!slot) continue;
    const sc = centreOf(slot);
    const d = Math.hypot(sc.x - c.x, sc.y - c.y);
    if (d < bd) {
      bd = d;
      best = type;
    }
  }
  return bd < 110 ? best : null;
}

function overBasket(api: Api, el: Element) {
  if (!api.basket) return false;
  const c = centreOf(el);
  const r = api.basket.getBoundingClientRect();
  return c.x > r.left - 30 && c.x < r.right + 30 && c.y > r.top - 30 && c.y < r.bottom + 30;
}

/* ---------------------------------------------------------- tray piece -- */

function PieceButton({
  piece,
  owned,
  on,
  api,
}: {
  piece: Piece;
  owned: boolean;
  on: boolean;
  api: React.RefObject<Api>;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const dragged = useRef(false);
  const setName = setById(piece.set)?.name ?? "";

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const [d] = Draggable.create(el, {
        type: "x,y",
        zIndexBoost: true,
        allowNativeTouchScrolling: false,
        onPress: () => {
          dragged.current = false;
        },
        onDragStart: () => {
          el.classList.add("dragging");
          dragged.current = true;
        },
        onDrag: () => {
          const a = api.current;
          const t = slotUnder(a, el);
          for (const k of CHARACTERS[a.character].slots)
            a.slotEls[k]?.classList.toggle("hot", k === t && k === piece.type);
          a.basket?.classList.toggle("hot", overBasket(a, el));
        },
        onDragEnd: () => {
          const a = api.current;
          for (const k of CHARACTERS[a.character].slots) a.slotEls[k]?.classList.remove("hot");
          a.basket?.classList.remove("hot");
          el.classList.remove("dragging");
          const home = () =>
            gsap.to(el, { x: 0, y: 0, duration: reducedMotion() ? 0 : 0.45, ease: "back.inOut(1.6)" });
          const t = slotUnder(a, el);
          if (overBasket(a, el)) {
            a.remove(piece.type);
          } else if (t === piece.type) {
            if (!a.isOwned(piece)) a.flashLock(el, piece);
            else a.wear(piece);
          } else if (t && !reducedMotion()) {
            const slot = a.slotEls[t];
            if (slot)
              gsap
                .timeline()
                .to(slot, { scale: 1.16, duration: 0.14 })
                .to(slot, { scale: 1, duration: 0.3, ease: "elastic.out(1,.4)" });
          }
          home();
        },
      });
      return () => d.kill();
    },
    { scope: ref, dependencies: [] }
  );

  return (
    <button
      ref={ref}
      type="button"
      className={"piece" + (on ? " on" : "") + (owned ? "" : " locked")}
      data-id={piece.id}
      data-type={piece.type}
      aria-pressed={owned ? on : undefined}
      aria-label={piece.name + (owned ? "" : " (" + setName + ")")}
      onClick={() => {
        // a drag ends in a click; ignore that one
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        const a = api.current;
        if (!a.isOwned(piece)) return a.flashLock(ref.current!, piece);
        if (a.worn[piece.type] === piece.id) a.remove(piece.type);
        else a.wear(piece);
      }}
    >
      <img src={pieceSrc(piece.character, piece.id, 256)} {...pieceSize(piece.character, piece.id, 256)} alt="" />
      <small>{piece.name}</small>
    </button>
  );
}

/* --------------------------------------------------------- worn pieces -- */

/** A piece on the shirt. Mounting is the pop-in; the drag takes it off again. */
function WornPiece({
  piece,
  silent,
  api,
}: {
  piece: Piece;
  silent: boolean;
  api: React.RefObject<Api>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const art = pieceArt(piece.character, piece.id);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (!silent && !reducedMotion()) {
        gsap.fromTo(
          el,
          { scale: 1.5, opacity: 0, rotate: -8 },
          { scale: 1, opacity: 1, rotate: 0, duration: 0.42, ease: "back.out(2.2)" }
        );
      }
      const pos = el.parentElement as HTMLElement;
      const z = pos.style.zIndex;
      const [d] = Draggable.create(el, {
        type: "x,y",
        zIndexBoost: false,
        allowNativeTouchScrolling: false,
        onPress: () => {
          pos.style.zIndex = "60";
        },
        onRelease: () => {
          pos.style.zIndex = z;
        },
        onDrag: () => api.current.basket?.classList.toggle("hot", overBasket(api.current, el)),
        onDragEnd: () => {
          const a = api.current;
          a.basket?.classList.remove("hot");
          if (overBasket(a, el) || Math.abs(d.x) > 70 || Math.abs(d.y) > 70) {
            a.remove(piece.type, { x: d.x, y: d.y });
          } else {
            gsap.to(el, { x: 0, y: 0, duration: reducedMotion() ? 0 : 0.4, ease: "back.inOut(1.6)" });
          }
        },
      });
      return () => d.kill();
    },
    { scope: ref, dependencies: [] }
  );

  return (
    // The outer box does the centring (CSS only); GSAP moves the inner one. GSAP
    // would otherwise freeze centring into pixels measured before the image loads.
    <div
      className="wornPos"
      style={{ left: art.slot.cx + "%", top: art.slot.cy + "%", width: art.slot.w + "%", zIndex: Z[piece.type] }}
    >
      <div ref={ref} className="worn" data-type={piece.type} data-piece={piece.id}>
        <img src={pieceSrc(piece.character, piece.id, 640)} {...pieceSize(piece.character, piece.id, 640)} alt="" />
      </div>
    </div>
  );
}

/** A piece that has just come off: it shrinks away, then removes itself. */
function LeavingPiece({ item, onDone }: { item: Leaving; onDone: () => void }) {
  const { character } = item;
  const ref = useRef<HTMLDivElement>(null);
  const art = pieceArt(character, item.id);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.set(el, { x: item.from.x, y: item.from.y });
      gsap.to(el, { scale: 0.4, opacity: 0, rotate: 14, duration: 0.28, onComplete: onDone });
    },
    { scope: ref, dependencies: [] }
  );
  return (
    <div
      className="wornPos"
      style={{ left: art.slot.cx + "%", top: art.slot.cy + "%", width: art.slot.w + "%", zIndex: Z[item.slot] }}
    >
      <div ref={ref} className="worn leaving">
        <img src={pieceSrc(character, item.id, 640)} {...pieceSize(character, item.id, 640)} alt="" />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- the bench -- */

export default function Bench() {
  const { state, isOwned, add, openDrawer } = useShop();
  const character = state.character;
  const def = CHARACTERS[character];

  const [wornAll, setWornAll] = useState<Record<CharacterId, Worn>>({ boy: {}, girl: {} });
  const worn = wornAll[character];
  const [leaving, setLeaving] = useState<Leaving[]>([]);
  /** Keys of pieces that should appear without the pop-in (the greeting, a shuffle). */
  const [quiet, setQuiet] = useState<string[]>([]);

  const stage = useRef<HTMLDivElement>(null);
  const comboEl = useRef<HTMLDivElement>(null);
  const basketEl = useRef<HTMLDivElement>(null);
  const slotEls = useRef<Api["slotEls"]>({});
  const leaveId = useRef(0);
  const comboCur = useRef("");
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);
  const didGreet = useRef(false);

  const setWorn = useCallback(
    (c: CharacterId, fn: (w: Worn) => Worn) => setWornAll((all) => ({ ...all, [c]: fn(all[c]) })),
    []
  );

  const wear = useCallback(
    (p: Piece, isQuiet?: boolean) => {
      setQuiet(isQuiet ? [`${p.character}:${p.type}:${p.id}`] : []);
      setWorn(p.character, (w) => ({ ...w, [p.type]: p.id }));
    },
    [setWorn]
  );

  const remove = useCallback(
    (slot: SlotType, from = { x: 0, y: 0 }) => {
      const id = wornAll[character][slot];
      if (!id) return;
      if (!reducedMotion()) setLeaving((l) => [...l, { key: ++leaveId.current, character, slot, id, from }]);
      setWorn(character, (w) => ({ ...w, [slot]: undefined }));
    },
    [character, setWorn, wornAll]
  );

  const flashLock = useCallback((el: Element, p: Piece) => {
    const rm = reducedMotion();
    if (!rm)
      gsap.timeline().to(el, { x: -5, duration: 0.07 }).to(el, { x: 5, duration: 0.08 }).to(el, { x: 0, duration: 0.16 });
    const card = document.getElementById("prod-" + p.set);
    if (card) {
      card.scrollIntoView({ behavior: rm ? "auto" : "smooth", block: "center" });
      if (!rm) gsap.fromTo(card, { scale: 1 }, { scale: 1.04, duration: 0.25, yoyo: true, repeat: 1, delay: 0.5 });
    }
  }, []);

  // The Draggables are made once; this keeps what they read current.
  const api = useRef<Api>({
    character,
    worn,
    isOwned: () => true,
    wear,
    remove,
    flashLock,
    slotEls: {},
    basket: null,
  });
  useEffect(() => {
    api.current = {
      character,
      worn,
      isOwned: (p) => isOwned(p.set),
      wear,
      remove,
      flashLock,
      slotEls: slotEls.current,
      basket: basketEl.current,
    };
  });

  /* what the page greets you with: a look to suit the hour, from what you own */
  useEffect(() => {
    if (!state.hydrated || didGreet.current) return;
    didGreet.current = true;
    const { picks } = lookForHour(new Date().getHours());
    if (!picks) return;
    CHARACTERS.boy.slots.forEach((slot, i) => {
      const p = findPiece("boy", `${slot}${picks[i]}`);
      if (isOwned(p.set)) wear(p, true);
    });
  }, [state.hydrated, isOwned, wear]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearInterval);
  }, []);

  /* the match-day banner */
  const combo = comboFor(def, worn);
  const comboLabel = combo?.label ?? "";
  useGSAP(
    () => {
      const el = comboEl.current;
      if (!el) return;
      gsap.set(el, { xPercent: -50, yPercent: -50 });
      if (!comboLabel) {
        gsap.to(el, { opacity: 0, duration: 0.2 });
        comboCur.current = "";
        return;
      }
      if (comboCur.current === comboLabel) return;
      comboCur.current = comboLabel;
      el.textContent = comboLabel;
      if (reducedMotion()) {
        gsap.set(el, { opacity: 1 });
        return;
      }
      gsap
        .timeline()
        .fromTo(
          el,
          { opacity: 0, scale: 2.2, rotate: -22 },
          { opacity: 1, scale: 1, rotate: -8, duration: 0.38, ease: "back.out(2.6)" }
        )
        .to(el, { rotate: -5, duration: 0.5, ease: "elastic.out(1,.35)" })
        .to(el, { opacity: 0, duration: 0.45, delay: 1.6, onComplete: () => (comboCur.current = "") });
    },
    { dependencies: [comboLabel] }
  );

  const shuffle = () => {
    const pick = (slot: SlotType) => {
      const pool = def.pieces.filter((p) => p.type === slot && isOwned(p.set));
      return pool[Math.floor(Math.random() * pool.length)];
    };
    if (reducedMotion()) return def.slots.forEach((s) => wear(pick(s), true));
    let n = 0;
    const iv = setInterval(() => {
      def.slots.forEach((s) => wear(pick(s), true));
      if (++n > 6) {
        clearInterval(iv);
        stage.current
          ?.querySelectorAll(".pieceLayer .worn")
          .forEach((el) => gsap.fromTo(el, { scale: 1.18 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,.4)" }));
      }
    }, 90);
    timers.current.push(iv);
  };

  // Dressing up is only the preview: what goes in the cart is this
  // character's kit, which ships with every piece on the bench.
  const [size, setSize] = useState(DEFAULT_SIZE);
  const kit = productById(kitId(character))!;
  const addKit = (from: Element) => {
    add(kit.id, size);
    flyToCart(from);
    openDrawer();
  };

  const n = wornCount(worn);
  const look = lookNumber(def, worn);
  const total = totalLooks(def);
  const sum = def.slots.map(() => "3").join(" × ");

  return (
    <section id="bench">
      <div className="wrap">
        <div className="eyebrow">try it before you buy it</div>
        <h2>The Dress-Up Bench</h2>
        <p className="lede" style={{ marginTop: ".6rem" }}>
          Your child decides. Drag hair onto the head, an outfit onto the body, shoes onto the feet
          {character === "girl" ? ", a bag by the hand" : ""}, or just tap. Every combination here
          is one they can build with the real pieces, and figuring out which ones work is the whole
          point.
        </p>

        <div className="benchgrid">
          <div className="stagebox" ref={stage}>
            <CharacterToggle />
            <div className="lookline">
              <span className="pill" id="lookPill" aria-live="polite">
                {look ? `Look ${look} of ${total}` : `${total} looks to find`}
              </span>
              <span className="pill light" id="ownPill">
                {n} piece{n === 1 ? "" : "s"} on
              </span>
            </div>
            <Tee id="stageTee" character={character} bare={Boolean(worn.outfit)}>
              <div className="pieceLayer">
                {def.slots.map((type) => {
                  const a = slotAnchor(character, type);
                  return (
                    <div
                      key={character + type}
                      className="slotPos"
                      style={{ left: a.cx + "%", top: a.cy + "%", width: `max(38px, ${(a.w * 0.6).toFixed(2)}cqw)` }}
                    >
                      <div
                        ref={(el) => {
                          slotEls.current[type] = el;
                        }}
                        className={"slot" + (worn[type] ? " filled" : "")}
                        data-slot={type}
                      >
                        {SLOT_LABEL[type]}
                      </div>
                    </div>
                  );
                })}
                {def.slots.map((type) => {
                  const id = worn[type];
                  if (!id) return null;
                  const key = `${character}:${type}:${id}`;
                  return <WornPiece key={key} piece={findPiece(character, id)} silent={quiet.includes(key)} api={api} />;
                })}
                {leaving.map((l) => (
                  <LeavingPiece
                    key={l.key}
                    item={l}
                    onDone={() => setLeaving((all) => all.filter((x) => x.key !== l.key))}
                  />
                ))}
              </div>
            </Tee>
            <div id="combo" ref={comboEl} aria-hidden="true" />
            <div className="buyBox">
              <div className="buyHead">
                <div>
                  <h3>{kit.name}</h3>
                  <p>{kit.sub}. {kit.looks}.</p>
                </div>
                <b className="buyPrice">{money(kit.price)}</b>
              </div>
              <div className="sizeRow">
                <span id="sizeLabel">Size</span>
                <div className="sizes" role="radiogroup" aria-labelledby="sizeLabel">
                  {SIZES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={size === s.id}
                      className={"sizeChip" + (size === s.id ? " on" : "")}
                      title={`${s.inches} tall (${s.cm})`}
                      onClick={() => setSize(s.id)}
                    >
                      {s.id}
                    </button>
                  ))}
                </div>
                <a className="sizeGuide" href="#info-sizing">
                  Size guide
                </a>
              </div>
              <button className="btn wide" id="addLook" type="button" onClick={(e) => addKit(e.currentTarget)}>
                Add to cart · {money(kit.price)}
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: ".5rem",
                flexWrap: "wrap",
                alignItems: "center",
                marginTop: "1rem",
              }}
            >
              <button
                className="btn ghost sm"
                id="stripAll"
                type="button"
                onClick={() => def.slots.forEach((s) => remove(s))}
              >
                Take it all off
              </button>
              <button
                className="btn ghost sm"
                id="surprise"
                type="button"
                title="For the youngest, or when nobody can decide"
                onClick={shuffle}
              >
                🎲 Stuck? Shuffle
              </button>
              <div id="basket" ref={basketEl} title="Drop a piece here to take it off">
                <svg viewBox="0 0 100 80" aria-hidden="true">
                  <path d="M12 26h76l-8 46a8 8 0 0 1-8 7H28a8 8 0 0 1-8-7z" fill="#9F3EFF" opacity=".2" />
                  <path d="M12 26h76l-8 46a8 8 0 0 1-8 7H28a8 8 0 0 1-8-7z" fill="none" stroke="#200242" strokeWidth="4" />
                  <rect x="6" y="14" width="88" height="16" rx="8" fill="#200242" />
                  <path
                    d="M34 44v26M50 44v26M66 44v26"
                    stroke="#200242"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity=".45"
                  />
                </svg>
                <span>wash basket</span>
              </div>
            </div>
          </div>

          <div>
            {def.slots.map((slot) => (
              <div className="tray" key={character + slot}>
                <div className="trayhead">
                  <h3>{TRAY_TITLE[character][slot]}</h3>
                  <em>pick one</em>
                </div>
                <div className="rack" data-rack={slot}>
                  {def.pieces
                    .filter((p) => p.type === slot)
                    .map((p) => (
                      <PieceButton
                        key={character + p.id}
                        piece={p}
                        owned={isOwned(p.set)}
                        on={worn[slot] === p.id}
                        api={api}
                      />
                    ))}
                </div>
              </div>
            ))}

            <div className="card" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 190px" }}>
                <h3 style={{ marginBottom: ".2rem" }}>
                  {sum} = {total} looks
                </h3>
                <p style={{ margin: 0, fontSize: ".95rem" }}>
                  Every piece on this bench comes in the box: the shirt plus all three sets. Dress
                  them up here, then they do it for real.
                </p>
              </div>
              <button className="btn sm ghost" data-scroll="#collect" type="button">
                What&apos;s in the kit
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
