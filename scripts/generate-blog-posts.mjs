/**
 * Generates SEO blog posts for industries + topic categories.
 * Run: node scripts/generate-blog-posts.mjs
 *
 * Targets ~5000+ characters of body text per post, WebP Unsplash images,
 * cover image ≠ inline images (no repeats on detail pages).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

/** Reliable Unsplash photo IDs (verified patterns used across the site). */
const P = {
  retailStore: "photo-1441986300917-64674bd600d8",
  retailShop: "photo-1555529669-e69e7aa0ba9a",
  warehouse: "photo-1586528116311-ad8dd3c8310d",
  logistics: "photo-1601584115197-04ecc0da31d7",
  pharmacy: "photo-1587854692152-cbe660dbde88",
  medical: "photo-1576091160399-112ba8d25d1d",
  restaurant: "photo-1517248135467-4c7edcad34c4",
  kitchen: "photo-1556910103-1c02745aae4d",
  manufacturing: "photo-1565043589221-1a6fd9ae45c7",
  factory: "photo-1581091226825-a6a2a5aee158",
  automotive: "photo-1486262715619-67b85e0b08d3",
  garage: "photo-1492144534655-ae79c964c9d7",
  finance: "photo-1554224155-6726b3ff858f",
  office: "photo-1497366216548-37526070297c",
  team: "photo-1522071820081-009f0129c71c",
  meeting: "photo-1600880292203-757bb62b4baf",
  pos: "photo-1556742049-0cfed4f6a45d",
  checkout: "photo-1556740758-90de374c12ad",
  ai: "photo-1677442136019-21780ecad995",
  dashboard: "photo-1460925895917-afdab827c52f",
  laptop: "photo-1551650975-87deedd944c3",
  construction: "photo-1504307651254-35680f356dfd",
  education: "photo-1523050854058-8df90110c9f1",
  classroom: "photo-1509062522246-3755977927d7",
  agriculture: "photo-1625246333195-78d9c38ad449",
  farm: "photo-1464226184884-fa280b87c399",
  textile: "photo-1558171813-4c088753af8f",
  fashion: "photo-1445205170230-053b83016050",
  furniture: "photo-1555041469-a586c61ea9bc",
  interior: "photo-1618221195710-dd6b41faaea6",
  beauty: "photo-1596462502278-27bfdc403348",
  salon: "photo-1560066984-138dadb4c035",
  pet: "photo-1450778869180-41d0601e046e",
  vet: "photo-1548199973-03cce0bbc87b",
  water: "photo-1548839140-29a749e1cf4d",
  bottles: "photo-1564419320461-6870880221ad",
  realestate: "photo-1560518883-ce09059eeffa",
  building: "photo-1486406146926-c627a92ad1ab",
  hospital: "photo-1519494026892-80bbd2d6fd0d",
  clinic: "photo-1631217868264-e5b90bb9e57b",
  wholesale: "photo-1553413077-190dd305871c",
  boxes: "photo-1566576912321-d58ddd7a6088",
  hardware: "photo-1504148455328-c376907d081c",
  tools: "photo-1504328345606-18bbc8c9d7d1",
};

function charCount(blks) {
  return blks.reduce(
    (n, b) => n + (b.text?.length || 0) + (b.caption?.length || 0) + (b.attribution?.length || 0),
    0
  );
}

function padTo(blks, minChars, pads, label = "operations") {
  let i = 0;
  while (charCount(blks) < minChars && i < pads.length) {
    blks.splice(-1, 0, { type: "p", text: pads[i] });
    i += 1;
  }
  const fillers = [
    `When ${label} leaders review software, they should ask for a live exception path: a bad receipt, a partial delivery, a return. Calm under messy reality matters more than a perfect happy-path demo.`,
    `Write the ten transactions that define how ${label} work actually happens. If a vendor cannot run those ten without leaving the product, you have found the real gap early — before contracts and data migration.`,
    `Keep change management boring on purpose. One branch or one workflow first for ${label}. Proof on a small canvas buys political permission; boiling the ocean creates shadow Excel within two weeks.`,
    `Master data ownership is not bureaucracy. For ${label}, someone must own SKUs, partners, and posting rules. Unowned fields become everyone’s problem and nobody’s priority by month two.`,
    `Measure adoption with removed spreadsheets, faster cycle times, and cleaner closes — not login vanity. Those signals tell you whether ${label} teams trust the system enough to abandon workarounds.`,
    `Schedule a thirty-minute weekly exception huddle for the first six weeks. Look at mismatches in ${label} documents. Teams that protect that meeting outperform teams that only celebrate launch day.`,
    `Support expectations belong in the buying criteria. ${label.charAt(0).toUpperCase() + label.slice(1)} peaks do not wait for a ticket queue. Ask who answers, how fast, and what “priority” means in writing.`,
    `Finally, protect your calendar. Do not cut over ${label} during the busiest commercial week of the year. Boring go-live timing is underrated risk management.`,
  ];
  let n = 0;
  while (charCount(blks) < minChars && n < 20) {
    const base = fillers[n % fillers.length];
    const text =
      n < fillers.length
        ? base
        : `${base} Round ${n + 1} for ${label}: keep the checklist short, assign an owner, and revisit next week with evidence — not opinions.`;
    blks.splice(-1, 0, { type: "p", text });
    n += 1;
  }
}

function industryPost(ind, index) {
  const [coverId, inlineA, inlineB] = ind.images;
  const blks = [
    {
      type: "p",
      text: `If you run a ${ind.name.toLowerCase()} business, you already know the messy middle: numbers that look fine on paper, a counter that moves faster than the books, and at least one spreadsheet someone still calls “the real system.” That gap is where margin disappears — quietly, every week.`,
    },
    { type: "h2", text: `What ${ind.name} operators actually need from an ERP` },
    { type: "p", text: ind.need },
    { type: "p", text: ind.need2 },
    {
      type: "image",
      src: inlineA,
      alt: `${ind.name} team using connected operations software`,
      caption: ind.captionA,
    },
    { type: "h3", text: "Start with the daily workflow, not the feature list" },
    {
      type: "p",
      text: `Most rollouts stall because teams try to implement everything at once. In ${ind.name.toLowerCase()}, the better path is deliberately boring: map receiving, selling (or job completion), and closing the day first. Once those three loops are clean, CRM, HR, and reporting stop feeling like extra software and start feeling like extensions of work people already do.`,
    },
    { type: "p", text: ind.workflow },
    {
      type: "quote",
      text: ind.quote,
      attribution: ind.quoteBy,
    },
    { type: "note", text: ind.note },
    { type: "h2", text: "Where money usually leaks" },
    { type: "p", text: ind.leaks },
    {
      type: "image",
      src: inlineB,
      alt: `${ind.name} operations detail — inventory and fulfillment`,
      caption: ind.captionB,
    },
    { type: "h2", text: "A practical checklist before you switch systems" },
    { type: "p", text: ind.checklist },
    { type: "h3", text: "People, branches, and the Monday report" },
    {
      type: "p",
      text: `Write down your top ten SKUs or services, your busiest branch, and the report your owner asks for every Monday. If a platform cannot answer those without a side spreadsheet, keep looking. Also decide who owns master data — SKUs, customers, and the chart of accounts — before go-live. Unowned data becomes everyone’s problem by week three.`,
    },
    { type: "p", text: ind.extra },
    { type: "h2", text: `How WAAMTO fits ${ind.name}` },
    {
      type: "p",
      text: `WAAMTO is built for multi-branch ${ind.name.toLowerCase()} operations: inventory that stays honest, POS or sales where you need them, purchasing that matches receipts, and finance that closes without a weekend of reconciliation. Pick ${ind.name} during signup, choose your business category, and run the free trial against real workflows — not a polished demo script.`,
    },
    { type: "p", text: ind.close },
  ];

  padTo(
    blks,
    5200,
    [
      ind.pad1,
      ind.pad2,
      `Before you buy, ask the vendor to walk receiving, a sale or job, and a return in one sitting. For ${ind.name.toLowerCase()}, those three documents tell you more than a hundred-slide deck. If any step still needs Excel, you have found the real gap.`,
      `Keep change small in the first month: one branch or one workflow. ${ind.name} teams that prove a clean day-close on a small canvas get permission to expand. Teams that boil the ocean create political resistance and shadow systems.`,
      `Finally, schedule a weekly 30-minute exception review for the first six weeks after go-live. Look at mismatches, not vanity dashboards. That habit separates successful ${ind.name.toLowerCase()} rollouts from expensive shelfware.`,
    ],
    ind.name.toLowerCase()
  );

  return {
    id: `ind-${index + 1}`,
    title: ind.title,
    slug: `erp-for-${ind.slug}`,
    excerpt: ind.excerpt,
    category: "Industry",
    industry: ind.name,
    author: "WaamTech Editorial",
    date: ind.date,
    readTime: "12 min",
    featured: index === 0,
    image: coverId,
    tags: [ind.name, "ERP", "Operations"],
    blocks: blks,
  };
}

