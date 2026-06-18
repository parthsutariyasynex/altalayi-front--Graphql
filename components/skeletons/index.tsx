

"use client";

import { usePathname } from "next/navigation";

// ─── Skeleton primitives ──────────────────────────────────────────────────────
const Pulse = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// ─── Navbar Skeleton ──────────────────────────────────────────────────────────
export function NavbarSkeleton() {
  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* Main bar — real navbar h-[56px] sm:h-[64px] lg:h-[72px] */}
      <div className="h-[56px] sm:h-[64px] lg:h-[72px] flex items-center justify-between px-3 sm:px-5 lg:px-8 xl:px-14">
        {/* Logo */}
        <Pulse className="h-6 sm:h-8 lg:h-10 w-24 sm:w-32 lg:w-40" />
        {/* Right side: search + icons */}
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
          <Pulse className="hidden md:block h-8 w-48 lg:w-64" />
          <Pulse className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
          <Pulse className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
          <Pulse className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
        </div>
      </div>
      {/* Secondary nav bar — lg only. Height matches real Navbar's min-h-[48px]
          (py-3 + text-[16px] link button) so there's no shift on hand-off. */}
      <div className="hidden lg:flex bg-[#F5B21B] h-[48px] items-center justify-center gap-8 px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-3 w-20 bg-black/10 rounded animate-pulse" />
        ))}
      </div>
    </header>
  );
}

