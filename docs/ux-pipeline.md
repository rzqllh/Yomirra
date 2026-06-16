# Yomirra Virtualized Streaming Render Pipeline

## 1. OBJECTIVE

Menciptakan sistem rendering manga/webtoon yang:

- Tidak render semua image sekaligus
- Tidak ada jank saat scroll cepat
- Tidak ada layout shift
- Terasa seperti **infinite canvas / continuous strip**

---

## 2. CORE PRINCIPLE

### A. Windowed Rendering (Virtualization)

Hanya render:

- Current viewport
- Buffer atas & bawah (preload zone)

```text
[ buffer prev ]
[ visible viewport ]
[ buffer next ]
```

### B. Deterministic Layout

- Semua tinggi image HARUS diketahui sebelum render
- Tidak boleh bergantung pada `onLoad` untuk layout

### C. Streaming, bukan Pagination

- Chapter dianggap 1 continuous list
- Bukan page-by-page navigation

---

## 3. PIPELINE FLOW

### STEP 1 — DATA PREPARATION

```ts
type PageMeta = {
  id: string;
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
};
```

✔ REQUIREMENT:

- Ambil dimensi image dari API / manifest
- Kalau tidak ada → PREPROCESS server-side

---

### STEP 2 — HEIGHT CALCULATION

```ts
const containerWidth = viewportWidth;

const computedHeight = containerWidth / aspectRatio;
```

➡️ Semua height dihitung SEBELUM render
➡️ Simpan dalam array: `layoutMap[]`

---

### STEP 3 — VIRTUAL WINDOW ENGINE

Gunakan konsep mirip `react-virtual` / `react-window`

```ts
type VirtualItem = {
  index: number;
  start: number;
  size: number;
};
```

#### Visible range calculation:

```ts
const start = scrollTop - buffer;
const end = scrollTop + viewportHeight + buffer;
```

➡️ Render hanya item dalam range ini

---

### STEP 4 — POSITIONING (CRITICAL)

Gunakan **absolute positioning**, bukan flow DOM biasa

```tsx
<div style={{ height: totalHeight }}>
  {visibleItems.map((item) => (
    <img
      key={item.index}
      src={pages[item.index].src}
      style={{
        position: "absolute",
        top: item.start,
        height: item.size,
        width: "100%",
      }}
    />
  ))}
</div>
```

✔ NO layout shift
✔ NO reflow chain

---

### STEP 5 — IMAGE LOADING STRATEGY

#### A. Priority Zones

| Zone    | Behavior         |
| ------- | ---------------- |
| Visible | Load immediately |
| Buffer  | Preload          |
| Outside | Do not load      |

#### B. Implementation

```ts
if (isVisible) loadImage((priority = "high"));
else if (isInBuffer) preload();
else unload();
```

---

### STEP 6 — DECODE OPTIMIZATION

```ts
img.decoding = "async";
img.loading = "eager"; // only for visible
```

Gunakan:

```ts
await img.decode();
```

➡️ Render hanya setelah siap (tanpa fade-in)

---

### STEP 7 — SCROLL ENGINE

Gunakan:

- Passive scroll listener
- `requestAnimationFrame` throttling

```ts
let ticking = false;

window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateVisibleRange();
      ticking = false;
    });
    ticking = true;
  }
});
```

---

### STEP 8 — MEMORY MANAGEMENT

Saat item keluar jauh dari buffer:

```ts
unmountImage(index);
```

Optional:

```ts
cache LRU (max 10–20 images)
```

---

## 4. ANTI-PATTERNS (FORBIDDEN)

❌ fade-in images
❌ aspect-ratio transitions
❌ layout shift on load
❌ rendering full chapter
❌ scroll-linked animations
❌ spring animations during scroll

---

## 5. PERFORMANCE TARGET

| Metric                | Target                |
| --------------------- | --------------------- |
| FPS                   | 60 fps stable         |
| Input latency         | < 16ms                |
| Layout shift          | 0                     |
| Time to image display | instant (post-decode) |

---

## 6. OPTIONAL ENHANCEMENTS

### A. IntersectionObserver Hybrid

Untuk preload buffer lebih efisien

### B. Progressive Image (LOW PRIORITY)

- Blur placeholder boleh
- TANPA animasi

### C. Snap Mode (optional)

Untuk manga non-webtoon

---

## 7. RESULT EXPECTATION

Dengan pipeline ini:

- Scroll super smooth bahkan di chapter panjang
- Tidak ada flicker / shifting
- Terasa seperti Webtoon native app
- CPU & memory usage stabil

---

## FINAL NOTE

Ini bukan sekadar optimization.

Ini adalah **arsitektur fundamental** yang menentukan:

- UX quality
- perceived speed
- scalability ke chapter panjang

Implementasi setengah-setengah akan gagal.