function topicPost(t, index) {
  const [coverId, inlineA, inlineB] = t.images;
  const blks = [
    { type: "p", text: t.open },
    { type: "h2", text: t.h2a },
    { type: "p", text: t.p1 },
    { type: "p", text: t.p1b },
    {
      type: "image",
      src: inlineA,
      alt: t.altA,
      caption: t.captionA,
    },
    { type: "h3", text: t.h3 },
    { type: "p", text: t.p2 },
    { type: "quote", text: t.quote, attribution: t.quoteBy },
    { type: "note", text: t.note },
    { type: "h2", text: t.h2b },
    { type: "p", text: t.p3 },
    {
      type: "image",
      src: inlineB,
      alt: t.altB,
      caption: t.captionB,
    },
    { type: "h3", text: t.h3b },
    { type: "p", text: t.p4 },
    { type: "p", text: t.extra },
    { type: "h2", text: "What to do this week" },
    { type: "p", text: t.close },
  ];

  padTo(
    blks,
    5200,
    [
      t.pad1,
      t.pad2,
      `Score vendors on time-to-first-successful-day-close for ${t.category} work — not on slide count. A module that cannot finish a normal day without Excel will not suddenly become trustworthy after training.`,
      `Document owners for master data early. Who owns SKUs, customers, and the chart of accounts? Unowned data is how ${t.category.toLowerCase()} modules lose credibility in month two.`,
      `Keep a short escape hatch for true emergencies in week one of go-live — then close it. Permanent dual systems kill ${t.category.toLowerCase()} adoption faster than imperfect software.`,
    ],
    t.category.toLowerCase()
  );

  return {
    id: `cat-${index + 1}`,
    title: t.title,
    slug: t.slug,
    excerpt: t.excerpt,
    category: t.category,
    author: t.author,
    date: t.date,
    readTime: "11 min",
    featured: false,
    image: coverId,
    tags: t.tags,
    blocks: blks,
  };
}