// ─── Sidebar Skeleton ─────────────────────────────────────────────────────────
export function SidebarSkeleton() {
  // Mirrors the real account Sidebar's <aside>/<nav>/<ul>/<li> exactly (components/Sidebar.tsx):
  // same width, sticky offsets, height, border-[#ebebeb], overflow/shadow, and per-item box —
  // each item reproduces the real <Link>'s box (py-3 px-6 lg:px-4 + border-b-[3px] lg:border-b-0
  // ltr:lg:border-l-4 border-transparent) so the active-indicator space is reserved and the menu
  // text placeholder sits exactly where the real label lands → no shift when the real menu loads.
  return (
    <aside className="w-full lg:w-64 flex-shrink-0 bg-[#f8f8f8] border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-[#ebebeb] z-30 sticky top-[56px] sm:top-[64px] lg:top-[108px] h-auto lg:h-[calc(100vh-108px)] overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar shadow-sm lg:shadow-none">
      <nav className="p-0 lg:p-4">
        <ul className="flex flex-row lg:flex-col space-y-0 lg:space-y-1">
          {/* ~10 items = the real account menu (SIDEBAR_ROUTES) so the skeleton column height
              matches the real sidebar and doesn't grow when the menu loads. */}
          {Array.from({ length: 10 }).map((_, i) => (
            <li key={i} className="flex-shrink-0">
              <div className="block py-3 px-6 lg:px-4 border-b-[3px] lg:border-b-0 ltr:lg:border-l-4 rtl:lg:border-r-4 border-transparent whitespace-nowrap">
                <Pulse className="h-3.5 w-full max-w-[150px] rounded" />
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

// ─── Product Card Skeleton ────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden animate-pulse">
      <Pulse className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <Pulse className="h-4 w-3/4 rounded" />
        <Pulse className="h-3 w-1/2 rounded" />
        <div className="flex items-center justify-between pt-1">
          <Pulse className="h-5 w-16 rounded" />
          <Pulse className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Product Listing Skeleton ─────────────────────────────────────────────────
// Mirrors /products real layout exactly:
//   xl+:  Sidebar filter (w-[300px]) + content area with desktop header strip,
//         10-column table (brand, size, pattern, year, origin, image, offer,
//         stock, price, action), and fixed bottom HorizontalFilter bar.
//   <xl:  4-button mobile controls (favourites, search, sort, filter) +
//         mobile card grid + pagination.
export function ProductListingSkeleton({ count = 10 }: { count?: number }) {
  // Real desktop header column widths (BASE + ACTION).
  const COL_WIDTHS = ["8%", "13%", "13%", "6%", "7%", "7%", "9%", "9%", "10%", "110px"];

  return (
    <div className="flex">
      {/* Desktop sidebar filter (xl+) — matches real SidebarFilter w-[300px] */}
      <div className="hidden xl:flex flex-col flex-shrink-0 self-stretch bg-white border-r border-gray-200">
        <aside className="flex-shrink-0 flex flex-col sticky top-[108px] h-fit z-30 bg-white overflow-hidden w-[300px] border-r border-gray-200">
          {/* Filter header strip — h-[60px] */}
          <div className="flex items-center w-full h-[60px] border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
            <div className="flex-1 px-6"><Pulse className="h-4 w-32" /></div>
            <div className="w-[50px] min-w-[50px] h-full bg-gray-50 flex items-center justify-center">
              <Pulse className="h-4 w-4 rounded" />
            </div>
          </div>
          {/* Filter groups */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-gray-100 last:border-b-0 px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <Pulse className="h-4 w-24" />
                <Pulse className="h-4 w-4 rounded-full" />
              </div>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Pulse className="h-4 w-4 rounded-[3px]" />
                  <Pulse className="h-3 w-32" />
                </div>
              ))}
            </div>
          ))}
        </aside>
      </div>

      {/* Right content area */}
      <div className="flex-1 flex flex-col w-full">

        {/* ── MOBILE CONTROLS (xl:hidden) — 4 buttons: favs, search, sort, filter ── */}
        <div className="xl:hidden flex flex-col gap-2 mb-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Pulse key={i} className="h-[44px] rounded-xl border border-gray-200" />
            ))}
          </div>
          {/* Reserved chip area (stable height to avoid layout shift) */}
          <div className="min-h-[38px]" />
        </div>

        {/* ── MOBILE/TABLET CARD GRID (xl:hidden) — matches MobileCardShimmer ── */}
        <div className="xl:hidden flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 overflow-y-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 animate-pulse">
              <div className="flex gap-2.5">
                <div className="flex-1 space-y-1.5">
                  <div className="h-2 bg-gray-200 rounded w-14" />
                  <div className="h-3 bg-gray-200 rounded w-full max-w-[140px]" />
                  <div className="h-2.5 bg-gray-200 rounded w-24" />
                  <div className="h-2 bg-gray-200 rounded w-16" />
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <div className="h-3.5 bg-gray-200 rounded w-20" />
                <div className="flex gap-1">
                  <div className="h-8 w-16 bg-gray-200 rounded-lg" />
                  <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile pagination strip */}
        <div className="xl:hidden flex items-center justify-between py-3 px-1">
          <Pulse className="h-2.5 w-24" />
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Pulse key={i} className="h-8 w-8 rounded-lg" />
            ))}
          </div>
        </div>

        {/* ── DESKTOP CONTROLS + TABLE (xl+) ── */}
        <div className="hidden xl:flex flex-col bg-white rounded-none md:rounded-r-2xl shadow-sm border border-gray-200 border-l-0 overflow-hidden">
          {/* Desktop header strip — px-6 py-4, min-h-[60px], favourites btn + sort dropdown */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-4 min-h-[60px]">
            <div className="flex items-center gap-4">
              <Pulse className="h-[40px] w-40 rounded-xl border border-gray-200" />
              <div className="flex flex-1 items-center gap-2 max-w-[800px]">
                <Pulse className="h-7 w-24 rounded-full" />
                <Pulse className="h-7 w-28 rounded-full" />
              </div>
            </div>
            <Pulse className="h-[36px] w-[150px] rounded-xl border border-gray-200" />
          </div>

          {/* Desktop table — 10 columns matching the real table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse table-fixed min-w-[900px]">
              <colgroup>
                {COL_WIDTHS.map((w, i) => <col key={i} style={{ width: w }} />)}
              </colgroup>
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <th key={i} className="px-2 md:px-4 py-2 md:py-3">
                      <Pulse className="h-3 w-12 mx-auto" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: count }).map((_, i) => (
                  <tr key={i} className="h-auto md:h-[52px] animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4">
                        <div className="h-3 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desktop pagination bar */}
          <div className="flex items-center justify-between px-6 h-[52px] border-t border-gray-100 bg-gray-50/30">
            <Pulse className="h-2.5 w-28" />
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Pulse key={i} className="h-9 w-9 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop fixed-bottom HorizontalFilter bar (xl+) */}
        <div className="hidden xl:flex fixed bottom-0 left-0 right-0 z-[40] bg-white border-t-[4px] border-[#F5B21B] shadow-[0_-10px_30px_rgba(0,0,0,0.12)] h-[90px] items-center">
          <div className="w-full pl-[300px]">
            <div className="w-full max-w-[1400px] mx-auto px-4 flex items-center gap-3">
              <Pulse className="flex-1 h-11 rounded-sm border border-gray-200" />
              <Pulse className="flex-1 h-11 rounded-sm border border-gray-200" />
              <Pulse className="flex-1 h-11 rounded-sm border border-gray-200" />
              <Pulse className="h-11 w-32 rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Detail Skeleton ──────────────────────────────────────────────────
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <Pulse className="w-full aspect-square rounded-sm" />
        {/* Info */}
        <div className="space-y-4">
          <Pulse className="h-7 w-3/4 rounded" />
          <Pulse className="h-5 w-1/3 rounded" />
          <Pulse className="h-6 w-1/4 rounded" />
          <div className="space-y-2 pt-2">
            <Pulse className="h-4 w-full rounded" />
            <Pulse className="h-4 w-5/6 rounded" />
            <Pulse className="h-4 w-4/6 rounded" />
          </div>
          <div className="flex gap-3 pt-4">
            <Pulse className="h-11 flex-1 rounded" />
            <Pulse className="h-11 w-11 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Item Skeleton ───────────────────────────────────────────────────────
export function CartItemSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-100">
      <Pulse className="h-20 w-20 flex-shrink-0 rounded-sm" />
      <div className="flex-1 space-y-2">
        <Pulse className="h-4 w-3/4 rounded" />
        <Pulse className="h-3 w-1/2 rounded" />
        <div className="flex items-center justify-between pt-2">
          <Pulse className="h-8 w-24 rounded" />
          <Pulse className="h-5 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Cart Page Skeleton ───────────────────────────────────────────────────────
// Mirrors /cart real layout 1:1 (see components/CartPage.tsx, CartItem.tsx,
// CartActions.tsx, CartSummary.tsx):
//   • bg-[#FDFDFD], max-w-[1440px] mx-auto px-4 md:px-12 pt-8 md:pt-14
//   • centered title + h-1 w-12 yellow underline, mb-10 md:mb-14
//   • 12-col grid (lg:col-span-8 xl:col-span-9 left / lg:col-span-4 xl:col-span-3 right)
//   • sticky table header (lg+) with 45/15/20/20 column widths
//   • rounded-3xl CartItem cards with image (w-16 xl:w-20 rounded-xl) on desktop
//   • CartActions bar (bg-gray-50/50, rounded-2xl, 3 buttons + items count)
//   • Multi-Address Shipping bar (yellow border, label + yellow button)
//   • CartSummary card (sticky lg:top-28, bg-[#fcfcfc] header, h-[46px] coupon row)
export function CartPageSkeleton({ items = 3 }: { items?: number }) {
  // Reused qty-stepper placeholder — matches real CartItem's 3-segment look
  const QtyStepper = ({ small = false }: { small?: boolean }) => (
    <div className={`flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${small ? "h-8" : "h-10"}`}>
      <div className={`${small ? "w-7 h-8" : "w-8 h-10"} flex items-center justify-center`}>
        <Pulse className="h-3 w-2" />
      </div>
      <div className={`${small ? "w-10 h-8" : "w-10 h-10"} flex items-center justify-center`}>
        <Pulse className="h-3 w-4" />
      </div>
      <div className={`${small ? "w-7 h-8" : "w-8 h-10"} flex items-center justify-center`}>
        <Pulse className="h-3 w-2" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-4 lg:pb-10">
      <div className="max-w-[1920px] mx-auto px-4 md:px-12 pt-8 md:pt-14">

        {/* Breadcrumbs & Title (text-xl md:text-2xl + h-1 w-12 yellow underline) */}
        <div className="mb-10 md:mb-14 text-center">
          <div className="flex justify-center mb-2">
            <Pulse className="h-5 md:h-6 w-28" />
          </div>
          <div className="h-1 w-12 bg-yellow-400 mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">

          {/* ── Left column ── */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-w-0">
            <div className="flex flex-col h-full">

              {/* Sticky table header (lg+) */}
              <div className="hidden lg:flex sticky top-0 z-20 bg-white border border-gray-100 rounded-xl items-center py-4 px-10 mb-4 shadow-sm">
                <div className="w-[45%]"><Pulse className="h-2.5 w-28" /></div>
                <div className="w-[15%] flex justify-center"><Pulse className="h-2.5 w-10" /></div>
                <div className="w-[20%] flex justify-center"><Pulse className="h-2.5 w-8" /></div>
                <div className="w-[20%] flex justify-end"><Pulse className="h-2.5 w-10" /></div>
              </div>

              {/* CartItem rows */}
              <div className="flex-1 pr-2 space-y-4 pb-4">
                {Array.from({ length: items }).map((_, i) => (
                  <div key={i} className="relative bg-white border border-gray-100 rounded-3xl p-4 lg:p-6">

                    {/* Mobile layout (< lg) */}
                    <div className="lg:hidden">
                      <div className="flex gap-4">
                        {/* Image wrapper with p-2 inner padding + shadow */}
                        <div className="w-20 h-20 bg-white border border-gray-100 p-2 flex items-center justify-center rounded-xl shadow-sm flex-shrink-0">
                          <Pulse className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1 space-y-2">
                          {/* "QUICK ORDER" yellow eyebrow label */}
                          <Pulse className="h-2 w-20" />
                          {/* Name h3 */}
                          <Pulse className="h-3.5 w-3/4" />
                          {/* Meta chips */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Pulse className="h-5 w-16 rounded-lg border border-gray-100" />
                            <Pulse className="h-5 w-16 rounded-lg border border-gray-100" />
                          </div>
                          {/* Unit price row */}
                          <div className="flex items-center justify-between pt-1">
                            <Pulse className="h-3.5 w-16" />
                          </div>
                        </div>
                      </div>
                      {/* Bottom: qty stepper + line total */}
                      <div className="flex items-center justify-between mt-4 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                        <QtyStepper small />
                        <Pulse className="h-3.5 w-16" />
                      </div>
                    </div>

                    {/* Desktop layout (lg+) — 4 columns matching real CartItem */}
                    <div className="hidden lg:flex items-center">
                      {/* w-[45%] : image (p-1.5 inner) + name + meta chips */}
                      <div className="w-[45%] flex items-center gap-4">
                        <div className="w-16 xl:w-20 h-16 xl:h-20 bg-white border border-gray-100 p-1.5 flex items-center justify-center rounded-xl shadow-sm flex-shrink-0">
                          <Pulse className="w-full h-full" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <Pulse className="h-2 w-20" />
                          <Pulse className="h-3.5 w-3/4" />
                          <div className="flex gap-1.5 pt-1">
                            <Pulse className="h-5 w-16 rounded-lg border border-gray-100" />
                            <Pulse className="h-5 w-16 rounded-lg border border-gray-100" />
                          </div>
                        </div>
                      </div>
                      {/* w-[15%] : unit price */}
                      <div className="w-[15%] flex justify-center">
                        <Pulse className="h-3.5 w-16" />
                      </div>
                      {/* w-[20%] : qty stepper */}
                      <div className="w-[20%] flex justify-center">
                        <QtyStepper />
                      </div>
                      {/* w-[20%] : line total */}
                      <div className="w-[20%] flex justify-end pr-4">
                        <Pulse className="h-3.5 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions bar + Multi-Address bar */}
              <div className="mt-6 space-y-4">
                {/* CartActions: bg-gray-50/50 rounded-2xl, 3 small buttons + items count box */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50/50 border border-gray-100 px-5 py-5 rounded-2xl gap-5">
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Real has px-4 py-2 buttons ~= h-[30px] */}
                    <Pulse className="flex-1 md:flex-none h-[30px] w-full md:w-32 rounded-lg" />
                    <Pulse className="flex-1 md:flex-none h-[30px] w-full md:w-32 rounded-lg border border-gray-100" />
                    <Pulse className="flex-1 md:flex-none h-[30px] w-full md:w-32 rounded-lg" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right space-y-1">
                      <Pulse className="h-2 w-16 ml-auto" />
                      <Pulse className="h-2 w-12 ml-auto" />
                    </div>
                    <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center shadow-sm">
                      <Pulse className="h-3 w-3" />
                    </div>
                  </div>
                </div>

                {/* Multi-Address Shipping bar — yellow border + label + yellow button */}
                <div className="border border-[#FFC107] bg-white rounded-xl flex flex-col md:flex-row items-stretch justify-between overflow-hidden shadow-xl shadow-yellow-400/5">
                  <div className="px-6 py-4 flex items-center bg-gray-50/50 flex-1">
                    <Pulse className="h-3 w-44" />
                  </div>
                  {/* Real: py-4 px-10 text-[10px] ≈ h-[52px] */}
                  <Pulse className="h-[52px] md:w-56 rounded-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: sticky CartSummary ── */}
          <div className="lg:col-span-4 xl:col-span-3 z-10 w-full">
            <div className="lg:sticky lg:top-28 self-start bg-white border border-gray-100 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.05)] overflow-hidden">

              {/* Summary header */}
              <div className="bg-[#fcfcfc] px-6 py-4 border-b border-gray-100">
                <Pulse className="h-3 w-28" />
              </div>

              {/* Summary body */}
              <div className="p-4 md:p-6 lg:p-8 space-y-7">

                {/* Subtotal + tax rows */}
                <div className="space-y-3.5">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Pulse className="h-2.5 w-20" />
                      <Pulse className="h-3 w-14" />
                    </div>
                  ))}
                </div>

                {/* Grand total */}
                <div className="pt-5 border-t border-gray-100 flex justify-between items-center">
                  <Pulse className="h-3.5 w-24" />
                  <Pulse className="h-4 w-24" />
                </div>

                {/* Coupon code section */}
                <div className="pt-6 border-t border-gray-100 flex flex-col gap-2">
                  <Pulse className="h-2.5 w-24" />
                  <div className="flex gap-2 items-stretch h-[46px]">
                    <Pulse className="flex-1 rounded border border-gray-200" />
                    <Pulse className="w-20 rounded" />
                  </div>
                </div>

                {/* Checkout button — py-4 text-[12px] ≈ h-[52px] */}
                <div className="pt-2">
                  <Pulse className="w-full h-[52px] rounded" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Checkout Skeleton ────────────────────────────────────────────────────────
// Matches /checkout real layout: back-link + centered title + gradient line ·
// 12-col grid (lg:col-span-8 left / 4 right) · 4 numbered section cards
// (Shipping Address, PO Number, Shipping Method, Payment Method) · sticky
// Order Summary card on the right.
export function CheckoutSkeleton() {
  // One section card with a SectionHeader-style strip (50px) and body
  const SectionCard = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center justify-between h-[50px]">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-black" />
          <Pulse className="h-3 w-32" />
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4 hidden sm:block" />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] text-xs italic-none">
      <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-10 pt-2 md:pt-4">
        {/* Header: back link + centered title + gradient line */}
        <div className="flex flex-col items-center justify-center text-center gap-4 mb-12 relative">
          <div className="lg:absolute left-0 top-1/2 lg:-translate-y-1/2 flex items-center gap-2 mb-4 lg:mb-0">
            <Pulse className="w-8 h-8 rounded-full border border-black !bg-transparent" />
            <Pulse className="hidden sm:block h-3 w-32" />
          </div>
          <div className="flex flex-col items-center gap-4">
            <Pulse className="h-7 md:h-8 w-44" />
            <div className="h-[2px] w-full max-w-[400px] bg-gradient-to-r from-transparent via-[#F5B21B] to-transparent" />
          </div>
        </div>

        {/* 12-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8 items-start">
          {/* Left column — 4 section cards */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Shipping Address — list of address cards */}
            <SectionCard>
              <div className="space-y-3 max-h-[460px] overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 border border-gray-200 bg-white rounded-xl">
                    <Pulse className="w-5 h-5 rounded-full mt-1" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Pulse className="h-4 w-48" />
                      <Pulse className="h-3 w-3/4" />
                      <Pulse className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* 2. PO Number — single input */}
            <SectionCard>
              <Pulse className="h-11 w-full rounded-sm border border-gray-200" />
            </SectionCard>

            {/* 3. Shipping Method — radio rows */}
            <SectionCard>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-sm">
                    <Pulse className="h-4 w-4 rounded-full" />
                    <Pulse className="h-3 flex-1" />
                    <Pulse className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* 4. Payment Method — radio rows */}
            <SectionCard>
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-sm">
                    <Pulse className="h-4 w-4 rounded-full" />
                    <Pulse className="h-3 w-36" />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right column — sticky Order Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-gray-200 shadow-lg rounded-xl sticky top-24 overflow-hidden">
              {/* Header: black check circle + title */}
              <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 border-b border-gray-200">
                <div className="w-5 h-5 rounded-full bg-black" />
                <Pulse className="h-3 w-32" />
              </div>
              {/* Item count + chevron row */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
                <Pulse className="h-4 w-24" />
                <Pulse className="h-5 w-5 rounded" />
              </div>
              {/* Totals area */}
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Pulse className="h-3.5 w-24" />
                    <Pulse className="h-3.5 w-16" />
                  </div>
                ))}
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <Pulse className="h-5 w-20" />
                  <Pulse className="h-5 w-24" />
                </div>
                {/* Place Order button */}
                <Pulse className="h-12 w-full rounded-sm mt-2" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Table Row Skeleton ───────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Pulse className={`h-4 rounded ${i === 0 ? "w-24" : i === cols - 1 ? "w-16" : "w-full"}`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Orders Table Skeleton ────────────────────────────────────────────────────
export function OrdersTableSkeleton({ rows = 8 }: { rows?: number }) {
  // Mirrors the real OrdersTable exactly: a 7-column desktop table (hidden on mobile, full amber
  // header, min-w-[700px]) PLUS a stacked card layout on mobile (md:hidden). Without the mobile
  // cards, small screens showed a wide scrolling table skeleton while the loaded page shows cards.
  return (
    <>
      {/* Desktop table (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#f5a623]">
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-2 lg:px-4 py-3 border border-[#e6950f]/30">
                  <Pulse className="h-3 w-16 rounded bg-black/10" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-gray-200">
                {Array.from({ length: 7 }).map((_, c) => (
                  <td key={c} className="px-2 lg:px-4 py-3 border-r border-gray-200">
                    <Pulse className="h-3 w-full max-w-[90px] rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards (<md) */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Pulse className="h-3.5 w-20 rounded" />
              <Pulse className="h-3 w-16 rounded" />
            </div>
            <Pulse className="h-5 w-24 rounded-full" />
            <div className="flex justify-between"><Pulse className="h-3 w-16 rounded" /><Pulse className="h-3 w-20 rounded" /></div>
            <div className="flex justify-between"><Pulse className="h-3 w-16 rounded" /><Pulse className="h-3 w-24 rounded" /></div>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Pulse className="h-3 w-20 rounded" />
              <Pulse className="h-3 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── My Orders Skeleton ───────────────────────────────────────────────────────
export function MyOrdersSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex-1 w-full px-4 md:px-6 lg:px-8 py-4 md:py-8 lg:py-10">
      {/* Title row + export button */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-10">
        <Pulse className="h-7 md:h-8 w-40 md:w-48" />
        <Pulse className="w-full md:w-44 h-10 rounded-sm border-2 border-[#F5B21B]" />
      </div>
      {/* Filter bar: STATUS dropdown + ORDER # search + Search/Reset buttons (matches Filters) */}
      <div className="bg-white border border-gray-100 p-4 md:p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex flex-col gap-1.5 w-full md:w-48">
            <Pulse className="h-3 w-24 rounded" />
            <Pulse className="h-10 w-full rounded-sm" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <Pulse className="h-3 w-28 rounded" />
            <Pulse className="h-10 w-full rounded-sm" />
          </div>
          <Pulse className="h-10 w-full md:w-24 rounded-sm" />
          <Pulse className="h-10 w-full md:w-24 rounded-sm" />
        </div>
      </div>
      {/* Orders table */}
      <OrdersTableSkeleton rows={rows} />
    </div>
  );
}

// ─── Order Detail Skeleton ────────────────────────────────────────────────────
export function OrderDetailSkeleton() {
  return (
    <div className="flex-1 w-full px-4 md:px-6 lg:px-8 py-10 min-w-0 text-xs space-y-10">
      {/* Header Section */}
      <div className="flex flex-col mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-10 border-b-2 border-yellow-400 pb-2 gap-2 sm:gap-0 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <Pulse className="h-8 w-56 rounded bg-black/10" />
            <Pulse className="h-6 w-20 rounded-full" />
          </div>
          <Pulse className="h-4 w-32 rounded" />
        </div>
        <div className="flex flex-col sm:flex-row justify-start items-stretch sm:items-center gap-3 w-full">
          <Pulse className="h-10 w-full sm:w-32 rounded" />
          <Pulse className="h-10 w-full sm:w-36 rounded" />
        </div>
      </div>

      {/* Items Ordered Table */}
      <div className="bg-white rounded-md border border-[#ebebeb] overflow-hidden mb-10 shadow-sm">
        <div className="border-b border-[#ebebeb] px-3 md:px-6 py-3 md:py-4 bg-gray-50">
          <Pulse className="h-4 w-32 rounded" />
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-gray-50/50 border-b border-[#ebebeb]">
              <tr>
                <th className="px-3 md:px-6 py-3 md:py-4"><Pulse className="h-3 w-28 rounded" /></th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-center"><Pulse className="h-3 w-16 mx-auto rounded" /></th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-center"><Pulse className="h-3 w-16 mx-auto rounded" /></th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-center"><Pulse className="h-3 w-10 mx-auto rounded" /></th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-right"><Pulse className="h-3 w-20 ml-auto rounded" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              {Array.from({ length: 3 }).map((_, idx) => (
                <tr key={idx} className={idx % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-3 md:px-6 py-3 md:py-5"><Pulse className="h-3 w-48 rounded" /></td>
                  <td className="px-3 md:px-6 py-3 md:py-5 text-center"><Pulse className="h-3 w-24 mx-auto rounded" /></td>
                  <td className="px-3 md:px-6 py-3 md:py-5 text-center"><Pulse className="h-3 w-16 mx-auto rounded" /></td>
                  <td className="px-3 md:px-6 py-3 md:py-5 text-center"><Pulse className="h-3 w-8 mx-auto rounded" /></td>
                  <td className="px-3 md:px-6 py-3 md:py-5 text-right"><Pulse className="h-3 w-20 ml-auto rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[#ebebeb]">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className={`p-4 space-y-3 ${idx % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}`}>
              <Pulse className="h-4 w-3/4 rounded" />
              <Pulse className="h-3 w-1/3 rounded" />
              <div className="flex justify-between items-center">
                <Pulse className="h-3 w-16 rounded" />
                <Pulse className="h-3 w-12 rounded" />
              </div>
              <div className="flex justify-between items-center">
                <Pulse className="h-3 w-12 rounded" />
                <Pulse className="h-3 w-8 rounded" />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <Pulse className="h-3.5 w-16 rounded" />
                <Pulse className="h-3.5 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
        {/* Order Summary */}
        <div className="flex justify-end p-4 md:p-8 bg-gray-50/30 border-t border-[#ebebeb]">
          <div className="w-full max-w-[340px] space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Pulse className="h-3.5 w-24 rounded" />
                <Pulse className="h-3.5 w-20 rounded" />
              </div>
            ))}
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex justify-between items-center">
              <Pulse className="h-4 w-28 rounded" />
              <Pulse className="h-4 w-24 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Information Section */}
      <div className="mb-10">
        <div className="border-b-2 border-yellow-400 inline-block pb-1 mb-10">
          <Pulse className="h-5 w-40 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#ebebeb] rounded-md shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-[#ebebeb]">
                <Pulse className="h-3 w-32 rounded" />
              </div>
              <div className="p-4 md:p-6 space-y-2 min-h-[140px]">
                <Pulse className="h-3.5 w-48 rounded" />
                <Pulse className="h-3 w-3/4 rounded" />
                <Pulse className="h-3 w-2/3 rounded" />
                <Pulse className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Attachments Section */}
      <div className="mb-12">
        <div className="border-b-2 border-yellow-400 inline-block pb-1 mb-10">
          <Pulse className="h-5 w-44 rounded" />
        </div>
        <div className="bg-white border border-[#ebebeb] rounded-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-50 border-b border-[#ebebeb]">
                <tr className="h-[50px]">
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left"><Pulse className="h-3.5 w-20 rounded" /></th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-center"><Pulse className="h-3.5 w-12 mx-auto rounded" /></th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-center"><Pulse className="h-3.5 w-20 mx-auto rounded" /></th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-center"><Pulse className="h-3.5 w-20 mx-auto rounded" /></th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-center"><Pulse className="h-3.5 w-16 mx-auto rounded" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className={idx % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-3 md:px-6 py-3 md:py-5 text-left"><Pulse className="h-3 w-36 rounded" /></td>
                    <td className="px-3 md:px-6 py-3 md:py-5 text-center"><Pulse className="h-3 w-16 mx-auto rounded" /></td>
                    <td className="px-3 md:px-6 py-3 md:py-5 text-center"><Pulse className="h-3 w-20 mx-auto rounded" /></td>
                    <td className="px-3 md:px-6 py-3 md:py-5 text-center"><Pulse className="h-3 w-20 mx-auto rounded" /></td>
                    <td className="px-3 md:px-6 py-3 md:py-5 text-center"><Pulse className="h-5 w-16 mx-auto rounded-full" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Dashboard Skeleton ───────────────────────────────────────────────────────
export function DashboardSkeleton() {
  // Mirror the real /customer/dashboard default (non-compare) view: full-width compare bar,
  // two full-width 3-card stat grids, and a full-width 2-col bottom-filter grid. Cards use
  // gray-50 headers + #ebebeb borders (NOT amber). Container is max-w-[1240px] mx-auto.
  return (
    <div className="flex-1 p-4 md:p-8 lg:p-10 bg-[#fcfcfc] min-h-0 font-rubik">
      <div className="max-w-[1240px] mx-auto space-y-12">
        {/* Title with gradient line */}
        <div className="flex items-center gap-4 mb-2">
          <Pulse className="h-7 w-40" />
          <div className="h-[2px] flex-1 bg-gradient-to-r from-yellow-400 to-transparent" />
        </div>

        {/* Compare section — full width */}
        <section className="bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50/80 p-4 px-6 border-b border-[#ebebeb] flex items-center gap-3">
            <Pulse className="h-[18px] w-[18px] rounded-sm" />
            <Pulse className="h-3.5 w-24" />
          </div>
          <div className="p-8 px-8 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
            <Pulse className="flex-1 h-11 w-full rounded-lg" />
            <Pulse className="h-7 w-14 rounded-full shrink-0" />
            <Pulse className="flex-1 h-11 w-full rounded-lg" />
          </div>
        </section>

        {/* TOTAL ORDER QTY (text-4xl) + TOTAL ORDER VALUE (text-2xl) — each a full-width 3-card grid */}
        {Array.from({ length: 2 }).map((_, sectionIdx) => {
          const valueHeight = sectionIdx === 0 ? "h-9 w-28" : "h-7 w-32";
          return (
            <section key={sectionIdx}>
              <div className="flex items-center gap-4 mb-6">
                <Pulse className="h-5 w-48" />
                <div className="h-[2px] w-12 bg-yellow-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 h-10 px-5 flex justify-between items-center border-b border-[#ebebeb]">
                      <Pulse className="h-3 w-20" />
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    </div>
                    <div className="py-10 px-4 flex justify-center">
                      <Pulse className={valueHeight} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Bottom filters — full-width 2-col grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Pulse className="h-3.5 w-32" />
              <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 border-b border-[#ebebeb] h-12 px-5 flex items-center">
                  <Pulse className="h-4 w-40" />
                </div>
                <div className="py-8 px-6 flex justify-center">
                  <Pulse className="h-9 w-20" />
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

// ─── Search Results Skeleton ──────────────────────────────────────────────────
export function SearchResultsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Pulse className="h-10 w-10 flex-shrink-0 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Pulse className="h-3.5 w-3/4 rounded" />
            <Pulse className="h-3 w-1/3 rounded" />
          </div>
          <Pulse className="h-4 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Wishlist / Favorites Skeleton ────────────────────────────────────────────
export function WishlistSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Favourite Products Skeleton ──────────────────────────────────────────────
export function FavouriteProductsSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="w-full font-rubik">
      {/* Title — centered h1 (text-[20px] md:text-[26px]), NO gradient divider. The page
          passes a valid <h1 text-center> element as title, so the real component renders it
          full-width-centered and omits the gradient line. */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 flex justify-center">
          <Pulse className="h-6 md:h-7 w-56" />
        </div>
      </div>

      {/* Mobile/Tablet card grid (xl:hidden) — matches the real card: info column + 14×14
          image on the right, then a border-t price/actions row (cart + remove buttons). */}
      <div className="xl:hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-col gap-2">
            <div className="flex gap-3">
              <div className="flex-1 min-w-0 space-y-1.5">
                <Pulse className="h-2.5 w-16" />
                <Pulse className="h-3 w-32" />
                <div className="flex items-center gap-1.5">
                  <Pulse className="h-3 w-20" />
                  <Pulse className="h-4 w-4 rounded-full" />
                  <Pulse className="h-2.5 w-12" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Pulse className="h-2 w-2 rounded-full" />
                  <Pulse className="h-2.5 w-16" />
                </div>
              </div>
              <Pulse className="w-14 h-14 flex-shrink-0 rounded-lg" />
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-1 gap-2">
              <Pulse className="h-3.5 w-16" />
              <div className="flex items-center gap-1 flex-shrink-0">
                <Pulse className="h-9 w-12 rounded-lg" />
                <Pulse className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table (xl+) — 10 columns, wrapped in the real card chrome
          (bg-white rounded-xl shadow-sm border #ebebeb), table-fixed min-w-[950px]. */}
      <div className="hidden xl:flex flex-col bg-white rounded-xl shadow-sm border border-[#ebebeb] overflow-hidden">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse table-fixed min-w-[950px]">
            <colgroup>
              {["10%", "12%", "15%", "6%", "10%", "6%", "4%", "11%", "13%", "13%"].map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-gray-50/80 h-[60px] border-b border-[#ebebeb]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <th key={i} className="px-2 md:px-4 text-center">
                    <Pulse className="h-3 w-12 mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="h-[60px]">
                  <td className="px-2 md:px-4 text-center"><Pulse className="h-3 w-12 mx-auto" /></td>
                  <td className="px-2 md:px-4 text-center"><Pulse className="h-3 w-16 mx-auto" /></td>
                  <td className="px-2 md:px-4 text-center"><Pulse className="h-3 w-20 mx-auto" /></td>
                  <td className="px-2 md:px-4 text-center"><Pulse className="h-3 w-10 mx-auto" /></td>
                  <td className="px-2 md:px-4 text-center"><Pulse className="h-3 w-12 mx-auto" /></td>
                  <td className="px-2 md:px-4 text-center"><Pulse className="w-10 h-10 mx-auto rounded-sm" /></td>
                  <td className="px-2 md:px-4 text-center"><Pulse className="h-3 w-8 mx-auto" /></td>
                  <td className="px-2 md:px-4 text-center"><Pulse className="h-3 w-14 mx-auto" /></td>
                  <td className="px-2 md:px-4 text-center"><Pulse className="h-3 w-16 mx-auto" /></td>
                  <td className="px-2 md:px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Pulse className="w-8 h-8 rounded-md" />
                      <Pulse className="w-8 h-8 rounded-md" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination — mirrors <Pagination/> (shown when totalCount > pageSize): page-size
          selector (left) · round page buttons (center) · "showing X-Y of Z" (right). */}
      <div className="mt-0 w-full">
        <div className="w-full flex flex-col md:flex-row items-center justify-between py-3 md:py-4 px-1 gap-6 mt-4 border-t border-gray-100">
          <div className="md:w-[180px] flex justify-center md:justify-start order-1">
            <Pulse className="h-9 w-[120px] rounded" />
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 order-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Pulse key={i} className="h-9 w-9 md:h-10 md:w-10 rounded-full" />
            ))}
          </div>
          <div className="md:w-[220px] flex justify-center md:justify-end order-3">
            <Pulse className="h-3.5 w-40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Skeleton ───────────────────────────────────────────────────
export function NotificationsSkeleton({ count = 15 }: { count?: number }) {
  // Content-only (heading + bordered container with the 4-col table / mobile cards / gray
  // pagination panel). NO outer padding — the single caller wraps it in the real page's
  // <main px-4 md:px-6 lg:px-8> inside <div md:py-7>, so the route-level fallback, the
  // page's initial-load skeleton, and the loaded page all share one identical wrapper.
  // Default count = the page's default pageSize (15) so the skeleton fills the full page and
  // the row count matches the first page of data → no vertical jump when data arrives.
  return (
    <div className="w-full">
      {/* Title */}
      <Pulse className="h-7 md:h-8 w-48 rounded mb-6 md:mb-10" />

      <div className="border border-[#ebebeb] rounded-sm overflow-hidden shadow-sm">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[600px]">
            <thead>
              <tr className="border-b border-[#ebebeb]">
                <th className="px-6 py-4 text-center w-[15%] border-r border-[#ebebeb]"><Pulse className="h-3 w-16 mx-auto rounded" /></th>
                <th className="px-6 py-4 text-center w-[20%] border-r border-[#ebebeb]"><Pulse className="h-3 w-16 mx-auto rounded" /></th>
                <th className="px-6 py-4 text-center w-[45%] border-r border-[#ebebeb]"><Pulse className="h-3 w-24 mx-auto rounded" /></th>
                <th className="px-6 py-4 text-center w-[20%]"><Pulse className="h-3 w-16 mx-auto rounded" /></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="border-b border-[#ebebeb] last:border-0">
                  <td className="px-6 py-6 border-r border-[#ebebeb]"><Pulse className="h-3 w-28 mx-auto rounded" /></td>
                  <td className="px-6 py-6 border-r border-[#ebebeb]"><Pulse className="h-3 w-32 mx-auto rounded" /></td>
                  <td className="px-6 py-6 border-r border-[#ebebeb]"><Pulse className="h-3 w-full rounded" /></td>
                  <td className="px-6 py-6"><Pulse className="h-3 w-20 mx-auto rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
            <div key={i} className="p-4 border-b border-[#ebebeb] last:border-0 bg-white">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Pulse className="h-3.5 w-32 rounded" />
                <Pulse className="h-3 w-16 rounded flex-shrink-0" />
              </div>
              <Pulse className="h-3 w-full rounded mb-1" />
              <Pulse className="h-3 w-2/3 rounded mb-3" />
              <div className="flex items-center gap-3">
                <Pulse className="h-3 w-20 rounded" />
                <Pulse className="h-3 w-14 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination panel — matches the real footer: items-count (left) · prev + page
            buttons + next, all w-10 h-10 round (center) · "Show [size] per page" (right). */}
        <div className="bg-[#e8e8e8] px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 border-t border-[#dddddd]">
          <Pulse className="h-3.5 w-44 rounded order-2 lg:order-1" />
          <div className="flex items-center gap-3 order-1 lg:order-2">
            <Pulse className="w-10 h-10 rounded-full" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Pulse key={i} className="w-10 h-10 rounded-full" />
              ))}
            </div>
            <Pulse className="w-10 h-10 rounded-full" />
          </div>
          <div className="flex items-center gap-3 order-3">
            <Pulse className="h-3.5 w-10 rounded" />
            <Pulse className="h-9 w-16 rounded" />
            <Pulse className="h-3.5 w-14 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Form Skeleton ────────────────────────────────────────────────────────────
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Pulse className="h-4 w-28 rounded" />
          <Pulse className="h-10 w-full rounded-sm" />
        </div>
      ))}
      <Pulse className="h-11 w-36 rounded-sm mt-2" />
    </div>
  );
}

// ─── Credit Limit Skeleton ────────────────────────────────────────────────────
export function CreditLimitSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Pulse className="h-4 w-32 rounded" />
      <Pulse className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Pulse className="h-3 w-20 rounded" />
        <Pulse className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}

// ─── Forecast Skeleton ────────────────────────────────────────────────────────
export function ForecastSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex-1 w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-10 bg-[#fcfcfc] min-w-0">
      {/* Header: title + refresh button */}
      <div className="flex justify-between items-center mb-6 md:mb-10">
        <Pulse className="h-7 md:h-8 w-40" />
        <Pulse className="h-9 w-28 rounded-sm border border-gray-200" />
      </div>

      {/* "Upload Forecast" section h2 */}
      <Pulse className="h-4 md:h-5 w-44 mb-3 md:mb-4" />

      {/* Upload card */}
      <div className="bg-white border border-gray-200 rounded-sm mb-8 md:mb-12 shadow-sm overflow-hidden">
        {/* Dashed drop zone */}
        <div className="p-4 md:p-8">
          <div className="border-2 border-dashed border-gray-200 rounded-sm bg-[#f9f9f9] px-4 md:px-6 py-6 md:py-8 flex flex-col items-center gap-4 md:gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Pulse className="h-4 md:h-5 w-36" />
              <Pulse className="h-8 w-28 rounded-sm border border-gray-400" />
            </div>
            <Pulse className="h-3 md:h-4 w-72" />
          </div>
        </div>
        {/* Submit button row */}
        <div className="bg-white px-4 md:px-8 pb-4 md:pb-8 flex justify-center md:justify-end">
          <Pulse className="w-full sm:w-44 h-10 rounded-sm" />
        </div>
      </div>

      {/* Desktop table header */}
      <div className="hidden sm:grid grid-cols-2 bg-[#fcfcfc] border border-gray-200 py-3 md:py-4 mb-2">
        <div className="px-4 md:px-6"><Pulse className="h-3 w-24" /></div>
        <div className="px-4 md:px-6 text-center border-l border-gray-200">
          <Pulse className="h-3 w-28 mx-auto" />
        </div>
      </div>
      {/* Mobile header */}
      <div className="sm:hidden bg-[#fcfcfc] border border-gray-200 py-3 mb-2 px-4">
        <Pulse className="h-3 w-16" />
      </div>

      {/* Files list rows */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-sm overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b border-gray-50 grid grid-cols-1 sm:grid-cols-2 px-4 md:px-6 py-3 md:py-4 gap-2">
            <Pulse className="h-4 w-48 sm:w-56" />
            <Pulse className="h-4 w-32 sm:mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Statement Skeleton ───────────────────────────────────────────────────────
export function StatementSkeleton() {
  return (
    <div className="flex-1 w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-10">
      {/* Title */}
      <Pulse className="h-7 md:h-8 w-40 mb-6 md:mb-10" />

      {/* Form card */}
      <div className="max-w-[700px] bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        {/* Card header strip */}
        <div className="bg-[#f8f8f8] px-6 py-3 border-b border-gray-200">
          <Pulse className="h-5 w-44" />
        </div>
        {/* Card body */}
        <div className="p-4 md:p-8">
          {/* Date inputs (2 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
            <div className="space-y-2">
              <Pulse className="h-4 w-24" />
              <Pulse className="w-full h-[45px] border border-gray-200 rounded-sm" />
            </div>
            <div className="space-y-2">
              <Pulse className="h-4 w-24" />
              <Pulse className="w-full h-[45px] border border-gray-200 rounded-sm" />
            </div>
          </div>
          {/* Statement type dropdown */}
          <div className="mb-6 md:mb-10 space-y-2">
            <Pulse className="h-4 w-16" />
            <Pulse className="w-full h-[45px] border border-gray-200 rounded-sm" />
          </div>
          {/* Download button */}
          <Pulse className="w-full sm:w-48 h-12 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

// ─── Quick Order Skeleton ─────────────────────────────────────────────────────
// Mirrors /quick-order 1:1 — bg-white pb-32, max-w-[1400px] px-4 lg:px-14,
// top header (title + 2 black buttons), instant-search bar, order table with
// sticky thead + 5 columns (items 45% / SKU / qty / total / action) + summary
// bar with grand-total + 2 buttons, then yellow-bordered "Add Multiple" h2 +
// 2-col boxes (SKU textarea + CSV upload) and a Clear-All button.
export function QuickOrderSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-14">

        {/* Top header — title + 2 buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-10 gap-4 md:gap-6">
          <Pulse className="h-7 sm:h-8 md:h-10 w-44 md:w-56" />
          <div className="flex gap-3 md:gap-4 w-full sm:w-auto">
            <Pulse className="flex-1 sm:flex-none h-[38px] md:h-[40px] w-full sm:w-32 rounded-sm" />
            <Pulse className="flex-1 sm:flex-none h-[38px] md:h-[40px] w-full sm:w-32 rounded-sm" />
          </div>
        </div>

        {/* Instant search bar */}
        <div className="mb-8 md:mb-14">
          <Pulse className="w-full h-12 md:h-14 rounded-sm border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]" />
        </div>

        {/* Order Table */}
        <div className="bg-white border border-gray-100 rounded-sm shadow-[0_2px_15px_rgba(0,0,0,0.03)] overflow-hidden mb-20 flex flex-col">
          {/* Desktop table — 5 cols: items (45%) · skus · qty · total · action */}
          <div className="hidden md:block max-h-[600px] overflow-y-auto border-b border-gray-50">
            <table className="w-full border-collapse">
              <colgroup>
                <col style={{ width: "45%" }} />
                <col /><col /><col /><col />
              </colgroup>
              <thead className="sticky top-0 z-20 bg-white">
                <tr className="border-b-2 border-gray-50 bg-white">
                  <th className="px-6 lg:px-8 py-4 ltr:text-left rtl:text-right"><Pulse className="h-3 w-16" /></th>
                  <th className="px-4 lg:px-6 py-4 text-center"><Pulse className="h-3 w-12 mx-auto" /></th>
                  <th className="px-4 lg:px-6 py-4 text-center"><Pulse className="h-3 w-10 mx-auto" /></th>
                  <th className="px-6 lg:px-8 py-4 ltr:text-right rtl:text-left"><Pulse className="h-3 w-20 ml-auto" /></th>
                  <th className="px-4 lg:px-6 py-4 text-center"><Pulse className="h-3 w-14 mx-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 lg:px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white border border-gray-50 rounded flex items-center justify-center flex-shrink-0">
                          <Pulse className="w-7 h-7" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <Pulse className="h-3.5 w-32" />
                          <Pulse className="h-2.5 w-48 max-w-full" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4"><Pulse className="h-3 w-20 mx-auto" /></td>
                    <td className="px-4 lg:px-6 py-4"><Pulse className="w-14 h-10 mx-auto rounded-sm border border-gray-100" /></td>
                    <td className="px-6 lg:px-8 py-4"><Pulse className="h-3.5 w-20 ml-auto" /></td>
                    <td className="px-4 lg:px-6 py-4"><Pulse className="w-10 h-10 mx-auto rounded-full" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-b border-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-white border border-gray-50 rounded flex items-center justify-center flex-shrink-0">
                    <Pulse className="w-9 h-9" />
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <Pulse className="h-3 w-24" />
                    <Pulse className="h-3 w-40 max-w-full" />
                    <div className="flex items-center justify-between mt-3">
                      <Pulse className="w-14 h-8 rounded-sm" />
                      <Pulse className="h-3.5 w-16" />
                    </div>
                  </div>
                  <Pulse className="w-10 h-10 rounded-full flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {/* Summary bar — grand total + 2 buttons */}
          <div className="px-4 md:px-8 py-4 md:py-6 bg-white border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-start">
              <Pulse className="h-2.5 w-24" />
              <Pulse className="h-6 md:h-7 w-28 md:w-32" />
            </div>
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              <Pulse className="flex-1 md:flex-none h-[44px] md:h-[48px] w-full md:w-40 rounded-sm border-2 border-gray-200" />
              <Pulse className="flex-1 md:flex-none h-[44px] md:h-[48px] w-full md:w-40 rounded-sm" />
            </div>
          </div>
        </div>

        {/* "Add Multiple Products" section h2 — yellow-400 left border */}
        <div className="mb-6 md:mb-10 border-l-[6px] border-yellow-400 pl-4 md:pl-6">
          <Pulse className="h-6 md:h-8 w-64 md:w-80" />
        </div>

        {/* 2-col boxes: SKU textarea + file upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 mb-12 md:mb-20">
          {/* SKU textarea box */}
          <div className="bg-white border border-gray-100 rounded-sm shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 md:p-10 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Pulse className="h-[18px] w-[18px]" />
              <Pulse className="h-4 w-36" />
            </div>
            <Pulse className="w-full h-48 mb-6 rounded-sm border border-gray-100 bg-gray-50/30" />
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto">
              <Pulse className="h-7 w-44 rounded-full" />
              <Pulse className="w-full sm:w-40 h-[40px] rounded-sm" />
            </div>
          </div>

          {/* CSV upload box */}
          <div className="bg-white border border-gray-100 rounded-sm shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 md:p-10 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Pulse className="h-[18px] w-[18px]" />
              <Pulse className="h-4 w-36" />
            </div>
            <div className="flex-1 mb-8">
              <Pulse className="w-full h-[132px] rounded-sm border-2 border-dashed border-gray-100 bg-gray-50/30" />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <Pulse className="h-3.5 w-40" />
              <Pulse className="w-full sm:w-40 h-[40px] rounded-sm" />
            </div>
          </div>
        </div>

        {/* Clear all button — circle X icon + label */}
        <div className="flex justify-center md:justify-end mb-12 md:mb-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-2 border-black rounded-full flex items-center justify-center">
              <Pulse className="w-5 h-5 rounded" />
            </div>
            <Pulse className="h-3.5 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Attachments Skeleton ───────────────────────────────────────────────
// Table-only attachments skeleton (desktop 6-col table + mobile cards). Used both inside the
// full-page OrderAttachmentsSkeleton AND directly in the page's table slot (where the real
// heading/search/filters already render) — so the two never duplicate that chrome.
// Matches the real table: 6 cols, gray-50 header (NOT amber), #ebebeb borders, h-[50px]
// header row, px-6 py-4 cells, alternating row bg, overflow-x-auto, full width.
export function OrderAttachmentsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto w-full border border-[#ebebeb] rounded-md shadow-sm">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-gray-50 border-b border-[#ebebeb]">
            <tr className="h-[50px]">
              {["w-16", "w-32", "w-20", "w-24", "w-20", "w-20"].map((w, i) => (
                <th key={i} className="px-6 py-3">
                  <Pulse className={`h-3 ${w} ${i === 0 || i === 2 ? "mx-auto" : ""}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b border-[#ebebeb]`}>
                <td className="px-6 py-4"><Pulse className="h-3 w-16 mx-auto" /></td>
                <td className="px-6 py-4"><Pulse className="h-3 w-40" /></td>
                <td className="px-6 py-4"><Pulse className="h-3 w-20 mx-auto" /></td>
                <td className="px-6 py-4"><Pulse className="h-3 w-24" /></td>
                <td className="px-6 py-4"><Pulse className="h-3 w-20" /></td>
                <td className="px-6 py-4"><Pulse className="h-6 w-16 rounded-md" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white border border-[#ebebeb] rounded-md p-4 shadow-sm space-y-2">
            <div className="flex justify-between">
              <Pulse className="h-3 w-24" />
              <Pulse className="h-3 w-16" />
            </div>
            <Pulse className="h-3 w-48" />
            <Pulse className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Pagination — mirrors the real <Pagination/>: page-size selector (left) · round
          page buttons (center) · "showing X-Y of Z" (right), with the same mt-8 + border-t. */}
      <div className="mt-8 flex justify-center">
        <div className="w-full flex flex-col md:flex-row items-center justify-between py-3 md:py-4 px-1 gap-6 mt-4 border-t border-gray-100">
          <div className="md:w-[180px] flex justify-center md:justify-start order-1">
            <Pulse className="h-9 w-[120px] rounded" />
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 order-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Pulse key={i} className="h-9 w-9 md:h-10 md:w-10 rounded-full" />
            ))}
          </div>
          <div className="md:w-[220px] flex justify-center md:justify-end order-3">
            <Pulse className="h-3.5 w-40 rounded" />
          </div>
        </div>
      </div>
    </>
  );
}

export function OrderAttachmentsSkeleton({ rows = 6 }: { rows?: number }) {
  // Root padding mirrors the real <main>: px-4 md:px-6 lg:px-8 py-10.
  return (
    <div className="flex-1 w-full px-4 md:px-6 lg:px-8 py-10">
      {/* Title */}
      <Pulse className="h-7 md:h-8 w-48 mb-6 md:mb-10" />

      {/* Search row (input + button) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6 md:mb-8">
        <Pulse className="w-full sm:w-[200px] h-[40px] rounded-md border border-[#ebebeb]" />
        <Pulse className="w-full sm:w-24 h-[40px] rounded-md" />
      </div>

      {/* Filters card (2 dropdowns + reset) */}
      <div className="bg-white border border-[#ebebeb] rounded-md p-4 md:p-6 mb-6 md:mb-10 flex flex-col sm:flex-row gap-4 items-end shadow-sm">
        <div className="w-full sm:w-auto sm:min-w-[200px] space-y-2">
          <Pulse className="h-3 w-28" />
          <Pulse className="w-full h-[40px] rounded-md border border-gray-300" />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[200px] space-y-2">
          <Pulse className="h-3 w-28" />
          <Pulse className="w-full h-[40px] rounded-md border border-gray-300" />
        </div>
        <Pulse className="w-full sm:w-32 h-[40px] rounded-md" />
      </div>

      <OrderAttachmentsTableSkeleton rows={rows} />
    </div>
  );
}

// ─── Multi-Location Delivery (selection page) Skeleton ───────────────────────
// Matches /multi-location-delivery layout: centered title + bordered table with
// product rows × address columns (qty inputs) + gray footer actions bar.
export function MultiLocationDeliverySkeleton({ rows = 4, addresses = 3 }: { rows?: number; addresses?: number }) {
  const headerColCount = 2 + addresses + 1; // product + cartQty + N addresses + validation
  return (
    <div className="bg-white min-h-screen font-sans pb-16 md:pb-32">
      <div className="max-w-[1920px] mx-auto py-6 sm:py-8 md:py-12 px-3 sm:px-6 lg:px-10">
        {/* Centered heading */}
        <div className="text-center mb-6 md:mb-10">
          <Pulse className="h-6 md:h-7 w-72 md:w-96 mx-auto" />
        </div>

        {/* Main table */}
        <div className="relative border border-gray-300 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-spacing-0 min-w-max">
              <thead>
                <tr>
                  <th className="py-3 md:py-4 px-3 md:px-5 border-r border-b border-gray-300 w-[160px] md:w-[220px] bg-white">
                    <Pulse className="h-3 w-20" />
                  </th>
                  <th className="py-3 md:py-4 px-2 md:px-4 border-r border-b border-gray-300 w-[80px] md:w-[110px] bg-white">
                    <Pulse className="h-3 w-12 mx-auto" />
                  </th>
                  <th className="py-3 md:py-4 px-2 md:px-4 border-b border-gray-300 bg-white" colSpan={addresses + 1}>
                    <Pulse className="h-3 w-24 mx-auto" />
                  </th>
                </tr>
                <tr>
                  <th className="py-3 md:py-4 border-r border-b border-gray-300 bg-white">
                    <Pulse className="h-3 w-8 mx-auto" />
                  </th>
                  {Array.from({ length: addresses }).map((_, i) => (
                    <th key={i} className="py-3 md:py-4 px-2 md:px-4 border-r border-b border-gray-300 bg-white min-w-[100px] md:min-w-[150px]">
                      <Pulse className="h-3 w-20 mx-auto" />
                    </th>
                  ))}
                  <th className="border-b border-gray-300 bg-white min-w-[90px] md:min-w-[140px]" />
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-300 last:border-b-0">
                    <td className="py-3 md:py-6 px-3 md:px-5 border-r border-gray-300 align-middle">
                      <Pulse className="h-4 w-48 max-w-full" />
                    </td>
                    <td className="py-3 md:py-6 px-2 md:px-4 border-r border-gray-300 align-middle">
                      <div className="flex flex-col items-center gap-1.5">
                        <Pulse className="h-2.5 w-8" />
                        <Pulse className="h-7 w-12 rounded-sm" />
                      </div>
                    </td>
                    {Array.from({ length: addresses }).map((_, j) => (
                      <td key={j} className="py-3 md:py-6 px-2 md:px-4 border-r border-gray-300 align-middle">
                        <Pulse className="h-9 w-14 mx-auto rounded-sm border border-gray-200" />
                      </td>
                    ))}
                    <td className="py-3 md:py-6 px-2 md:px-4 align-middle bg-white" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions bar */}
        <div className="mt-6 md:mt-8 bg-[#f2f2f2] p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 border border-gray-100">
          <Pulse className="w-full sm:w-44 h-12 rounded-none" />
          <Pulse className="w-full sm:w-56 h-12 rounded-none" />
        </div>
      </div>
    </div>
  );
}

// ─── Multi-Location Delivery / Billing Skeleton ──────────────────────────────
// Matches /multi-location-delivery/billing: max-w-[1240px] pt-8 md:pt-16,
// title with large bottom margin, 2-column grid (billing address +
// payment method) with bg-[#e9e9e9] header strips on white cards.
export function MultiLocationBillingSkeleton() {
  return (
    <div className="bg-white min-h-screen font-sans pb-10 md:pb-20">
      <div className="max-w-[1440px] mx-auto pt-8 md:pt-16 px-3 sm:px-4">
        {/* Centered title */}
        <div className="flex justify-center mb-8 md:mb-16">
          <Pulse className="h-7 md:h-8 w-56 md:w-72" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
          {/* Billing Address card */}
          <div className="flex flex-col bg-white border border-[#f0f0f0] shadow-sm">
            <div className="bg-[#e9e9e9] py-3 px-4 md:px-6 text-center">
              <Pulse className="h-3 w-32 mx-auto" />
            </div>
            <div className="p-5 md:p-10 flex-grow min-h-[200px] md:min-h-[300px] space-y-2">
              <Pulse className="h-4 w-3/4" />
              <Pulse className="h-3.5 w-2/3" />
              <Pulse className="h-3.5 w-1/2" />
              <Pulse className="h-3.5 w-2/3" />
              <Pulse className="h-3.5 w-1/3" />
              <Pulse className="h-3.5 w-1/2 mt-4" />
            </div>
          </div>

          {/* Payment Method card */}
          <div className="flex flex-col bg-white border border-[#f0f0f0] shadow-sm">
            <div className="bg-[#e9e9e9] py-3 px-4 md:px-6 text-center">
              <Pulse className="h-3 w-32 mx-auto" />
            </div>
            <div className="p-5 md:p-10 flex-grow min-h-[200px] md:min-h-[300px] space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Pulse className="h-4 w-4 rounded-full" />
                  <Pulse className="h-3.5 w-36" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-[#f2f2f2] p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <Pulse className="w-full sm:w-44 h-12 rounded-none" />
          <Pulse className="w-full sm:w-48 h-12 rounded-none" />
        </div>
      </div>
    </div>
  );
}

// ─── Multi-Location Delivery / Shipping Skeleton ─────────────────────────────
// Matches /multi-location-delivery/shipping: max-w-[1200px] pt-6 md:pt-10,
// title tight, repeated address groups each with "Address X of Y" sub-header
// and 2-column grid (shipping address + items table) using bg-[#dadada]
// header strips on bg-[#f2f2f2] cards.
export function MultiLocationShippingSkeleton({ groups = 1 }: { groups?: number }) {
  return (
    <div className="bg-white min-h-screen font-sans pb-10 md:pb-20">
      <div className="max-w-[1440px] mx-auto pt-6 md:pt-10 px-3 sm:px-4">
        {/* Centered title */}
        <div className="flex justify-center mb-2 md:mb-3">
          <Pulse className="h-6 md:h-7 w-48 md:w-64" />
        </div>

        <div className="space-y-4 md:space-y-6">
          {Array.from({ length: groups }).map((_, g) => (
            <div key={g} className="space-y-4">
              {/* "Address X of Y" sub-header */}
              <div className="flex justify-center">
                <Pulse className="h-3 w-40" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Shipping To card */}
                <div className="bg-[#f2f2f2] min-h-[200px] md:min-h-[250px] flex flex-col">
                  <div className="bg-[#dadada] py-2.5 px-4 md:px-6 text-center">
                    <Pulse className="h-3 w-28 mx-auto" />
                  </div>
                  <div className="p-5 md:p-10 space-y-1.5 flex-grow">
                    <Pulse className="h-3.5 w-2/3" />
                    <Pulse className="h-3.5 w-1/2" />
                    <Pulse className="h-3.5 w-3/4" />
                    <Pulse className="h-3.5 w-1/2" />
                    <Pulse className="h-3.5 w-1/3" />
                    <Pulse className="h-3.5 w-1/2 mt-4" />
                  </div>
                </div>

                {/* Items card (with mini table + shipping method radios) */}
                <div className="bg-[#f2f2f2] min-h-[200px] md:min-h-[250px] flex flex-col">
                  <div className="bg-[#dadada] py-2.5 px-4 md:px-6 text-center">
                    <Pulse className="h-3 w-16 mx-auto" />
                  </div>
                  <div className="p-4 md:p-6 space-y-3 flex-grow">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 border-b border-[#e0e0e0] pb-2 last:border-b-0">
                        <Pulse className="h-3.5 flex-1 max-w-[180px]" />
                        <Pulse className="h-3.5 w-10" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="mt-4 md:mt-6 bg-[#f2f2f2] p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <Pulse className="w-full sm:w-44 h-12 rounded-none" />
          <Pulse className="w-full sm:w-48 h-12 rounded-none" />
        </div>
      </div>
    </div>
  );
}

// ─── Multi-Location Delivery / Review Skeleton ───────────────────────────────
// Matches /multi-location-delivery/review: max-w-[1240px] pt-6 md:pt-10,
// Billing Information section (2-col cards bg-[#f7f7f7] with bg-[#e2e2e2]
// header strips) + Shipping Information section with N 3-column groups
// (shipping addr + customer PO + items table) using bg-[#dadada] strips.
export function MultiLocationReviewSkeleton({ groups = 1 }: { groups?: number }) {
  return (
    <div className="bg-white min-h-screen font-sans pb-10 md:pb-20">
      <div className="max-w-[1440px] mx-auto pt-6 md:pt-10 px-3 sm:px-4">
        {/* Centered title */}
        <div className="flex justify-center mb-3 md:mb-4">
          <Pulse className="h-7 md:h-8 w-56 md:w-72" />
        </div>


        {/* Billing + Payment 2-col block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-[#f7f7f7] border border-gray-100">
              <div className="bg-[#e2e2e2] py-3 md:py-3.5 px-4 md:px-6 text-center">
                <Pulse className="h-3 w-32 mx-auto" />
              </div>
              <div className="p-5 md:p-8 space-y-2">
                <Pulse className="h-4 w-3/4" />
                <Pulse className="h-3.5 w-1/2" />
                <Pulse className="h-3.5 w-2/3" />
                <Pulse className="h-3.5 w-1/2" />
                <Pulse className="h-3.5 w-1/3" />
              </div>
            </div>
          ))}
        </div>

        <hr className="border-transparent my-8 md:my-16" />

        {/* Shipping Information sub-header */}
        <div className="flex justify-center mb-4">
          <Pulse className="h-6 w-56 md:w-64" />
        </div>

        {/* Per-group 3-column blocks */}
        {Array.from({ length: groups }).map((_, g) => (
          <div key={g} className="mb-12 md:mb-24 last:mb-0">
            <div className="flex justify-center mb-6 md:mb-10">
              <Pulse className="h-3 w-40" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
              {/* Col 1: Shipping To */}
              <div className="flex flex-col bg-[#f7f7f7]">
                <div className="bg-[#dadada] py-2.5 px-4 md:px-6 text-center">
                  <Pulse className="h-3 w-24 mx-auto" />
                </div>
                <div className="p-5 md:p-8 space-y-1.5 flex-grow">
                  <Pulse className="h-3.5 w-2/3" />
                  <Pulse className="h-3.5 w-1/2" />
                  <Pulse className="h-3.5 w-3/4" />
                  <Pulse className="h-3.5 w-1/2" />
                  <Pulse className="h-3.5 w-1/3" />
                </div>
              </div>

              {/* Col 2: Customer PO */}
              <div className="flex flex-col bg-[#f7f7f7]">
                <div className="bg-[#dadada] py-2.5 px-4 md:px-6 text-center">
                  <Pulse className="h-3 w-28 mx-auto" />
                </div>
                <div className="p-5 md:p-8 space-y-4 md:space-y-6 flex-grow">
                  <div className="space-y-2">
                    <Pulse className="h-3 w-24" />
                    <Pulse className="w-full h-[42px] border border-gray-300" />
                  </div>
                  <div className="space-y-2">
                    <Pulse className="h-3 w-24" />
                    <Pulse className="w-full h-[100px] border-2 border-dashed border-gray-300" />
                  </div>
                  <div className="space-y-2">
                    <Pulse className="h-3 w-24" />
                    <Pulse className="w-full h-[80px] border border-gray-300" />
                  </div>
                </div>
              </div>

              {/* Col 3: Items table */}
              <div className="flex flex-col bg-[#f7f7f7]">
                <div className="p-3 flex-grow">
                  <div className="flex justify-between border-b border-gray-300 pb-2 mb-2">
                    <Pulse className="h-3 w-12" />
                    <Pulse className="h-3 w-10" />
                    <Pulse className="h-3 w-8" />
                    <Pulse className="h-3 w-10" />
                  </div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between py-3 border-b border-gray-200 last:border-b-0">
                      <Pulse className="h-3 flex-1 max-w-[100px]" />
                      <Pulse className="h-3 w-12" />
                      <Pulse className="h-3 w-6" />
                      <Pulse className="h-3 w-12" />
                    </div>
                  ))}
                  <div className="space-y-1.5 mt-3 pt-2 border-t border-gray-300">
                    <div className="flex justify-end gap-3"><Pulse className="h-3 w-20" /><Pulse className="h-3 w-12" /></div>
                    <div className="flex justify-end gap-3"><Pulse className="h-3 w-12" /><Pulse className="h-3 w-12" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Footer actions */}
        <div className="bg-[#f2f2f2] p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-8">
          <Pulse className="w-full sm:w-44 h-12 rounded-none" />
          <Pulse className="w-full sm:w-56 h-12 rounded-none" />
        </div>
      </div>
    </div>
  );
}

// ─── Multi-Location Delivery / Success Skeleton ──────────────────────────────
// Matches /multi-location-delivery/success: max-w-[1200px] pt-10 md:pt-20,
// big centered title + intro paragraph, "Successfully ordered" h2,
// bordered table with order rows (Order ID + Ship To columns), each row
// with a yellow left-border marker.
export function MultiLocationSuccessSkeleton({ orders = 3 }: { orders?: number }) {
  return (
    <div className="bg-white min-h-screen font-sans pb-20">
      <div className="max-w-[1200px] mx-auto pt-10 md:pt-20 px-4">
        {/* Title + intro */}
        <div className="text-center mb-10 md:mb-16 space-y-4">
          <div className="flex justify-center">
            <Pulse className="h-7 md:h-9 w-56 md:w-80" />
          </div>
          <div className="max-w-4xl mx-auto space-y-2">
            <Pulse className="h-3.5 w-full" />
            <Pulse className="h-3.5 w-5/6 mx-auto" />
          </div>
        </div>

        {/* "Successfully ordered" sub-header */}
        <div className="mb-6 flex justify-center">
          <Pulse className="h-4 w-48" />
        </div>

        {/* Orders table */}
        <div className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex bg-[#f8f8f8] border-b border-gray-200 py-3 px-6">
            <div className="w-[180px] md:w-[220px] flex-shrink-0"><Pulse className="h-3 w-20" /></div>
            <div className="flex-1"><Pulse className="h-3 w-24" /></div>
          </div>
          <div className="bg-white">
            {Array.from({ length: orders }).map((_, i) => (
              <div key={i} className="flex border-b border-gray-100 last:border-b-0 border-l-4 border-l-[#F5B21B] py-5 px-6 items-start bg-[#fafafa]">
                <div className="w-[180px] md:w-[220px] flex-shrink-0">
                  <Pulse className="h-4 w-32" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Pulse className="h-3.5 w-1/2" />
                  <Pulse className="h-3 w-1/3" />
                  <Pulse className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page-level loading wrappers (for loading.tsx files) ──────────────────────

/** Full-width centered skeleton wrapper — used as Suspense fallbacks */
export function PageSkeleton({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[60vh]">{children}</div>;
}

// ─── Login Skeleton ──────────────────────────────────────────────────────────
export function LoginSkeleton() {
  return (
    <div className="flex-1 w-full min-h-full bg-[#f4f4f4] flex flex-col">
      <main className="flex-1 w-full flex justify-center items-start pt-6 sm:pt-8 md:pt-16 pb-8 sm:pb-12 px-4 md:px-0">
        <div className="w-full max-w-[440px] bg-white rounded-[3px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <Pulse className="h-6 w-24 rounded" />
          </div>
          <div className="flex gap-2 border border-gray-200 rounded p-1">
            <Pulse className="h-10 flex-1 rounded" />
            <Pulse className="h-10 flex-1 rounded" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Pulse className="h-4 w-28 rounded" />
              <Pulse className="h-12 w-full rounded" />
            </div>
            <div className="space-y-2">
              <Pulse className="h-4 w-24 rounded" />
              <Pulse className="h-12 w-full rounded" />
            </div>
            <Pulse className="h-11 w-full rounded mt-6" />
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Account Skeleton ─────────────────────────────────────────────────────────
export function AccountSkeleton() {
  // Mirror the real my-account cards: cardBase = "border border-gray-300 bg-white
  // shadow-sm rounded-none"; sectionHeader = "bg-[#f5f5f5] px-4 py-3 border-b border-gray-300".
  const card = "border border-gray-300 bg-white shadow-sm rounded-none";
  const sectionHeader = "bg-[#f5f5f5] px-4 py-3 border-b border-gray-300";
  // A labelled 2-card row (Business+Sales, then Targets+Behavior on the real page).
  const InfoCard = ({ lines = 3 }: { lines?: number }) => (
    <div className={card}>
      <div className={sectionHeader}>
        <Pulse className="h-4 w-36 rounded" />
      </div>
      <div className="p-3 md:p-5 space-y-2.5">
        {Array.from({ length: lines }).map((_, j) => (
          <Pulse key={j} className={`h-3.5 rounded ${["w-3/4", "w-2/3", "w-1/2"][j % 3]}`} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="flex-1 w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-10 bg-[#fcfcfc]">
      {/* Title */}
      <Pulse className="h-7 w-48 rounded mb-6 md:mb-10" />

      <div className="space-y-8">
        {/* ACCOUNT INFORMATION — single Contact card in a 2-col grid (left half on lg) */}
        <div>
          <Pulse className="h-5 w-44 rounded mb-3" />
          <hr className="border-gray-200 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className={card}>
              <div className={sectionHeader}>
                <Pulse className="h-4 w-36 rounded" />
              </div>
              <div className="p-3 md:p-5 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Pulse key={i} className="h-3.5 w-full rounded" />
                ))}
                <div className="flex flex-col md:flex-row gap-3 pt-4">
                  <Pulse className="h-9 w-full md:w-24 rounded-sm" />
                  <Pulse className="h-9 w-full md:w-44 rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BUSINESS OVERVIEW & SALES DATA — 2 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <InfoCard lines={3} />
          <InfoCard lines={2} />
        </div>

        {/* TARGETS & BEHAVIOR — 2 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <InfoCard lines={3} />
          <InfoCard lines={3} />
        </div>

        {/* CREDIT LIMIT INFORMATION — h2 + hr + 3-card stat grid (CreditLimit component) */}
        <div>
          <Pulse className="h-5 w-52 rounded mb-3" />
          <hr className="border-gray-200 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-stretch shadow-sm rounded-none overflow-hidden">
                <Pulse className="w-16 md:w-20 shrink-0 rounded-none" />
                <div className="flex-1 bg-white border border-l-0 border-gray-200 p-3 md:p-4 space-y-2">
                  <Pulse className="h-2.5 w-2/3 rounded" />
                  <Pulse className="h-5 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ADDRESS BOOK — default billing + shipping cards */}
        <div>
          <Pulse className="h-5 w-44 rounded mb-3" />
          <hr className="border-gray-200 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className={card}>
                <div className={sectionHeader}>
                  <Pulse className="h-4 w-48 rounded" />
                </div>
                <div className="p-3 md:p-5 space-y-2">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Pulse key={j} className="h-3.5 w-full rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Address Book Skeleton ────────────────────────────────────────────────────
// Content-only (no outer padding/max-w) — mirrors the real <Addresses> component, which
// renders as <div w-full space-y-12>. The page wraps it in <main p-…><div max-w-[1200px]>,
// so the route-level fallback, the page's loading state, and Addresses' own loading state
// (which returns this directly, already inside that wrapper) must all share that padding.
export function AddressBookSkeleton() {
  const card = "bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden flex flex-col h-full";
  const cardHeader = "bg-gray-50/80 px-5 py-4 border-b border-[#ebebeb]";
  return (
    <div className="w-full font-rubik space-y-12">
      {/* Section 1: Default Addresses — h2 + gradient line + 2-col card grid */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <Pulse className="h-6 w-48 rounded" />
          <div className="h-[2px] flex-1 bg-gradient-to-r from-yellow-400 to-transparent" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={card}>
              <div className={cardHeader}>
                <Pulse className="h-3 w-48 rounded" />
              </div>
              <div className="p-6 flex-grow space-y-1.5">
                <Pulse className="h-4 w-40 rounded mb-3" />
                <Pulse className="h-3 w-32 rounded" />
                <Pulse className="h-3 w-48 rounded" />
                <Pulse className="h-3 w-36 rounded" />
                <Pulse className="h-3 w-28 rounded" />
                <div className="pt-3 flex items-center gap-2">
                  <Pulse className="h-3 w-14 rounded" />
                  <Pulse className="h-3 w-28 rounded" />
                </div>
                {/* Edit button only on the shipping (2nd) card, matching the real layout */}
                {i === 1 && (
                  <div className="pt-8">
                    <Pulse className="h-11 w-44 rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Additional Addresses — h2 + gradient line + 6-col table (gray header) + pagination */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <Pulse className="h-6 w-56 rounded" />
          <div className="h-[2px] flex-1 bg-gradient-to-r from-yellow-400 to-transparent" />
        </div>
        <div className="bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-[#ebebeb] h-[60px]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="px-6 py-4 ltr:text-left rtl:text-right">
                      <Pulse className="h-3 w-20 rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="h-[70px]">
                    <td className="px-6 py-4"><Pulse className="h-3 w-20 rounded" /></td>
                    <td className="px-6 py-4"><Pulse className="h-3 w-20 rounded" /></td>
                    <td className="px-6 py-4"><Pulse className="h-3 w-40 rounded" /></td>
                    <td className="px-6 py-4"><Pulse className="h-3 w-16 rounded" /></td>
                    <td className="px-6 py-4"><Pulse className="h-3 w-16 rounded" /></td>
                    <td className="px-6 py-4"><Pulse className="h-3 w-24 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination footer (inside the card) */}
          <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/30">
            <div className="w-full flex flex-col md:flex-row items-center justify-between py-3 md:py-4 px-1 gap-6 mt-4 border-t border-gray-100">
              <div className="md:w-[180px] flex justify-center md:justify-start order-1">
                <Pulse className="h-9 w-[120px] rounded" />
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 order-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Pulse key={i} className="h-9 w-9 md:h-10 md:w-10 rounded-full" />
                ))}
              </div>
              <div className="md:w-[220px] flex justify-center md:justify-end order-3">
                <Pulse className="h-3.5 w-40 rounded" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Checkout Success Skeleton ────────────────────────────────────────────────
export function CheckoutSuccessSkeleton() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen font-sans py-8 sm:py-12 md:py-16">
      <main className="max-w-4xl mx-auto px-4">
        {/* Confirmation card */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6 sm:p-8 md:p-10 mb-8 text-center space-y-4 sm:space-y-6">
          <Pulse className="h-9 sm:h-12 md:h-14 lg:h-16 w-1/2 mx-auto" />
          <div className="space-y-2">
            <Pulse className="h-5 w-2/5 mx-auto" />
            <Pulse className="h-4 w-3/4 max-w-lg mx-auto" />
          </div>
        </div>

        {/* Continue Shopping button */}
        <div className="text-center pt-2">
          <Pulse className="inline-block w-full sm:w-72 h-12 rounded-sm" />
        </div>
      </main>
    </div>
  );
}

// ─── Manage Accounts Skeleton ─────────────────────────────────────────────────
export function ManageAccountsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex-1 w-full px-4 md:px-6 lg:px-8 py-10 bg-white">
      {/* Header action bar */}
      <div className="flex justify-between items-center mb-6 md:mb-10">
        <Pulse className="h-7 md:h-8 w-64" />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white border border-[#ebebeb] rounded-md p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Pulse className="h-3 w-32" />
                <Pulse className="h-3 w-48" />
              </div>
              <Pulse className="h-6 w-16 rounded-md flex-shrink-0" />
            </div>
            <Pulse className="w-full h-10 rounded-md" />
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border border-[#ebebeb] rounded-md shadow-sm overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-gray-50 border-b border-[#ebebeb]">
            <tr className="h-[50px]">
              <th className="px-6 py-3"><Pulse className="h-3 w-16" /></th>
              <th className="px-6 py-3"><Pulse className="h-3 w-16" /></th>
              <th className="px-6 py-3"><Pulse className="h-3 w-16" /></th>
              <th className="px-6 py-3"><Pulse className="h-3 w-16 mx-auto" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b border-[#ebebeb]`}>
                <td className="px-6 py-4"><Pulse className="h-3 w-32" /></td>
                <td className="px-6 py-4"><Pulse className="h-3 w-48" /></td>
                <td className="px-6 py-4"><Pulse className="h-6 w-16 rounded-md" /></td>
                <td className="px-6 py-4"><Pulse className="h-8 w-20 mx-auto rounded-md" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CMS Page Skeleton ────────────────────────────────────────────────────────
export function CmsPageSkeleton({ sections = 5 }: { sections?: number }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 md:py-16 lg:py-20">
        {/* Centered title */}
        <div className="flex justify-center mb-8 sm:mb-10 md:mb-12">
          <Pulse className="h-7 sm:h-9 md:h-11 lg:h-12 w-64 sm:w-72 md:w-80 lg:w-96" />
        </div>

        {/* Intro paragraph */}
        <div className="space-y-3 mb-8">
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-[95%]" />
          <Pulse className="h-4 w-[88%]" />
          <Pulse className="h-4 w-[70%]" />
        </div>

        {/* Sections */}
        {Array.from({ length: sections }).map((_, i) => (
          <div key={i} className="mt-10 mb-4">
            <Pulse
              className={`h-6 sm:h-7 md:h-8 mb-4 ${i % 3 === 0 ? "w-1/3" : i % 3 === 1 ? "w-2/5" : "w-1/4"
                }`}
            />
            <div className="space-y-3">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-[94%]" />
              <Pulse className="h-4 w-[88%]" />
              <Pulse className="h-4 w-[75%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── About Skeleton ───────────────────────────────────────────────────────────
// Matches /about: full-width banner image (h-[300px] md:h-[400px] lg:h-[500px])
// + centered uppercase title + 3 long paragraph blocks (gap-10).
export function AboutSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <div className="w-full h-[300px] md:h-[400px] lg:h-[500px]">
        <Pulse className="w-full h-full rounded-none" />
      </div>
      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-6 mt-8 sm:mt-12 md:mt-20 pb-20">
        {/* Title — text-[22px] sm:text-[26px] md:text-[32px], mb-16 */}
        <div className="flex justify-center mb-16">
          <Pulse className="h-6 sm:h-7 md:h-9 w-64 md:w-96" />
        </div>
        {/* 3 paragraph blocks (gap-10, max-w-[1000px], leading-[1.8]) */}
        <div className="flex flex-col gap-10 max-w-[1000px] mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-[95%]" />
              <Pulse className="h-4 w-[90%]" />
              <Pulse className="h-4 w-[70%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Locations Skeleton ──────────────────────────────────────────────────────
// Matches /locations: Google-map block (h-[200px] sm:h-[280px] md:h-[350px])
// + max-w-[1280px] main area with title + 3-col region grid (RegionCard) +
// contact form (2-col input grid + textarea + submit button).
export function LocationsSkeleton({ regions = 6 }: { regions?: number }) {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Map section */}
      <Pulse className="w-full h-[200px] sm:h-[280px] md:h-[350px] rounded-none" />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {/* Title — text-2xl sm:text-3xl md:text-4xl, centered */}
        <div className="text-center mb-8 md:mb-10">
          <Pulse className="h-7 sm:h-8 md:h-10 w-64 mx-auto" />
        </div>

        {/* Region grid — 1 col / 2 col / 3 col */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mb-10 md:mb-16">
          {Array.from({ length: regions }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
              <div className="p-5 space-y-3">
                <Pulse className="h-4 w-32" />
                <Pulse className="h-3 w-full" />
                <Pulse className="h-3 w-3/4" />
                <Pulse className="h-3 w-1/2" />
                <div className="flex items-center gap-2 pt-2">
                  <Pulse className="h-4 w-4 rounded-full" />
                  <Pulse className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Contact form */}
        <section className="w-full max-w-[1100px] mx-auto pb-16">
          {/* 2-col field grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Pulse key={i} className="h-[54px] rounded border border-gray-200" />
            ))}
          </div>
          {/* Subject input */}
          <Pulse className="w-full h-[54px] rounded border border-gray-200 mb-5" />
          {/* Message textarea */}
          <Pulse className="w-full h-[140px] rounded border border-gray-200 mb-5" />
          {/* Submit button */}
          <div className="flex justify-center md:justify-end">
            <Pulse className="w-full md:w-44 h-12 rounded" />
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── Guides Skeleton ─────────────────────────────────────────────────────────
// Matches /guides: full-width banner (max-h-[500px]) + max-w-[1200px] content
// with centered title + 2-col grid of video cards (aspect-[16/9] thumbnail +
// title bar with bottom border).
export function GuidesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <div className="w-full">
        <Pulse className="w-full h-[280px] md:h-[400px] lg:h-[500px] rounded-none" />
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-6 mt-16 md:mt-20 pb-10 sm:pb-16 md:pb-20">
        {/* Title — text-2xl sm:text-3xl md:text-4xl, mb-16, centered */}
        <div className="flex justify-center mb-16">
          <Pulse className="h-7 sm:h-9 md:h-10 w-56 md:w-72" />
        </div>

        {/* 2-col video card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-full max-w-[1000px] mx-auto">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="w-full border-[2px] border-gray-200 bg-white shadow-sm flex flex-col">
              {/* Thumbnail with play button overlay */}
              <div className="relative w-full aspect-[16/9] bg-[#1a1a1e] flex items-center justify-center">
                <Pulse className="w-full h-full rounded-none" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 bg-[#f5b21a] rounded-full flex items-center justify-center shadow-md">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                  </div>
                </div>
              </div>
              {/* Title bar */}
              <div className="w-full border-t-[2px] border-gray-200 py-4 flex justify-center bg-white">
                <Pulse className="h-3.5 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Catalogue Skeleton ──────────────────────────────────────────────────────
// Matches /catalogue: full-width banner + centered title + a single catalog
// card (sm:max-w-[280px] md:max-w-[300px]) with cover image + title strip.
export function CatalogueSkeleton({ items = 1 }: { items?: number }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <div className="w-full h-[300px] md:h-[400px] lg:h-[500px]">
        <Pulse className="w-full h-full rounded-none" />
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-6 mt-8 sm:mt-12 md:mt-20 pb-10 sm:pb-16 md:pb-20 flex flex-col items-center">
        {/* Title */}
        <div className="flex justify-center mb-16">
          <Pulse className="h-6 sm:h-7 md:h-9 w-72 md:w-[28rem]" />
        </div>

        {/* Catalog card(s) */}
        <div className="w-full flex flex-wrap justify-center gap-6 mt-4">
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex flex-col items-center border-[2px] border-gray-200 bg-white w-full sm:max-w-[280px] md:max-w-[300px]">
              {/* Cover image — keeps aspect close to the real PDF cover (portrait-ish) */}
              <div className="w-full p-1 bg-white">
                <Pulse className="w-full aspect-[3/4] rounded-none" />
              </div>
              {/* Title bar */}
              <div className="w-full border-t-[2px] border-gray-200 py-3 flex justify-center bg-white">
                <Pulse className="h-3.5 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Footer Skeleton ──────────────────────────────────────────────────────────
export function FooterSkeleton() {
  return (
    <footer className="bg-black text-white py-12 md:py-20">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-0 items-start">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-10 h-10 mb-4 bg-white/10 rounded-full animate-pulse" />
              <div className="h-5 w-20 mb-3 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="mt-16 md:mt-24 pt-8 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            <div className="h-3 w-28 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-44 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </footer>
  );
}

// Helper to extract base path from pathname, removing locale and store code prefixes
function getBasePath(pathname: string): string {
  if (!pathname) return "/";
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  const first = segments[0];
  const STORE_CODE_RE = /^[A-Za-z0-9_]+_(en|ar)$/;
  if (first === "ar" || first === "en" || STORE_CODE_RE.test(first)) {
    segments.shift();
  }

  if (segments.length > 0) {
    const second = segments[0];
    if (second === "ar" || second === "en") {
      segments.shift();
    }
  }

  return "/" + segments.join("/");
}

// Content-only renderer — picks the right skeleton based on path. Used by both
// RouteAwareSkeleton (full page) and RouteAwareContent (inner only, when a
// parent layout already renders the real Navbar/Footer).
function renderSkeletonForPath(base: string): React.ReactNode {
  // Auth pages
  if (base.startsWith("/login") || base.startsWith("/forgot-password") || base.startsWith("/change-password")) {
    return <LoginSkeleton />;
  }

  // Cart / Checkout / Quick Order
  // NOTE: /checkout/cart and /checkout/success must be matched BEFORE /checkout
  // because startsWith("/checkout") would otherwise win for those URLs.
  if (base.startsWith("/cart") || base.startsWith("/checkout/cart")) return <CartPageSkeleton />;
  if (base.startsWith("/checkout/success")) return <CheckoutSuccessSkeleton />;
  if (base.startsWith("/checkout")) return <CheckoutSkeleton />;
  if (base.startsWith("/quick-order")) return <QuickOrderSkeleton />;

  // Multi-location delivery flow — order matters (most specific first)
  if (base.startsWith("/multi-location-delivery/success")) return <MultiLocationSuccessSkeleton />;
  if (base.startsWith("/multi-location-delivery/billing")) return <MultiLocationBillingSkeleton />;
  if (base.startsWith("/multi-location-delivery/shipping")) return <MultiLocationShippingSkeleton groups={2} />;
  if (base.startsWith("/multi-location-delivery/review")) return <MultiLocationReviewSkeleton groups={1} />;
  if (base.startsWith("/multi-location-delivery")) return <MultiLocationDeliverySkeleton />;

  // Top-level favorites / wishlist. /wishlist AND the friendly slugs /favourite-products,
  // /favorite-products all render the SAME favourites page (app/wishlist/page.tsx re-exports
  // app/favorites/page.tsx; middleware rewrites the friendly slugs to /favorites — but
  // usePathname keeps the original slug). So they must all use the favourites skeleton, not
  // a product-card grid, and not the default no-sidebar skeleton.
  if (
    base.startsWith("/favorites") ||
    base.startsWith("/wishlist") ||
    base.includes("favourite-products") ||
    base.includes("favorite-products")
  ) {
    // Mirror the real favourites page wrapper exactly (app/favorites/page.tsx): outer flex
    // row + Sidebar + w-full content with mt-4 md:mt-8 px-4 md:px-10 pb-10 — so the
    // route-level skeleton and the loaded page share identical sidebar width + padding.
    return (
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-white font-rubik">
        <SidebarSkeleton />
        <div className="w-full mt-4 md:mt-8 px-4 md:px-10 pb-10 bg-white">
          <FavouriteProductsSkeleton count={10} />
        </div>
      </div>
    );
  }

  // Top-level notifications. /customer/notifications + friendly /notifications,
  // /my-notifications, /usernotifications all render the notifications page. Mirror its real
  // wrapper EXACTLY (app/customer/notifications/page.tsx): <div w-full py-4 md:py-10> →
  // <div flex-col lg:flex-row gap-0> → Sidebar + <main flex-1 min-w-0 px-4 md:px-6 lg:px-8>.
  // The page's initial-load skeleton uses this identical wrapper, so the route-level skeleton,
  // the data-loading skeleton, and the loaded page are one continuous layout — no shift.
  if (base.includes("notifications")) {
    return (
      <div className="w-full md:py-7">
        <div className="flex flex-col lg:flex-row gap-0">
          <SidebarSkeleton />
          <main className="flex-1 min-w-0 px-4 md:px-6 lg:px-8">
            <NotificationsSkeleton />
          </main>
        </div>
      </div>
    );
  }

  // For dashboard / user profile pages that require a Sidebar layout
  const isDashboardRoute =
    base.startsWith("/my-account") ||
    base.startsWith("/customer/") ||
    base.startsWith("/my-orders") ||
    base.startsWith("/address-book") ||
    // Friendly account slugs (middleware rewrites these to /customer/* but usePathname
    // keeps the original slug) — they must enter the sidebar-wrapped dashboard block too.
    base.includes("order-attachments") ||
    base.includes("orderupload") ||
    base.startsWith("/dashboard") ||
    base.startsWith("/business-overview") ||
    base.startsWith("/customertarget") ||
    // My Orders friendly slugs (middleware rewrites orders/sales/history → /my-orders, but
    // usePathname keeps the slug). Without these, /orders or /sales/order/history fell through
    // to the default ProductListingSkeleton — the "products skeleton" seen on My Orders.
    base.startsWith("/orders") ||
    base.startsWith("/sales") ||
    base.startsWith("/history");

  if (isDashboardRoute) {
    let pageSkeleton: React.ReactNode = <DashboardSkeleton />;

    // ORDER detail comes BEFORE the list check — /my-orders/[id] and /sales/order/view/*
    if (/^\/my-orders\/[^/]+/.test(base) || base.includes("/sales/order/view") || base.includes("/order/view")) {
      pageSkeleton = <OrderDetailSkeleton />;
    } else if (base.includes("order-attachments") || base.includes("orderupload")) {
      // Catches /customer/order-attachments AND the friendly /my-order-attachments,
      // /order-attachments, /orderupload (orderupload is an attachments alias, not orders).
      pageSkeleton = <OrderAttachmentsSkeleton />;
    } else if (
      // My Orders list — real path + friendly slugs (orders / sales / history /
      // sales/order/history) that all rewrite to /my-orders.
      base.startsWith("/my-orders") ||
      base.startsWith("/orders") ||
      base.startsWith("/sales") ||
      base.startsWith("/history")
    ) {
      pageSkeleton = <MyOrdersSkeleton />;
    } else if (base.includes("/orders")) {
      pageSkeleton = <OrdersTableSkeleton />;
    } else if (base.includes("/statement") || base.includes("/mystatement")) {
      pageSkeleton = <StatementSkeleton />;
    } else if (base.includes("/forecast") || base.includes("/viewforcast")) {
      pageSkeleton = <ForecastSkeleton />;
    } else if (base.includes("/favourite-products")) {
      pageSkeleton = <FavouriteProductsSkeleton />;
    } else if (base.includes("/wishlist")) {
      pageSkeleton = <WishlistSkeleton />;
    } else if (base.includes("/address-book") || base.includes("/address")) {
      // Wrap in the real page's <main p-…><div max-w-[1200px]> so the content-only
      // AddressBookSkeleton gets the same padding/width as the loaded Address Book page.
      pageSkeleton = (
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#fcfcfc] min-h-0">
          <div className="max-w-[1200px]">
            <AddressBookSkeleton />
          </div>
        </main>
      );
    } else if (base.includes("/manage-accounts") || base.includes("/subaccounts")) {
      pageSkeleton = <ManageAccountsSkeleton />;
    } else if (
      base.startsWith("/my-account") ||
      base.includes("/account")
    ) {
      pageSkeleton = <AccountSkeleton />;
    } else if (
      base.startsWith("/customer/dashboard") ||
      base.startsWith("/dashboard") ||
      base.startsWith("/business-overview") ||
      base.startsWith("/customertarget")
    ) {
      pageSkeleton = <DashboardSkeleton />;
    }

    return (
      // Full width (w-full, NO max-w/mx-auto) to match the real account pages — they render
      // full-bleed (sidebar + w-full main). A centered max-w here caused a centered→full-width
      // shift between the route-level skeleton and the loaded page.
      <div className="flex flex-col lg:flex-row flex-1 w-full">
        <SidebarSkeleton />
        <div className="flex-1 min-w-0">
          {pageSkeleton}
        </div>
      </div>
    );
  }

  // Dedicated CMS-style pages (banner + custom content)
  if (base.startsWith("/about")) return <AboutSkeleton />;
  if (base.startsWith("/locations")) return <LocationsSkeleton />;
  if (base.startsWith("/guides")) return <GuidesSkeleton />;
  if (base.startsWith("/catalogue")) return <CatalogueSkeleton />;

  // Text-only CMS pages (privacy, terms, return-exchange)
  if (
    base.startsWith("/privacy-policy") ||
    base.startsWith("/privacy") ||
    base.startsWith("/terms-conditions") ||
    base.startsWith("/terms") ||
    base.startsWith("/return-exchange-policy") ||
    base.startsWith("/returns-exchange")
  ) {
    return <CmsPageSkeleton sections={6} />;
  }

  // Default fallback: product listing style or generic grid
  return <ProductListingSkeleton />;
}

// Renders the path-appropriate skeleton WITHOUT a NavbarSkeleton or FooterSkeleton wrapper.
// Use this inside ProtectedLayout (or any layout that already renders the real Navbar/Footer)
// to avoid showing two navbars during auth check.
export function RouteAwareContent() {
  const pathname = usePathname();
  const base = getBasePath(pathname);
  return <>{renderSkeletonForPath(base)}</>;
}

// Full-page route-aware skeleton: NavbarSkeleton + content + FooterSkeleton.
// Use this where no parent layout is providing the real Navbar.
export function RouteAwareSkeleton() {
  const pathname = usePathname();
  const base = getBasePath(pathname);
  // Match ProtectedLayout's footer-hiding logic — auth pages have no footer.
  const hideFooter = ["/login", "/register", "/forgot-password"].some((p) => base.startsWith(p));

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-[1920px] mx-auto w-full">
      <NavbarSkeleton />
      <main className="flex-1 flex flex-col w-full relative">
        {renderSkeletonForPath(base)}
      </main>
      {!hideFooter && <FooterSkeleton />}
    </div>
  );
}