const industries = [
  {
    name: "Retail & Commerce",
    slug: "retail-commerce",
    date: "2026-07-18",
    images: [P.retailStore, P.retailShop, P.pos],
    title: "Retail ERP that keeps the floor, the stockroom, and the books in sync",
    excerpt:
      "How multi-store retail teams stop overselling, speed up checkout, and finally trust Monday’s numbers.",
    need: "Retail is not one workflow. A busy till needs speed. A back office needs transfers and counts. Finance needs clean sales and returns. When those live in separate tools, cashiers invent workarounds and managers lose weekends to reconciliation.",
    need2:
      "Omnichannel makes the problem louder. Online orders reserve stock your store still thinks is sellable. A promotion that ignores reservations creates the worst kind of success: revenue today, apology posts tomorrow. Your ERP has to treat channels as one inventory truth with different fronts.",
    captionA: "Store teams move faster when the till and the stockroom share live quantities.",
    captionB: "Checkout only feels smooth when promotions and stock reservations agree.",
    workflow:
      "Begin with barcode-friendly receiving, POS that depletes the same warehouse the planner sees, and a day-close that ties cash to sales. Add loyalty and gift cards only after those posts are trusted. Otherwise you decorate a broken loop.",
    quote:
      "We stopped arguing about which spreadsheet was right the week POS and inventory started updating the same stock figure.",
    quoteBy: "Store operations lead, multi-branch retail",
    note: "If your e-commerce channel and physical stores do not share reservations, you will oversell your best SKUs during promotions — every time.",
    leaks:
      "Common leaks: ghost stock after bad returns, transfers stuck in WhatsApp, and price overrides nobody can explain at month-end. None of those are ‘people problems’ alone — they are document problems. Make returns, transfers, and overrides first-class records.",
    checklist:
      "Ask vendors to demonstrate a multi-store transfer, a POS return to the correct warehouse, and a promotion that respects reserved online stock. If any of those demos need a side tool, you have your answer.",
    extra:
      "Promotions, loyalty, and gift cards only help when the counter and the warehouse agree. Treat omnichannel stock as a first-class problem, not a phase-two integration promise.",
    close:
      "Retail operators who close that loop spend less time reconciling and more time serving customers — which is the whole point of the floor.",
    pad1: "Train cashiers on holds and returns with the same seriousness as payment methods. Those flows are where inventory integrity is won or lost on a Saturday afternoon.",
    pad2: "Cycle count the noisy aisles weekly. A full annual count is theater if daily receiving discipline is missing across your retail network.",
  },
  {
    name: "Automotive & Vehicle",
    slug: "automotive-vehicle",
    date: "2026-07-17",
    images: [P.automotive, P.garage, P.warehouse],
    title: "Parts, service jobs, and dealership stock — without the guessing",
    excerpt:
      "A field guide for workshops and parts counters that need catalog accuracy, job cards, and purchase control.",
    need: "Automotive businesses live on part numbers, interchange, and urgency. A missing gasket delays a bay; a wrong GRN messes up cost. You need catalog-friendly inventory, job-linked parts consumption, and purchasing that does not bury the workshop in paper.",
    need2:
      "Dealers and multi-brand workshops also juggle warranty returns and supplier credits. If a returned alternator cannot be traced to the supplier invoice, margin arguments never end. Traceability is not a luxury SKU — it is how you stay solvent on high-value parts.",
    captionA: "Service bays wait on parts truth — not on another status meeting.",
    captionB: "Parts counters need catalog clarity tied to real on-hand quantities.",
    workflow:
      "Link job cards to stock issues. When a tech pulls a part, the work order and inventory should move together. Purchasing then sees real demand instead of guesswork POs ‘just in case.’",
    quote:
      "The bay does not care about your ERP roadmap. It cares whether the part is on the shelf this afternoon.",
    quoteBy: "Service manager, multi-brand workshop",
    note: "Serials and warranties matter on high-value parts. If you cannot trace a returned alternator to the supplier invoice, margin arguments never end.",
    leaks:
      "Money leaks when counters sell from ‘memory stock,’ when cores are never returned, and when special orders sit unpaid in a drawer. Document special orders like any other receivable.",
    checklist:
      "Demo a job that consumes parts, a warranty return, and a PO that lands into the correct warehouse bin. Ask how interchange or supersession is handled without breaking history.",
    extra:
      "Linking service tickets to stock issues and purchase orders cuts the classic loop: tech waits, counter guesses, purchasing over-orders.",
    close:
      "Quiet workshops are not lucky — they are documented. Start the trial with your top fifty moving parts and one busy bay.",
    pad1: "Keep a clear status for special-order parts: ordered, arrived, fitted, invoiced. Ambiguous status is how customer deposits get lost.",
    pad2: "Measure fill rate for the parts counter weekly. It is a better health metric than login counts for automotive ERP adoption.",
  },
  {
    name: "Healthcare & Pharmacy",
    slug: "healthcare-pharmacy",
    date: "2026-07-16",
    images: [P.pharmacy, P.medical, P.checkout],
    title: "Pharmacy ERP: expiry, batches, and counter speed that still feel human",
    excerpt:
      "Why pharmacies need more than a billing app — and how batch control protects both patients and profit.",
    need: "Pharmacies juggle FEFO, regulated items, and peak-hour counters. Expiry is not a monthly report; it is a daily risk. An ERP for pharmacy retail must respect batches, near-expiry alerts, and POS that does not slow the pharmacist when the queue builds.",
    need2:
      "Multi-outlet networks also need transfer discipline. Moving short-dated stock to a busier branch can save write-offs — but only if the batch identity survives the transfer document.",
    captionA: "Batch-aware shelves protect patients and protect write-off budgets.",
    captionB: "Peak-hour counters still need FEFO discipline under pressure.",
    workflow:
      "Never separate POS from inventory in pharmacy. A sale without batch deduction is how compliance and costing both fail. Receive with batches, sell with batches, return with batches.",
    quote:
      "We used to discover expired stock during audits. Now the system nudges us weeks earlier — before it becomes a write-off conversation.",
    quoteBy: "Pharmacy owner, multi-outlet network",
    note: "Never separate POS from inventory in pharmacy. A sale without batch deduction is how compliance and costing both fail.",
    leaks:
      "Write-offs, unexplained shortages on controlled items, and purchase returns that never hit AP are the usual leaks. Auditors notice patterns; so should your weekly review.",
    checklist:
      "Insist on near-expiry alerts, batch selection at POS, and a clean purchase return flow. Ask how the system behaves when two batches of the same SKU are on the shelf.",
    extra:
      "Suppliers, purchase returns, and controlled-item trails belong in the same system as the till. That turns ‘we think we are compliant’ into something you can show.",
    close:
      "Start the trial with your cold-chain and high-velocity SKUs first. If those feel safe, expand to the full formulary.",
    pad1: "Schedule a weekly near-expiry huddle. Ten minutes with the right report beats a surprise destruction day.",
    pad2: "Train every cashier on batch prompts — not only the pharmacist. Peak hours are when shortcuts appear.",
  },
  {
    name: "Real Estate & Property",
    slug: "real-estate-property",
    date: "2026-07-15",
    images: [P.realestate, P.building, P.office],
    title: "Property operations ERP: units, collections, and vendor work in one place",
    excerpt:
      "Landlords and agencies lose less rent and fewer maintenance tickets when portfolios share one operational spine.",
    need: "Property teams track units, tenants, collections, and maintenance vendors. Spreadsheets hide arrears until they hurt. An ERP-minded stack keeps tenant records, receivables, and service work connected.",
    need2:
      "Treat each building like a branch: shared policies, local activity, and clear ownership of who collects and who closes tickets. Consolidation gets easier when the structure is intentional.",
    captionA: "Portfolios stay calm when collections and tickets share one timeline.",
    captionB: "Vendor work needs the same document discipline as rent invoices.",
    workflow:
      "Connect CRM-style follow-ups to finance for arrears, and purchasing or service docs for contractors. Status updates should not live only in someone’s inbox.",
    quote:
      "Once maintenance tickets and rent ledgers stopped living in separate inboxes, follow-ups became routine instead of heroic.",
    quoteBy: "Portfolio manager, mid-size agency",
    note: "Treat each building like a branch with shared policies and local activity — clarity beats heroic chasing.",
    leaks:
      "Untracked deposits, unfinished tickets that tenants escalate, and contractor invoices without linked work orders are classic leaks.",
    checklist:
      "Demo arrears aging by building, a maintenance ticket to vendor invoice path, and a unit status change that sales and finance both see.",
    extra:
      "CRM for leads, finance for collections, and purchasing for contractors — used together — is how agencies avoid hiring another person just to chase status.",
    close:
      "Pick Real Estate & Property at signup and model one building first. Proof on a small canvas buys the rest of the portfolio.",
    pad1: "Publish a simple SLA for maintenance categories. Ambiguous urgency creates unfair workload and angry tenants.",
    pad2: "Reconcile deposits monthly. They are liability and trust — not a forgotten balance sheet line.",
  },
  {
    name: "Manufacturing",
    slug: "manufacturing",
    date: "2026-07-14",
    images: [P.manufacturing, P.factory, P.warehouse],
    title: "Manufacturing ERP without the shop-floor chaos",
    excerpt:
      "BOM, work orders, and inventory that stay honest when production and purchasing pull in different directions.",
    need: "Manufacturers feel pain when BOM, WIP, and finished goods disagree. Material shortages surprise the floor; scrap never hits costing. A practical manufacturing ERP ties work orders to inventory movements.",
    need2:
      "Light assembly and process plants share one rule: if WIP only appears in a spreadsheet at month-end, you are flying blind on true margin until it is too late to fix the month.",
    captionA: "Work orders should move materials — not just print paper.",
    captionB: "Receiving and WIP need the same honesty as finished goods.",
    workflow:
      "Pilot one product family: clean BOM, clear work orders, receiving into the right warehouse. Expand after the first line trusts the numbers.",
    quote:
      "We did not need more reports. We needed the work order to deduct the same components the planner thought we had.",
    quoteBy: "Production lead, light assembly plant",
    note: "If WIP costing is an end-of-month spreadsheet, you are flying blind on true margin until it is too late.",
    leaks:
      "Unlogged scrap, informal substitutions, and backflushing against a garbage BOM silently steal inventory accuracy.",
    checklist:
      "Walk a work order from issue to receipt, including scrap. Ask how MRP behaves when on-hand is wrong — then fix on-hand first.",
    extra:
      "MRP needs honest on-hand. Material planning against fantasy stock creates panic POs and political fights with purchasing.",
    close:
      "Plant-wide day-one ambition breaks morale. Prove one cell, then scale.",
    pad1: "Quality checks belong in the flow. Hide scrap and rework and finance invents numbers.",
    pad2: "Backflushing can help — but only after BOM quantities are trusted. Garbage BOM in, silent inventory theft out.",
  },
  {
    name: "Wholesale & Distribution",
    slug: "wholesale-distribution",
    date: "2026-07-13",
    images: [P.wholesale, P.boxes, P.logistics],
    title: "Wholesale ERP for credit, bulk pricing, and routes that actually ship",
    excerpt:
      "Distributors win when price lists, credit limits, and warehouse picking stop fighting each other.",
    need: "Wholesale is quote-to-delivery under pressure. Sales wants flexibility; finance wants credit control; the warehouse wants clear pick lists. ERP should connect sales orders, stock reservations, and receivables.",
    need2:
      "Bulk price lists only help if the invoice cannot silently fall back to the wrong tier. Audit that once — you will sleep better.",
    captionA: "Credit holds should show on the order before anyone overpromises.",
    captionB: "Picking accuracy starts with reservations, not hope.",
    workflow:
      "Reserve stock on confirm, respect credit holds, and print picks from the same document sales used. Returns and damages need the same discipline as outbound.",
    quote:
      "Credit holds used to be a phone call. Now the order status tells the salesperson before they overpromise.",
    quoteBy: "Sales director, regional distributor",
    note: "Bulk price lists only help if the invoice cannot silently fall back to the wrong tier.",
    leaks:
      "Unauthorized discounts, unbilled deliveries, and returns that never restock the right warehouse are common leaks.",
    checklist:
      "Demo a credit hold, a multi-tier price list, and a partial delivery. Ask how van sales or route returns post if you use them.",
    extra:
      "Treat returns as first-class documents so landed cost and customer statements stay believable.",
    close:
      "Start with your top customers and top SKUs in the trial. Distribution complexity shows up there first.",
    pad1: "Publish who can override price and credit. Overrides without audit trails become culture.",
    pad2: "Measure on-time delivery and perfect order rate weekly — they keep sales and warehouse honest together.",
  },
  {
    name: "Warehouse & Logistics",
    slug: "warehouse-logistics",
    date: "2026-07-12",
    images: [P.warehouse, P.logistics, P.boxes],
    title: "Warehouse ERP: scanning, transfers, and SLAs without spreadsheet heroes",
    excerpt:
      "How fulfillment teams cut mis-picks and keep multi-location stock trustworthy under volume.",
    need: "Warehouses fail on ambiguity: which bin, which batch, which transfer status. High-velocity ops need scanning-friendly flows, clear putaway, and transfer documents that do not die in WhatsApp.",
    need2:
      "Cycle counts are cheaper than annual full counts — but only if variance is visible the same day.",
    captionA: "Statuses people trust beat urgent transfers in group chats.",
    captionB: "Putaway discipline is how tomorrow’s picks stay accurate.",
    workflow:
      "Standardize request → ship → receive for transfers. Pair warehouse discipline with purchasing and sales so inbound and outbound are not two calendars.",
    quote:
      "Our ‘urgent’ transfers dropped once every movement had a status people trusted.",
    quoteBy: "Warehouse supervisor, 3PL-adjacent brand",
    note: "Cycle counts are cheaper than annual full counts — but only if the system makes variance visible the same day.",
    leaks:
      "Mis-picks, silent adjustments, and in-transit stock that never arrives are the leaks that destroy SLAs.",
    checklist:
      "Demo a transfer with in-transit visibility, a cycle count variance, and a pick that respects reservations.",
    extra:
      "Inventory ERP is the backbone; logistics discipline is the habit. Software without the habit fails.",
    close:
      "Pick your noisiest aisle for the trial. If that aisle gets quieter, you are on the right path.",
    pad1: "Label bins like you mean it. Ambiguous locations make scanning theater.",
    pad2: "Review exception queues daily during peak. Backlogs hide until a customer calls.",
  },
  {
    name: "Restaurant & Food Service",
    slug: "restaurant-food-service",
    date: "2026-07-11",
    images: [P.restaurant, P.kitchen, P.pos],
    title: "Restaurant ERP: recipes, waste, and multi-outlet control that chefs will use",
    excerpt:
      "Food cost only improves when POS, recipes, and store inventory tell the same story after a busy Friday.",
    need: "Restaurants bleed margin through portion drift, waste, and transfers between outlets that never get recorded. Connect POS sales to recipe consumption and keep commissary stock honest.",
    need2:
      "If half your waste is logged on paper napkins, theoretical food cost is fiction. Capture waste while the shift is still open.",
    captionA: "Recipe depletion should match what left the pass.",
    captionB: "Central kitchen transfers need documents, not verbal promises.",
    workflow:
      "Map recipes for top sellers first. Tie POS items to ingredients. Transfer between outlets with documents. Then look at food cost without arguing about the data.",
    quote:
      "We stopped guessing food cost after weekend rushes when recipe depletion finally matched what left the pass.",
    quoteBy: "Ops manager, multi-outlet cafe group",
    note: "If half your waste is logged on paper napkins, your theoretical food cost is fiction.",
    leaks:
      "Unofficial comps, unlogged waste, and store-to-store borrowing without transfers destroy food cost conversations.",
    checklist:
      "Demo a recipe explosion after POS sales, a waste entry, and a commissary transfer. Ask how modifiers affect consumption.",
    extra:
      "Menu engineering needs clean sales mix plus ingredient cost. That is an ERP problem dressed as a culinary conversation.",
    close:
      "Start with one outlet and twenty recipes. Expand when the kitchen trusts the numbers.",
    pad1: "Train shift leads on waste reasons. Categories beat vague ‘spoilage’ dumps.",
    pad2: "Compare theoretical vs actual weekly, not quarterly. Drift compounds fast in food service.",
  },
  {
    name: "Education",
    slug: "education",
    date: "2026-07-10",
    images: [P.education, P.classroom, P.office],
    title: "Education operations: fees, stores, and campus inventory without the admin spiral",
    excerpt:
      "Institutes run smoother when fee-linked finance, campus stores, and HR share one operational backbone.",
    need: "Schools and institutes are multi-department businesses: fee collection, bookstore or lab inventory, staff payroll, and purchasing for facilities. Fragmented tools create duplicate records and late month-ends.",
    need2:
      "Treat each campus like a branch with a shared chart of accounts. Consolidation gets easier when structure is intentional from day one.",
    captionA: "Parents ask simple questions — your stack should answer simply.",
    captionB: "Campus stores and labs need inventory discipline too.",
    workflow:
      "Phase finance and store/lab inventory first, then HR. Big-bang campus ERP projects fail; phased workflows that protect fee season succeed.",
    quote:
      "Parents ask simple questions. Our old stack made simple answers take three departments.",
    quoteBy: "Admin head, private campus network",
    note: "Treat each campus like a branch with shared chart of accounts — consolidation gets easier when structure is intentional.",
    leaks:
      "Unreconciled fees, lab consumables that vanish, and purchase orders without budget visibility are common leaks.",
    checklist:
      "Demo fee receipts posting to the ledger, a campus store sale, and a multi-campus report the director actually wants.",
    extra:
      "Protect fee season on the calendar. Do not cut over the week collections peak.",
    close:
      "Model one campus in the trial. Education complexity is organizational — prove calm admin first.",
    pad1: "Give department heads read-only clarity before edit rights. Trust builds adoption.",
    pad2: "Keep student-facing payments boring and receipted. Support tickets explode when receipts are unclear.",
  },
  {
    name: "Hospital & Medical",
    slug: "hospital-medical",
    date: "2026-07-09",
    images: [P.hospital, P.clinic, P.medical],
    title: "Hospital supply chain ERP: clinical demand meets inventory reality",
    excerpt:
      "Clinics and hospitals reduce stockouts on critical items when purchasing, stores, and finance share live demand signals.",
    need: "Medical facilities cannot treat consumables like casual retail stock. Critical items need par levels, batch tracking where relevant, and purchasing that reacts to usage — not gut feel.",
    need2:
      "Separate clinical urgency from procurement process, but never disconnect them. Urgency without a PO trail becomes uncontrolled spend.",
    captionA: "Par alerts are quieter — and safer — than last-minute shortages.",
    captionB: "Store issues to departments need the same audit trail as purchases.",
    workflow:
      "Set pars on critical items, issue to departments with documents, and let purchasing see usage. Vendor performance follows real receipts.",
    quote:
      "We used to discover critical shortages at the worst moment. Par alerts are quieter — and safer.",
    quoteBy: "Materials manager, specialty clinic group",
    note: "Separate clinical urgency from procurement process, but never disconnect them.",
    leaks:
      "Ward stockpiles, expired consumables, and rush buys at premium prices are the expensive leaks.",
    checklist:
      "Demo par replenishment, a department issue, and expiry where applicable. Ask how emergency issues are documented after the fact.",
    extra:
      "Vendor scorecards are useless without on-time and quality data from real receipts.",
    close:
      "Start with one department’s critical list. Clinical trust is earned SKU by SKU.",
    pad1: "Review rush PO reasons weekly. Patterns reveal process gaps, not bad luck.",
    pad2: "Align finance on whether department issues hit cost centers correctly — silence here creates year-end fights.",
  },
  {
    name: "Agriculture",
    slug: "agriculture",
    date: "2026-07-08",
    images: [P.agriculture, P.farm, P.wholesale],
    title: "Agribusiness ERP: seasonal stock, inputs, and dealer networks",
    excerpt:
      "Fertilizer, seed, and agri-input sellers need seasonal planning and dealer credit that spreadsheets cannot hold.",
    need: "Agriculture supply businesses live on seasons, bulk SKUs, and dealer relationships. Overstock after the window is dead capital; understock during peak is lost share.",
    need2:
      "Batch and lot tracking for inputs is not optional when quality claims arrive after sowing season starts.",
    captionA: "Season planning gets honest when depots share one balance.",
    captionB: "Dealer credit and delivery promises must stay aligned.",
    workflow:
      "Plan purchasing against season windows, transfer to regional depots with clear statuses, and keep dealer CRM notes next to sales orders.",
    quote:
      "Season planning got honest when warehouse and finance looked at the same depot balances.",
    quoteBy: "Regional distributor, agri inputs",
    note: "Batch and lot tracking for inputs is not optional when quality claims arrive after sowing starts.",
    leaks:
      "Unreserved promises to dealers, unclear lot quality, and credit that outruns collections are peak-season leaks.",
    checklist:
      "Demo depot transfers, lot tracking, and credit holds before peak. Ask how returns of unused inputs are handled.",
    extra:
      "Pair CRM follow-ups with reserved stock. The salesperson who promises without reservation creates reputation damage.",
    close:
      "Run the trial before your next peak. Seasonality does not wait for your ERP project plan.",
    pad1: "Freeze price lists thoughtfully before peak. Mid-season chaos in pricing destroys trust.",
    pad2: "After peak, review aging stock immediately. Dead capital is easier to see when the rush ends.",
  },
  {
    name: "Textile & Garments",
    slug: "textile-garments",
    date: "2026-07-07",
    images: [P.textile, P.fashion, P.retailShop],
    title: "Garment ERP: variants, seasons, and transfers that keep boutiques stocked",
    excerpt:
      "Size-color matrices break spreadsheets. Here is how apparel teams keep channels and stores aligned.",
    need: "Apparel multiplies SKUs through size and color. Without variant-aware inventory, transfers and POS become guesswork. You need seasonality, store transfers, and purchasing that understands what actually sold.",
    need2:
      "End-of-season markdowns hurt less when you see aging by variant early — not after the table is full of leftovers.",
    captionA: "Variants must be first-class in stock — not footnotes in Excel.",
    captionB: "Boutique transfers work when size runs are visible.",
    workflow:
      "Make variants first-class. Transfer and sell at variant level. Review aging before markdown season, not after.",
    quote:
      "We finally stopped shipping the wrong size runs once variants were first-class in stock, not footnotes in Excel.",
    quoteBy: "Merchandiser, multi-brand fashion retail",
    note: "End-of-season markdowns hurt less when you can see aging by variant early.",
    leaks:
      "Wrong-size transfers, channel oversell, and purchase orders based on hope instead of sell-through are the leaks.",
    checklist:
      "Demo a size-color matrix, a store transfer of specific variants, and a sell-through report merchandising will actually open.",
    extra:
      "Wholesale and retail under one brand need shared availability with channel-specific pricing.",
    close:
      "Pilot one category and one season in the trial. Apparel complexity is combinatorial — keep the canvas small.",
    pad1: "Agree naming conventions for colors and sizes across brands. Dirty master data multiplies forever.",
    pad2: "Review dead variants monthly. Sentiment is a bad inventory planner.",
  },
  {
    name: "Furniture & Interior",
    slug: "furniture-interior",
    date: "2026-07-06",
    images: [P.furniture, P.interior, P.warehouse],
    title: "Furniture ERP for showrooms, custom orders, and delivery promises",
    excerpt:
      "Made-to-order and showroom stock need different rhythms — your system should respect both.",
    need: "Furniture retail mixes floor models, warehouse stock, and custom manufacturing lead times. Customers remember broken delivery promises. Tie sales orders to procurement or work orders and keep deposits visible.",
    need2:
      "Floor models need clear status: display, reserved, or available to sell. Ambiguous status is how double-selling happens.",
    captionA: "Deposits and order status should answer ‘where is my sofa?’ quickly.",
    captionB: "Showroom and warehouse stock need distinct, honest statuses.",
    workflow:
      "Separate display vs sellable stock. Link custom orders to PO or work order. Schedule delivery against real readiness, not optimism.",
    quote:
      "The day we linked deposits to order status, ‘where is my sofa?’ calls got shorter.",
    quoteBy: "Showroom manager, home interiors brand",
    note: "Floor models need clear status: display, reserved, or available to sell.",
    leaks:
      "Double-sold floor models, deposits without linked orders, and finishing materials that vanish from store counts are common leaks.",
    checklist:
      "Demo a custom order with deposit, a floor-model reserve, and a delivery schedule change both sales and warehouse see.",
    extra:
      "If you manufacture or assemble, connect BOM-light work orders so finishing materials do not mysteriously vanish.",
    close:
      "Start with showroom + warehouse for stocked lines, then add custom flow. Promises are the product.",
    pad1: "Photograph and tag floor models in the system. Visual ambiguity creates sales conflicts.",
    pad2: "Confirm delivery windows with warehouse capacity, not only with the customer’s preference.",
  },
  {
    name: "Building Materials & Hardware",
    slug: "building-materials-hardware",
    date: "2026-07-05",
    images: [P.construction, P.hardware, P.tools],
    title: "Hardware & building materials: bulk units, job sites, and contractor credit",
    excerpt:
      "Counter sales plus project deliveries need unit conversions, credit control, and stock that matches the yard.",
    need: "Hardware and building materials dealers sell in bags, tons, pieces, and kits. Unit conversion mistakes destroy margin. Contractors need credit; cash customers need speed.",
    need2:
      "Project deliveries without linked sales orders become unbillable loads. Document the load before the truck leaves.",
    captionA: "Unit conversions should be enforced — not ‘remembered.’",
    captionB: "Yard stock and counter sales need the same truth.",
    workflow:
      "Enforce multi-unit inventory, link deliveries to orders, and keep contractor credit visible at the counter.",
    quote:
      "We stopped losing margin on unit mistakes when the system enforced the conversion we used to ‘remember.’",
    quoteBy: "Owner, regional building materials yard",
    note: "Project deliveries without linked sales orders become unbillable loads.",
    leaks:
      "Wrong UOM on invoices, unpaid site deliveries, and slow-moving high-value aisle stock are classic leaks.",
    checklist:
      "Demo UOM conversion on sale and purchase, a contractor credit hold, and a site delivery note.",
    extra:
      "Slow-moving SKUs hide in large yards. Aging reports on high-value aisles pay for themselves.",
    close:
      "Pilot the counter + one delivery truck in the trial. Hardware complexity shows up in the yard first.",
    pad1: "Print packing notes that match what left the yard. Disputes start when paper and truck disagree.",
    pad2: "Review contractor aging before peak building season. Credit is a seasonal risk.",
  },
  {
    name: "Beauty & Cosmetics",
    slug: "beauty-cosmetics",
    date: "2026-07-04",
    images: [P.beauty, P.salon, P.retailShop],
    title: "Beauty retail ERP: batches, boutiques, and salon inventory that stays pretty accurate",
    excerpt:
      "Cosmetics and salon brands protect margin with expiry awareness, variants, and POS that matches the back room.",
    need: "Beauty retail mixes high SKU counts, shade variants, and sometimes expiry-sensitive products. Salons also consume retail stock in services. You need inventory discipline plus POS/CRM for loyalty.",
    need2:
      "Gift-with-purchase and promo kits must deplete components correctly or a ‘successful’ campaign silently steals margin.",
    captionA: "Shade accuracy at the till starts in the stockroom.",
    captionB: "Salon usage is inventory movement — treat it that way.",
    workflow:
      "Sell and transfer at shade/variant level. Post salon usage as issues. Build kits that explode components correctly.",
    quote:
      "Shade returns dropped when the till and the stockroom finally agreed on what we actually had.",
    quoteBy: "Retail lead, cosmetics boutique chain",
    note: "Gift-with-purchase kits must deplete components correctly or campaigns steal margin silently.",
    leaks:
      "Tester abuse without tracking, wrong shade returns, and salon drawers that never post issues are leaks.",
    checklist:
      "Demo shade variants, a kit explosion, and a salon service that consumes retail stock.",
    extra:
      "Salon + retail hybrids should treat service usage as inventory movement. Otherwise the shelf always looks fuller than reality.",
    close:
      "Start with your top shades and one salon room. Beauty SKU counts explode — keep the pilot tight.",
    pad1: "Track testers if they materialize from sellable stock. Untracked testers are shrinkage with nicer lighting.",
    pad2: "Loyalty works when purchase history is trustworthy. Dirty POS history makes CRM guess.",
  },
  {
    name: "Pet & Veterinary",
    slug: "pet-veterinary",
    date: "2026-07-03",
    images: [P.pet, P.vet, P.retailShop],
    title: "Pet retail & clinic ops: SKUs, meds, and appointments without stock surprises",
    excerpt:
      "Pet stores and clinics share one problem — living inventory needs and medical items that cannot go missing.",
    need: "Pet businesses combine retail SKUs with clinic consumables. Meds and specialty foods need careful receiving; the front counter needs fast POS. Keep clinic usage and retail sales from double-counting the same bag of food.",
    need2:
      "Track high-value meds like pharmacy batches. ‘We thought we had it’ is not a clinical plan.",
    captionA: "Clinic drawers and the retail aisle must share one inventory.",
    captionB: "Specialty foods and meds need receiving discipline.",
    workflow:
      "Post clinic issues and retail sales to the same inventory. Receive meds carefully. Use CRM for pet-parent history next to purchases.",
    quote:
      "Clinic drawers and the retail aisle stopped fighting once every issue posted to the same inventory.",
    quoteBy: "Practice manager, pet clinic + store",
    note: "Track high-value meds like you would pharmacy batches.",
    leaks:
      "Unposted clinic usage, expired meds, and loyalty points on wrong histories are common leaks.",
    checklist:
      "Demo a clinic issue, a retail sale of the same SKU family, and a med with batch/expiry if you carry them.",
    extra:
      "Loyalty for pet parents works best when purchase history and clinic visits are not trapped in two databases.",
    close:
      "Pilot retail + one clinic room. Pet ops are emotional for customers — stock surprises feel personal.",
    pad1: "Label clinic storage clearly. Shared bags of food are where double-counting starts.",
    pad2: "Review controlled or high-value meds weekly. Shortages here hurt trust fast.",
  },
  {
    name: "Water Management",
    slug: "water-management",
    date: "2026-07-02",
    images: [P.water, P.bottles, P.logistics],
    title: "Water business ERP: tanks, routes, and refill operations that scale",
    excerpt:
      "Bottled water and refill networks need route-friendly sales, deposit tracking, and warehouse clarity.",
    need: "Water distribution mixes empty/full bottle logistics, deposits, and route sales. Missing empties and unclear van stock destroy profit.",
    need2:
      "Deposits are liability and inventory at once. If your system cannot express that cleanly, books will always feel ‘almost right.’",
    captionA: "Empties and filled bottles need clear statuses on every van.",
    captionB: "Route history belongs next to customer credit notes.",
    workflow:
      "Track empties vs filled, post van stock counts, and keep deposits visible. Route planning improves when CRM notes live next to stock.",
    quote:
      "Van stock counts stopped being a daily argument when empties and filled bottles had clear statuses.",
    quoteBy: "Ops head, regional water network",
    note: "Deposits are liability and inventory at once — model both or books feel ‘almost right.’",
    leaks:
      "Lost empties, underpaid route customers, and deposit balances nobody trusts are the leaks.",
    checklist:
      "Demo empty/full statuses, a route sale, and a deposit refund. Ask how van variance is handled.",
    extra:
      "Drivers should not be the only people who know which shop always underpays — put it in the system.",
    close:
      "Pilot one route and one plant warehouse. Water logistics is a status machine — get statuses right.",
    pad1: "Count vans at dispatch and return. Skipping either side invents variance.",
    pad2: "Reconcile deposits monthly with customer statements. Surprises here become disputes.",
  },
];

const topics = [
  {
    category: "ERP",
    slug: "modern-erp-operational-visibility",
    title: "How modern ERPs reduce operational blind spots",
    excerpt:
      "A practical look at unifying inventory, finance, and sales data into one decision layer.",
    author: "WaamTech Team",
    date: "2026-06-12",
    images: [P.dashboard, P.laptop, P.meeting],
    tags: ["ERP", "Visibility"],
    open: "Modern enterprises lose time when inventory, finance, and sales live in separate tools. Reports disagree, teams chase spreadsheets, and decisions lag behind what actually happened on the floor yesterday.",
    h2a: "Blind spots are usually process gaps, not ‘missing AI’",
    p1: "A modern ERP closes those gaps by making one shared record the source of truth. Stock movements update costing, invoices reflect real fulfillment, and managers see the same numbers on every screen — without exporting to Excel to ‘make it make sense.’",
    p1b: "The expensive blind spot is not that you lack charts. It is that two departments can post the same economic event in different ways and both look locally correct.",
    altA: "Operations dashboard with unified metrics",
    captionA: "One shared record beats three conflicting reports.",
    h3: "Pick the workflows people touch daily",
    p2: "Start with receiving, selling, and reconciling. If those three loops are messy, no amount of fancy analytics will save the month. Clarity and data integrity still beat feature count.",
    quote:
      "We did not need another dashboard. We needed the dashboard to stop lying because the modules disagreed.",
    quoteBy: "COO, multi-branch operator",
    note: "If two departments can post the same economic event in different ways, you do not have an ERP yet — you have a collection of apps.",
    h2b: "What ‘good enough’ looks like in the first 90 days",
    p3: "Success is fewer shadow spreadsheets, faster month-end, and branch managers who stop calling HQ for ‘the real stock number.’ Expand modules only after that trust exists.",
    altB: "Team reviewing a single source of operational truth",
    captionB: "Trust shows up as fewer side spreadsheets — not more logins.",
    h3b: "Integrations as exceptions",
    p4: "Treat integrations as exceptions, not the architecture. The more your core flows stay inside one system, the fewer midnight fixes you inherit from brittle connectors.",
    extra:
      "WAAMTO is built around that sequence: inventory and commerce first, then finance and CRM, with AI that asks questions against your own data — not a black box.",
    close:
      "This week: list the three reports leadership argues about. Trace each number to a posting. That map is your ERP shortlist criteria.",
    pad1: "Blind spots love month-end. If close takes heroic weekends, your daily posts are the real project.",
    pad2: "Ask vendors to break something on purpose in a demo — a bad receipt, a return — and show the audit trail. Calm under exception matters.",
  },
  {
    category: "Inventory",
    slug: "multi-warehouse-inventory-design",
    title: "Designing inventory systems for multi-warehouse brands",
    excerpt:
      "Patterns that keep stock accurate when products move across regions and channels.",
    author: "Product Team",
    date: "2026-05-28",
    images: [P.warehouse, P.logistics, P.boxes],
    tags: ["Inventory", "Warehouse"],
    open: "Multi-warehouse brands fail when each location invents its own stock rules. Transfers get lost, channels oversell, and cycle counts never catch up to reality.",
    h2a: "Design around locations, reservations, and audit trails",
    p1: "Every quantity should know its warehouse. Online and POS demand should reserve stock deliberately. Every movement — including adjustments — should leave a trail finance can trust.",
    p1b: "Negative stock is a symptom. Fix the posting rules that allow it before you celebrate automation.",
    altA: "Multi-warehouse inventory operations",
    captionA: "Transfers need statuses people believe — not WhatsApp threads.",
    h3: "Transfers are a product, not a side chat",
    p2: "In-transit stock that disappears into a group chat is how shrinkage stories begin. Statuses like requested, shipped, and received keep both ends honest.",
    quote:
      "When planners could rebalance before stockouts, we stopped treating warehouses like rival companies.",
    quoteBy: "Inventory planner, regional brand",
    note: "Negative stock is a symptom. Fix the posting rules that allow it before you celebrate ‘automation.’",
    h2b: "Landed cost and valuation follow clean movements",
    p3: "Finance cannot trust valuation if warehouse documents are optional. Make receiving and transfers mandatory habits, then costing stops being monthly archaeology.",
    altB: "Pallets and staged inventory ready for transfer",
    captionB: "Clean movements make valuation boring — in a good way.",
    h3b: "Counts that teach",
    p4: "Cycle count the noisy aisles weekly. Full counts annually are theater if daily discipline is missing.",
    extra:
      "WAAMTO Inventory is built for multi-warehouse truth: batches, serials, transfers, and reorder signals that respect how stock actually moves.",
    close:
      "This week: pick your worst transfer corridor and document every status until it is boring. Boring is the goal.",
    pad1: "Reservation rules for channels should be written down. Tribal knowledge does not survive shift changes.",
    pad2: "When warehouses share one model, planners rebalance before stockouts — and finance trusts landed cost across regions.",
  },
  {
    category: "POS",
    slug: "pos-inventory-sync",
    title: "POS and inventory: keeping the counter and the warehouse in sync",
    excerpt:
      "Why real-time stock at the till prevents overselling, shrinkage, and end-of-day surprises.",
    author: "Product Team",
    date: "2026-07-08",
    images: [P.pos, P.checkout, P.retailShop],
    tags: ["POS", "Retail"],
    open: "When POS and inventory run on different clocks, cashiers sell what the warehouse already moved — or refuse sales that stock could cover. Customers feel that confusion immediately.",
    h2a: "Reserve and deplete at sale time",
    p1: "A unified stack reserves and depletes stock when the sale happens, supports returns cleanly, and keeps branch managers aligned with finance on daily totals.",
    p1b: "Offline is not optional for real stores. Internet drops. The counter cannot.",
    altA: "Point of sale counter synced with inventory",
    captionA: "The till should not sell a ghost SKU.",
    h3: "Offline-capable counters",
    p2: "Offline-capable POS with later sync is the difference between a bad hour and a lost day. Design for reconnect, not for perfection.",
    quote:
      "Shift close got shorter the week cash variance and stock variance stopped living in different notebooks.",
    quoteBy: "Retail supervisor",
    note: "Promotions that ignore stock reservations create revenue today and apology posts tomorrow.",
    h2b: "Returns deserve the same care as sales",
    p3: "A return that restocks the wrong batch or warehouse quietly poisons next week’s counts. Document returns like sales.",
    altB: "Busy retail checkout lane",
    captionB: "Speed at the till still needs honest stock posts.",
    h3b: "Shift close as a product",
    p4: "Train cashiers on holds and returns with the same seriousness as payment methods. Those flows are where integrity is won or lost.",
    extra:
      "Retail and restaurant operators who close that loop spend less time reconciling and more time serving customers.",
    close:
      "This week: watch five returns and five holds. Note where stock disagrees. That list is your POS-inventory backlog.",
    pad1: "Gift cards and loyalty should not bypass inventory rules. Edge tenders still move economic reality.",
    pad2: "Measure void and discount rates by cashier with coaching, not blame. Patterns reveal training gaps.",
  },
  {
    category: "Finance",
    slug: "multi-branch-finance",
    title: "Multi-branch finance: one ledger, many locations",
    excerpt:
      "How shared accounting structures help growing brands stay audit-ready across cities.",
    author: "Customer Success",
    date: "2026-06-24",
    images: [P.finance, P.office, P.dashboard],
    tags: ["Finance", "Multi-branch"],
    open: "Growing brands often open branches faster than they fix reporting. Each site invents local spreadsheets, and group finance spends weeks closing the month.",
    h2a: "Shared chart, local activity",
    p1: "A shared chart of accounts, branch dimensions, and consistent posting rules make consolidation routine instead of heroic. Local managers still run their store — they post into a structure HQ understands.",
    p1b: "Cash and banks cannot be optional modules. If they live outside the ERP, P&L will always feel slightly fictional.",
    altA: "Multi-branch finance and cash control",
    captionA: "Consolidation is easier when branches share structure.",
    h3: "Inter-branch honesty",
    p2: "Inter-branch transfers without accounting entries create phantom profit. Document both the stock and the books.",
    quote:
      "Month-end stopped being a hostage situation once every location posted the same way.",
    quoteBy: "Group accountant",
    note: "Inter-branch transfers without accounting entries create phantom profit.",
    h2b: "Audit trails are a product feature",
    p3: "When leadership gets timely P&L and auditors get a clear trail, you have operational maturity — not just software licenses.",
    altB: "Finance team working from shared ledgers",
    captionB: "Timely P&L needs boring, consistent posts.",
    h3b: "Budgets after truth",
    p4: "Budget vs actual only helps if actuals are trustworthy. Fix posting quality before you debate budget ambition.",
    extra:
      "WAAMTO Finance is designed to sit next to inventory and sales so the ledger reflects the business you actually ran.",
    close:
      "This week: list every spreadsheet used to ‘adjust’ branch results. Each one is a posting rule waiting to be designed.",
    pad1: "Close checklists should be short and enforced. Long checklists get skipped under pressure.",
    pad2: "Give branch managers a report they trust weekly. Surprise HQ packs destroy adoption.",
  },
  {
    category: "AI",
    slug: "ai-in-erp-data-control",
    title: "Using AI in ERP without losing control of your data",
    excerpt:
      "Practical ways to use assistants and document AI while keeping audit trails and privacy intact.",
    author: "WaamTech Team",
    date: "2026-07-02",
    images: [P.ai, P.dashboard, P.laptop],
    tags: ["AI", "Security"],
    open: "AI in ERP should speed up questions, document capture, and recommendations — not send sensitive business data into opaque third-party black boxes you cannot explain to a board.",
    h2a: "Prefer assistants that work against your modules",
    p1: "The useful pattern is module-aware help: ask about stock, sales, or receivables inside your own stack, with logged activity and clear limits on what the assistant can change.",
    p1b: "If you cannot answer ‘what did the AI change last Tuesday?,’ you are not ready for autonomous actions.",
    altA: "AI workspace inside ERP with human control",
    captionA: "AI suggests. Operators confirm. Audit stays intact.",
    h3: "OCR is a workflow, not a party trick",
    p2: "Document AI that turns vendor invoices into draft bills saves hours — if humans still approve the posting. That human gate is how you keep control.",
    quote:
      "We let AI draft. We never let it silently post. That one rule kept finance calm.",
    quoteBy: "Finance controller",
    note: "If you cannot answer what the AI changed last Tuesday, you are not ready for autonomous actions.",
    h2b: "Recommendations should be rejectable",
    p3: "Reorder suggestions and CRM follow-ups are valuable when acceptance is intentional. Forced automation creates distrust faster than no AI at all.",
    altB: "Operator reviewing AI suggestions on a laptop",
    captionB: "Rejectable recommendations build trust; silent posts destroy it.",
    h3b: "Privacy as a default",
    p4: "Keep inference on your stack where possible. Explainability beats novelty in regulated or multi-branch environments.",
    extra:
      "WAAMTO’s AI Workspace is built for private, auditable assistance on your installed modules — Assistant, Document OCR, and recommendations you can accept or dismiss.",
    close:
      "This week: write a one-page AI policy — what can draft, what can never post, who reviews logs. Then evaluate tools against that page.",
    pad1: "Train teams on when to trust a suggestion. AI literacy is an operations skill now.",
    pad2: "Start with read-only Q&A across modules before enabling any write suggestions.",
  },
  {
    category: "Pricing",
    slug: "erp-subscription-planning",
    title: "A practical guide to ERP subscription planning",
    excerpt:
      "How to choose the right plan as your team, locations, and modules grow.",
    author: "Customer Success",
    date: "2026-04-22",
    images: [P.office, P.meeting, P.finance],
    tags: ["Pricing", "Planning"],
    open: "Pick a plan for how you operate today — and how you expect to grow in the next year. Overbuying modules you will not use creates noise; underbuying creates painful mid-year upgrades.",
    h2a: "Map users, branches, and must-have modules first",
    p1: "Then compare seat limits, multi-company support, and support tiers against that list. Ignore vanity features until the core loop is covered.",
    p1b: "Seat math matters. A plan that looks cheap until you add cashiers is not cheap.",
    altA: "Planning ERP subscription and seats",
    captionA: "Buy for the next year of operations — not a brochure fantasy.",
    h3: "Trials exist to test real workflows",
    p2: "Use the trial to run receiving, a sale, and a reconciliation — not to click every menu once. That is how you learn fit.",
    quote:
      "We upgraded when branches needed multi-company — not because a salesperson told us Enterprise sounded nicer.",
    quoteBy: "Founder, growing retail group",
    note: "Seat math matters. A plan that looks cheap until you add cashiers is not cheap.",
    h2b: "Review quarterly, not only at renewal",
    p3: "Treat subscription planning as an operating decision. Usage drifts. Adjust before the next cycle forces a scramble.",
    altB: "Team comparing plan options in a meeting",
    captionB: "Quarterly usage reviews beat surprise renewals.",
    h3b: "Support is part of the product",
    p4: "Ask about support channels and response expectations up front. Software without a path to help becomes shelfware during peak season.",
    extra:
      "WAAMTO plans are structured so you can start focused and expand modules as operations mature — without rewriting your stack.",
    close:
      "This week: write your must-have module list and seat count on one page. Bring that page to every vendor call.",
    pad1: "Separate nice-to-have AI demos from must-have day-close. Glossy features sell; boring reliability keeps you.",
    pad2: "If you are multi-company soon, say so early. Migration mid-contract is more expensive than planning.",
  },
  {
    category: "Product",
    slug: "enterprise-saas-ux-expectations",
    title: "What enterprise buyers expect from SaaS UX",
    excerpt:
      "Clarity, speed, and trust — the UX principles that separate premium software from noise.",
    author: "Design Team",
    date: "2026-05-10",
    images: [P.laptop, P.team, P.meeting],
    tags: ["Product", "UX"],
    open: "Enterprise buyers judge SaaS in the first few sessions: can people find work quickly, trust the numbers, and finish tasks without training decks that nobody reads?",
    h2a: "Premium UX is not decoration",
    p1: "It is predictable navigation, fast forms, clear status, and layouts that respect how operators work under pressure — not more gradients.",
    p1b: "If the stock number feels wrong once, people open Excel forever. Visual clarity without data integrity is just a nicer lie.",
    altA: "Team reviewing enterprise SaaS UX",
    captionA: "Operators judge software in the first few sessions.",
    h3: "Trust is a UX outcome",
    p2: "Empty states and error messages are part of UX. Vague failures create support tickets and shadow processes.",
    quote:
      "We chose the product our floor staff could learn in a shift — not the one with the longest feature PDF.",
    quoteBy: "Retail operations director",
    note: "Empty states and error messages are part of UX. Vague failures create support tickets.",
    h2b: "Ship clarity, measure adoption",
    p3: "Teams that ship clarity win. Teams that ship clutter create Excel workarounds — and the product never becomes the system of record.",
    altB: "Operators collaborating on clear software screens",
    captionB: "Clarity beats feature count on the floor.",
    h3b: "Test with real jobs",
    p4: "Ask real users to complete one job without a guide. That single test predicts adoption better than a stakeholder slideshow.",
    extra:
      "WAAMTO’s product work aims for that bar: calm interfaces over noisy chrome, with modules that share language and patterns.",
    close:
      "This week: time five new hires on one core task. Where they hesitate is your UX backlog.",
    pad1: "Keyboard paths for power users matter in POS and warehouse contexts. Mouse-only flows tire people.",
    pad2: "Consistency across modules reduces training cost more than any single ‘delight’ animation.",
  },
  {
    category: "Operations",
    slug: "erp-onboarding-without-chaos",
    title: "Onboarding teams to a new ERP without the chaos",
    excerpt:
      "A phased rollout approach that protects daily operations while people learn the new system.",
    author: "WaamTech Team",
    date: "2026-06-18",
    images: [P.team, P.meeting, P.office],
    tags: ["Operations", "Onboarding"],
    open: "Big-bang go-lives create fear and shadow systems. Teams need a path that keeps selling and shipping while they learn new screens.",
    h2a: "Phase by workflow, not by org chart alone",
    p1: "Master data first, then purchasing and inventory, then sales and finance. Train champions in each branch before the wider rollout.",
    p1b: "Keep a short escape hatch for true emergencies in week one — then close it. Permanent dual systems kill the project.",
    altA: "Team onboarding to a new ERP",
    captionA: "Phase by workflow — protect selling and shipping.",
    h3: "Measure the right signals",
    p2: "Adoption is fewer spreadsheet exports, faster order cycles, and cleaner month-end — not just login counts that make leadership feel good.",
    quote:
      "Our champions mattered more than the kickoff deck. Peers teach peers faster than vendors do.",
    quoteBy: "Transformation lead",
    note: "Keep a short escape hatch for true emergencies in week one — then close it.",
    h2b: "Protect peak season",
    p3: "Do not cut over the week of your biggest sale. Boring calendar discipline is underrated change management.",
    altB: "Champions coaching peers on new workflows",
    captionB: "Peer coaching beats slide decks after go-live.",
    h3b: "Document the ten transactions",
    p4: "Document the ten transactions that define your business. If those ten feel smooth, the rest of the ERP becomes teachable.",
    extra:
      "WAAMTO onboarding works best when industry and business profile are chosen early — so the workspace matches how you already operate.",
    close:
      "This week: name champions per branch and schedule their deep practice before anyone else is forced in.",
    pad1: "Celebrate removed spreadsheets publicly. Culture shifts when old tools lose status.",
    pad2: "Executive sponsors should use the same reports as managers. Parallel VIP spreadsheets undermine the program.",
  },
  {
    category: "Manufacturing",
    slug: "bom-work-orders-inventory-link",
    title: "BOM and work orders only work when inventory posts the truth",
    excerpt:
      "How production teams stop WIP fiction by tying shop-floor documents to real stock movements.",
    author: "Product Team",
    date: "2026-06-30",
    images: [P.manufacturing, P.factory, P.warehouse],
    tags: ["Manufacturing", "Inventory"],
    open: "A beautiful BOM that never depletes components is a brochure. Production ERP earns trust when work orders move materials the way the floor actually consumes them.",
    h2a: "WIP is a first-class citizen",
    p1: "If WIP only appears in a spreadsheet at month-end, scrap and rework will surprise you. Post issues and receipts with the work order as the spine.",
    p1b: "MRP needs honest on-hand. Material planning against fantasy stock creates panic POs.",
    altA: "Manufacturing work orders linked to inventory",
    captionA: "Work orders should move materials — not just print paper.",
    h3: "BOM quality before backflush",
    p2: "Backflushing can help — but only after you trust BOM quantities. Garbage BOM in, silent inventory theft out.",
    quote:
      "We stopped blaming ‘the system’ when our own adjustments were the reason planning failed.",
    quoteBy: "Plant manager",
    note: "Backflushing can help — but only after you trust the BOM quantities.",
    h2b: "Quality checks belong in the flow",
    p3: "Scrap and rework statuses keep costing honest. Hide them and finance invents numbers.",
    altB: "Shop floor production with material staging",
    captionB: "Staging and issues should match the work order spine.",
    h3b: "Pilot one line",
    p4: "Pilot one cell or line. Prove the loop. Then scale. Plant-wide day-one ambition is how morale breaks.",
    extra:
      "WAAMTO Manufacturing is meant to sit beside Inventory — so planners and finance stop arguing about which file is real.",
    close:
      "This week: pick one SKU family and reconcile BOM vs actual issues for ten work orders. That gap is your first project.",
    pad1: "Substitutions should be logged. Informal swaps poison planning forever.",
    pad2: "Shop-floor terminals need fewer fields, not more. Capture the truth quickly.",
  },
  {
    category: "CRM",
    slug: "crm-loyalty-customer-360",
    title: "CRM that sales teams use: pipeline, loyalty, and customer 360",
    excerpt:
      "Why CRM dies when it is a separate island — and how linking it to sales and POS keeps it alive.",
    author: "Customer Success",
    date: "2026-06-05",
    images: [P.meeting, P.office, P.checkout],
    tags: ["CRM", "Sales"],
    open: "CRM fails when it is a graveyard of leads nobody updates. It works when opportunities, activities, and customer history sit next to real invoices and POS visits.",
    h2a: "Customer 360 is an integration of habits",
    p1: "If sales cannot see open invoices and recent purchases, they fly blind. Linking CRM to sales and finance turns follow-ups into informed conversations.",
    p1b: "Mandatory fields that do not help the next call get filled with garbage. Design for the next conversation.",
    altA: "CRM pipeline and customer history",
    captionA: "Customer history should be one click, not three systems.",
    h3: "Loyalty is a retention system",
    p2: "Points programs that do not sync with POS create arguments at the counter. Loyalty belongs with CRM and checkout.",
    quote:
      "Our best reps lived in the CRM once it reflected money, not just notes.",
    quoteBy: "Sales manager, B2B distributor",
    note: "Mandatory fields that do not help the next call get filled with garbage.",
    h2b: "Pipeline hygiene beats vanity dashboards",
    p3: "Weekly pipeline reviews with clear next steps beat monthly charts that nobody believes.",
    altB: "Sales follow-up connected to real invoices",
    captionB: "Money-aware CRM gets used; note-only CRM gets abandoned.",
    h3b: "Migrate warm accounts first",
    p4: "Start with accounts you already invoice. Migrating cold leads first is how CRM projects lose political support.",
    extra:
      "WAAMTO CRM is built to sit with Sales and POS — so loyalty and follow-ups share the same customer truth.",
    close:
      "This week: require a next step date on every open opportunity. Hygiene beats hope.",
    pad1: "Give SDRs and account managers different layouts if needed — same data, different jobs.",
    pad2: "Measure CRM usage by completed activities that correlate with revenue, not by login streaks.",
  },
  {
    category: "HR",
    slug: "hr-payroll-multi-branch-attendance",
    title: "HR & payroll across branches: attendance that finance can trust",
    excerpt:
      "How multi-site teams reduce payroll disputes with clearer attendance, leave, and shift control.",
    author: "WaamTech Team",
    date: "2026-05-20",
    images: [P.team, P.office, P.meeting],
    tags: ["HR", "Payroll"],
    open: "Multi-branch payroll disputes usually start as attendance ambiguity. Late punches, shift swaps, and leave that never reached the sheet — then finance is asked to ‘just fix it.’",
    h2a: "Self-service reduces the admin tax",
    p1: "When employees can request leave and see attendance, HR stops being a human router for every exception. Managers approve; payroll inherits cleaner inputs.",
    p1b: "Do not go live on payroll mid-cycle without a parallel run. One clean parallel month buys trust.",
    altA: "HR payroll and attendance across branches",
    captionA: "Payroll arguments shrink when attendance is undisputed.",
    h3: "Shifts and overtime need rules, not memory",
    p2: "Stores and factories run on shifts. Encode the rules. Memory does not scale past the third branch.",
    quote:
      "Payroll week got quieter when attendance stopped arriving as WhatsApp screenshots.",
    quoteBy: "HR manager, retail chain",
    note: "Do not go live on payroll mid-cycle without a parallel run.",
    h2b: "HR data feeds operations",
    p3: "Who is present affects POS staffing and warehouse capacity. Treating HR as an island wastes that signal.",
    altB: "Managers approving leave and attendance",
    captionB: "Approvals on time matter more than fancy HR modules.",
    h3b: "Train approvers",
    p4: "Train store managers on approvals. Most payroll errors are approval latency, not calculation math.",
    extra:
      "WAAMTO HR & Payroll is meant for operators who need attendance and pay to survive peak weeks without drama.",
    close:
      "This week: pick one branch for a parallel payroll run. Compare exceptions before you expand.",
    pad1: "Publish overtime policy in the system, not only in a PDF nobody opens.",
    pad2: "Give employees a simple payslip explanation path. Confusion tickets are expensive.",
  },
  {
    category: "Purchasing",
    slug: "three-way-match-purchasing-control",
    title: "Three-way match without the headache: PO, GRN, invoice",
    excerpt:
      "Procurement control that protects margin — without burying the warehouse in bureaucracy.",
    author: "Product Team",
    date: "2026-05-02",
    images: [P.wholesale, P.boxes, P.warehouse],
    tags: ["Purchasing", "Control"],
    open: "Paying supplier invoices without matching receipts is how leakage becomes culture. Three-way match sounds heavy; done well, it is just disciplined documents.",
    h2a: "PO clarity up front",
    p1: "Vague purchase orders create vague receipts. Quantities, warehouses, and expected costs should be explicit before goods arrive.",
    p1b: "Partial receipts are normal. Your process should allow them without inventing a second unofficial PO.",
    altA: "Purchase order and goods receipt matching",
    captionA: "Match before you pay — calmly.",
    h3: "GRN is the warehouse’s signature",
    p2: "If receiving is optional, inventory and AP will both lie. Make GRN the gate to stock increase.",
    quote:
      "We caught more pricing errors in matching than in any quarterly vendor meeting.",
    quoteBy: "Procurement lead",
    note: "Partial receipts are normal — allow them without unofficial second POs.",
    h2b: "Landed costs belong in the story",
    p3: "Freight and duties that never hit item cost make margin reports optimistic. Capture landed cost where inventory valuation lives.",
    altB: "Warehouse receiving against purchase orders",
    captionB: "GRN discipline is how AP and inventory stay aligned.",
    h3b: "Vendor data from documents",
    p4: "Vendor scorecards are useless without on-time and quality data from real receipts. The documents are the dataset.",
    extra:
      "WAAMTO Purchasing connects vendors, POs, GRN, and invoices so finance and warehouse stop arguing from different folders.",
    close:
      "This week: sample twenty paid invoices and ask how many had a clean three-way match. That percentage is your control baseline.",
    pad1: "Separate emergency buys from standard POs — then review emergency volume weekly.",
    pad2: "Price variances should route to someone who can renegotiate, not disappear into ‘misc.’",
  },
];

function emitProper(postsArr) {
  let s = `import type { BlogPost } from "@/types";
import { optimizeImageUrl } from "@/lib/images";

/** Cover ~1200px WebP q70 */
const cover = (path: string) =>
  optimizeImageUrl(\`https://images.unsplash.com/\${path}\`, { width: 1200, quality: 70 });
/** Inline body images ~800px WebP q70 — keep pages light */
const inline = (path: string) =>
  optimizeImageUrl(\`https://images.unsplash.com/\${path}\`, { width: 800, quality: 70 });

/** SEO blog posts — industry + category guides (~5000+ chars, unique inline images). */
export const blogPosts: BlogPost[] = [
`;

  for (const p of postsArr) {
    s += `  {\n`;
    s += `    id: ${JSON.stringify(p.id)},\n`;
    s += `    title: ${JSON.stringify(p.title)},\n`;
    s += `    slug: ${JSON.stringify(p.slug)},\n`;
    s += `    excerpt: ${JSON.stringify(p.excerpt)},\n`;
    s += `    category: ${JSON.stringify(p.category)},\n`;
    if (p.industry) s += `    industry: ${JSON.stringify(p.industry)},\n`;
    s += `    author: ${JSON.stringify(p.author)},\n`;
    s += `    date: ${JSON.stringify(p.date)},\n`;
    s += `    readTime: ${JSON.stringify(p.readTime)},\n`;
    if (p.featured) s += `    featured: true,\n`;
    s += `    image: cover(${JSON.stringify(p.image)}),\n`;
    if (p.tags?.length) s += `    tags: ${JSON.stringify(p.tags)},\n`;
    s += `    blocks: [\n`;
    for (const b of p.blocks) {
      if (b.type === "image") {
        s += `      {\n`;
        s += `        type: "image",\n`;
        s += `        src: inline(${JSON.stringify(b.src)}),\n`;
        s += `        alt: ${JSON.stringify(b.alt)},\n`;
        if (b.caption) s += `        caption: ${JSON.stringify(b.caption)},\n`;
        s += `      },\n`;
      } else if (b.type === "quote") {
        s += `      {\n`;
        s += `        type: "quote",\n`;
        s += `        text: ${JSON.stringify(b.text)},\n`;
        if (b.attribution) s += `        attribution: ${JSON.stringify(b.attribution)},\n`;
        s += `      },\n`;
      } else {
        s += `      { type: ${JSON.stringify(b.type)}, text: ${JSON.stringify(b.text)} },\n`;
      }
    }
    s += `    ],\n`;
    s += `  },\n`;
  }

  s += `];\n`;
  return s;
}

const posts = [...industries.map(industryPost), ...topics.map(topicPost)];
posts.forEach((p, i) => {
  p.featured = i === 0;
});

const target = path.join(root, "src/lib/data/blog-posts.ts");
fs.writeFileSync(target, emitProper(posts), "utf8");
console.log(`Wrote ${posts.length} posts to ${target}`);
for (const p of posts) {
  const imgs = p.blocks.filter((b) => b.type === "image").map((b) => b.src);
  const repeat = imgs.includes(p.image);
  console.log(
    `- ${p.slug} (${charCount(p.blocks)} chars) cover≠inline:${!repeat} [${p.category}]`
  );
}
