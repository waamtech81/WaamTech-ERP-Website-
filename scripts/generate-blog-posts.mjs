/**
 * Generates SEO blog posts for industries + topic categories.
 * Run: node scripts/generate-blog-posts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const img = (id, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fm=webp&fit=crop&w=${w}&q=70`;

const IMAGES = {
  retail: "photo-1441986300917-64674bd600d8",
  warehouse: "photo-1586528116311-ad8dd3c8310d",
  pharmacy: "photo-1587854692152-cbe660dbde88",
  restaurant: "photo-1517248135467-4c7edcad34c4",
  manufacturing: "photo-1565043589221-1a6fd9ae45c7",
  automotive: "photo-1486262715619-67b85e0b08d3",
  finance: "photo-1554224155-6726b3ff858f",
  office: "photo-1497366216548-37526070297c",
  team: "photo-1522071820081-009f0129c71c",
  pos: "photo-1556742049-0cfed4f6a45d",
  ai: "photo-1677442136019-21780ecad995",
  dashboard: "photo-1460925895917-afdab827c52f",
  construction: "photo-1504307651254-35680f356dfd",
  education: "photo-1523050854058-8df90110c9f1",
  agriculture: "photo-1625246333195-78d9c38ad449",
  textile: "photo-1558171813-4c088753af8f",
  furniture: "photo-1555041469-a586c61ea9bc",
  beauty: "photo-1596462502278-27bfdc403348",
  pet: "photo-1450778869180-41d0601e046e",
  water: "photo-1548839140-29a749e1cf4d",
  realestate: "photo-1560518883-ce09059eeffa",
  hospital: "photo-1519494026892-80bbd2d6fd0d",
  wholesale: "photo-1553413077-190dd305871c",
  electronics: "photo-1550009158-9aad2623fef5",
};

function blocks(parts) {
  return parts;
}

function charCount(blks) {
  return blks.reduce((n, b) => n + (b.text?.length || 0) + (b.caption?.length || 0), 0);
}

function industryPost(ind, index) {
  const slug = `erp-for-${ind.slug}`;
  const blks = blocks([
    {
      type: "p",
      text: `If you run a ${ind.name.toLowerCase()} business, you already know the messy middle: stock that looks right on paper, sales that land late in the books, and a spreadsheet someone swears is “the real one.” That gap is where money leaks — quietly, every week.`,
    },
    {
      type: "h2",
      text: `What ${ind.name} operators actually need from an ERP`,
    },
    {
      type: "p",
      text: ind.need,
    },
    {
      type: "image",
      src: img(ind.image, 1000),
      alt: `${ind.name} operations with WAAMTO ERP`,
      caption: `${ind.name} teams move faster when inventory, sales, and finance share one record.`,
    },
    {
      type: "h3",
      text: "Start with the daily workflow, not the feature list",
    },
    {
      type: "p",
      text: `Most rollouts stall because teams try to “implement everything.” In ${ind.name.toLowerCase()}, the better path is boring and effective: map receiving, selling, and closing the day first. Once those three loops are clean, modules like CRM, HR, or manufacturing stop feeling like extra software and start feeling like extensions of work you already do.`,
    },
    {
      type: "quote",
      text: ind.quote,
      attribution: ind.quoteBy,
    },
    {
      type: "note",
      text: ind.note,
    },
    {
      type: "h2",
      text: "A practical checklist before you switch systems",
    },
    {
      type: "p",
      text: `Write down your top ten SKUs or services, your busiest branch, and the report your owner asks for every Monday. If a platform cannot answer those without a side spreadsheet, keep looking. WAAMTO is built for multi-branch ${ind.name.toLowerCase()} operations — POS where you need it, inventory that stays honest, and finance that closes without a weekend of reconciliation.`,
    },
    {
      type: "p",
      text: `Ready to see it against your own profile? Pick ${ind.name} during signup, choose your business category, and run the free trial with real workflows — not a demo script.`,
    },
  ]);

  const chars = charCount(blks);
  // pad if under ~2000
  if (chars < 1950) {
    blks.splice(blks.length - 1, 0, {
      type: "p",
      text: ind.extra,
    });
  }
  if (charCount(blks) < 2000) {
    blks.splice(blks.length - 1, 0, {
      type: "p",
      text: `Operators evaluating software for ${ind.name} should insist on a live walkthrough of receiving, a sale or job, and the report their owner asks for every Monday. If those three steps still need a side spreadsheet, the platform is not ready for your floor — no matter how polished the marketing site looks.`,
    });
  }

  return {
    id: `ind-${index + 1}`,
    title: ind.title,
    slug,
    excerpt: ind.excerpt,
    category: "Industry",
    industry: ind.name,
    author: "WaamTech Editorial",
    date: ind.date,
    readTime: "8 min",
    image: img(ind.image, 1200),
    tags: [ind.name, "ERP", "Operations"],
    featured: index === 0,
    blocks: blks,
  };
}

const industries = [
  {
    name: "Retail & Commerce",
    slug: "retail-commerce",
    image: IMAGES.retail,
    date: "2026-07-18",
    title: "Retail ERP that keeps the floor, the stockroom, and the books in sync",
    excerpt:
      "How multi-store retail teams stop overselling, speed up checkout, and finally trust Monday’s numbers.",
    need: "Retail is not one workflow. A busy till needs speed. A back office needs transfers and counts. Finance needs clean sales and returns. When those live in separate tools, cashiers invent workarounds and managers lose weekends to reconciliation.",
    quote:
      "We stopped arguing about which spreadsheet was right the week POS and inventory started updating the same stock figure.",
    quoteBy: "Store operations lead, multi-branch retail",
    note: "If your e-commerce channel and physical stores do not share reservations, you will oversell your best SKUs during promotions — every time.",
    extra:
      "Promotions, loyalty, and gift cards only help when the counter and the warehouse agree. That is why retail ERP should treat omnichannel stock as a first-class problem, not an integration project you promise for “phase two.”",
  },
  {
    name: "Automotive & Vehicle",
    slug: "automotive-vehicle",
    image: IMAGES.automotive,
    date: "2026-07-17",
    title: "Parts, service jobs, and dealership stock — without the guessing",
    excerpt:
      "A field guide for workshops and parts counters that need catalog accuracy, job cards, and purchase control.",
    need: "Automotive businesses live on part numbers, interchange, and urgency. A missing gasket delays a bay; a wrong GRN messes up cost. You need catalog-friendly inventory, job-linked parts consumption, and purchasing that does not bury the workshop in paper.",
    quote:
      "The bay does not care about your ERP roadmap. It cares whether the part is on the shelf this afternoon.",
    quoteBy: "Service manager, multi-brand workshop",
    note: "Serials and warranties matter on high-value parts. If you cannot trace a returned alternator to the supplier invoice, margin arguments never end.",
    extra:
      "Linking service tickets to stock issues and purchase orders cuts the classic loop: tech waits, counter guesses, purchasing over-orders “just in case.” One connected flow is quieter — and cheaper.",
  },
  {
    name: "Healthcare & Pharmacy",
    slug: "healthcare-pharmacy",
    image: IMAGES.pharmacy,
    date: "2026-07-16",
    title: "Pharmacy ERP: expiry, batches, and counter speed that still feel human",
    excerpt:
      "Why pharmacies need more than a billing app — and how batch control protects both patients and profit.",
    need: "Pharmacies juggle FEFO, regulated items, and peak-hour counters. Expiry is not a report you run monthly; it is a daily risk. An ERP for pharmacy retail must respect batches, near-expiry alerts, and POS that does not slow the pharmacist when the queue builds.",
    quote:
      "We used to discover expired stock during audits. Now the system nudges us weeks earlier — before it becomes a write-off conversation.",
    quoteBy: "Pharmacy owner, multi-outlet network",
    note: "Never separate POS from inventory in pharmacy. A sale without batch deduction is how compliance and costing both fail.",
    extra:
      "Suppliers, purchase returns, and controlled-item trails belong in the same system as the till. That is what turns “we think we are compliant” into something you can show an auditor without panic.",
  },
  {
    name: "Real Estate & Property",
    slug: "real-estate-property",
    image: IMAGES.realestate,
    date: "2026-07-15",
    title: "Property operations ERP: units, collections, and vendor work in one place",
    excerpt:
      "Landlords and agencies lose less rent and fewer maintenance tickets when portfolios share one operational spine.",
    need: "Property teams track units, tenants, collections, and maintenance vendors. Spreadsheets hide arrears until they hurt. An ERP-minded stack for real estate keeps customer (tenant) records, receivables, and service work connected — so collections and facilities are not two different truths.",
    quote:
      "Once maintenance tickets and rent ledgers stopped living in separate inboxes, follow-ups became routine instead of heroic.",
    quoteBy: "Portfolio manager, mid-size agency",
    note: "Treat each building like a branch: shared policies, local activity, and clear ownership of who collects and who closes tickets.",
    extra:
      "CRM for leads, finance for collections, and purchasing for contractors — used together — is how growing agencies avoid hiring another person just to chase status updates across tools.",
  },
  {
    name: "Manufacturing",
    slug: "manufacturing",
    image: IMAGES.manufacturing,
    date: "2026-07-14",
    title: "Manufacturing ERP without the shop-floor chaos",
    excerpt:
      "BOM, work orders, and inventory that stay honest when production and purchasing pull in different directions.",
    need: "Manufacturers feel pain when BOM, WIP, and finished goods disagree. Material shortages surprise the floor; scrap never hits costing. A practical manufacturing ERP ties work orders to inventory movements and gives planners a chance to act before the line stops.",
    quote:
      "We did not need more reports. We needed the work order to deduct the same components the planner thought we had.",
    quoteBy: "Production lead, light assembly plant",
    note: "If WIP costing is an end-of-month spreadsheet, you are flying blind on true margin until it is too late to fix the month.",
    extra:
      "Start with one product family: clean BOM, clear work orders, and receiving that posts to the right warehouse. Expand after the first line trusts the numbers — adoption beats ambition.",
  },
  {
    name: "Wholesale & Distribution",
    slug: "wholesale-distribution",
    image: IMAGES.wholesale,
    date: "2026-07-13",
    title: "Wholesale ERP for credit, bulk pricing, and routes that actually ship",
    excerpt:
      "Distributors win when price lists, credit limits, and warehouse picking stop fighting each other.",
    need: "Wholesale is quote-to-delivery under pressure. Sales wants flexibility; finance wants credit control; the warehouse wants clear pick lists. ERP for distribution should connect sales orders, stock reservations, and receivables so vans leave with the right goods and the right paperwork.",
    quote:
      "Credit holds used to be a phone call. Now the order status tells the salesperson before they overpromise.",
    quoteBy: "Sales director, regional distributor",
    note: "Bulk price lists only help if the invoice cannot silently fall back to the wrong tier. Audit that once — you will sleep better.",
    extra:
      "Returns and damaged stock need the same discipline as outbound. Treat them as first-class documents and your landed cost and customer statements stay believable.",
  },
  {
    name: "Warehouse & Logistics",
    slug: "warehouse-logistics",
    image: IMAGES.warehouse,
    date: "2026-07-12",
    title: "Warehouse ERP: scanning, transfers, and SLAs without spreadsheet heroes",
    excerpt:
      "How fulfillment teams cut mis-picks and keep multi-location stock trustworthy under volume.",
    need: "Warehouses fail on ambiguity: which bin, which batch, which transfer status. High-velocity ops need scanning-friendly flows, clear putaway, and transfer documents that do not die in WhatsApp. Inventory ERP is the backbone; logistics discipline is the habit.",
    quote:
      "Our ‘urgent’ transfers dropped once every movement had a status people trusted.",
    quoteBy: "Warehouse supervisor, 3PL-adjacent brand",
    note: "Cycle counts are cheaper than annual full counts — but only if the system makes variance visible the same day.",
    extra:
      "Pair warehouse discipline with purchasing and sales so inbound ASNs and outbound waves are not two separate calendars. That is where SLA conversations get calmer.",
  },
  {
    name: "Restaurant & Food Service",
    slug: "restaurant-food-service",
    image: IMAGES.restaurant,
    date: "2026-07-11",
    title: "Restaurant ERP: recipes, waste, and multi-outlet control that chefs will use",
    excerpt:
      "Food cost only improves when POS, recipes, and store inventory tell the same story after a busy Friday.",
    need: "Restaurants bleed margin through portion drift, waste, and transfers between outlets that never get recorded. A food-service ERP mindset connects POS sales to recipe consumption and keeps central kitchen or commissary stock honest.",
    quote:
      "We stopped guessing food cost after weekend rushes when recipe depletion finally matched what left the pass.",
    quoteBy: "Ops manager, multi-outlet cafe group",
    note: "If half your waste is logged on paper napkins, your theoretical food cost is fiction. Capture waste in the system while the shift is still open.",
    extra:
      "Menu engineering needs clean sales mix plus ingredient cost. That is an ERP problem dressed as a culinary conversation — solve the data, then debate the menu.",
  },
  {
    name: "Education",
    slug: "education",
    image: IMAGES.education,
    date: "2026-07-10",
    title: "Education operations: fees, stores, and campus inventory without the admin spiral",
    excerpt:
      "Institutes run smoother when fee-linked finance, campus stores, and HR share one operational backbone.",
    need: "Schools and institutes are multi-department businesses: fee collection, bookstore or lab inventory, staff payroll, and purchasing for facilities. Fragmented tools create duplicate student/vendor records and late month-ends.",
    quote:
      "Parents ask simple questions. Our old stack made simple answers take three departments.",
    quoteBy: "Admin head, private campus network",
    note: "Treat each campus like a branch with shared chart of accounts — consolidation gets easier when the structure is intentional from day one.",
    extra:
      "Start with finance and inventory for the store/lab, then layer HR. Big-bang campus ERP projects fail; phased workflows that protect fee season succeed.",
  },
  {
    name: "Hospital & Medical",
    slug: "hospital-medical",
    image: IMAGES.hospital,
    date: "2026-07-09",
    title: "Hospital supply chain ERP: clinical demand meets inventory reality",
    excerpt:
      "Clinics and hospitals reduce stockouts on critical items when purchasing, stores, and finance share live demand signals.",
    need: "Medical facilities cannot treat consumables like casual retail stock. Critical items need par levels, batch tracking where relevant, and purchasing that reacts to usage — not gut feel. Operational ERP links store issues to departments and keeps spend visible.",
    quote:
      "We used to discover critical shortages at the worst moment. Par alerts are quieter — and safer.",
    quoteBy: "Materials manager, specialty clinic group",
    note: "Separate ‘clinical urgency’ from ‘procurement process,’ but never disconnect them. Urgency without a PO trail becomes uncontrolled spend.",
    extra:
      "Vendor performance and expiry on medical supplies deserve the same seriousness as pharmacy retail. One system of record beats heroic night runs to suppliers.",
  },
  {
    name: "Agriculture",
    slug: "agriculture",
    image: IMAGES.agriculture,
    date: "2026-07-08",
    title: "Agribusiness ERP: seasonal stock, inputs, and dealer networks",
    excerpt:
      "Fertilizer, seed, and agri-input sellers need seasonal planning and dealer credit that spreadsheets cannot hold.",
    need: "Agriculture supply businesses live on seasons, bulk SKUs, and dealer relationships. Overstock after the window is dead capital; understock during peak is lost share. ERP helps with purchasing timing, warehouse transfers to regional depots, and credit on dealer accounts.",
    quote:
      "Season planning got honest when warehouse and finance looked at the same depot balances.",
    quoteBy: "Regional distributor, agri inputs",
    note: "Batch and lot tracking for inputs is not optional when quality claims arrive after sowing season starts.",
    extra:
      "Pair CRM for dealer follow-ups with sales orders and stock. The salesperson who promises delivery without reserved stock is how peak season turns into reputation damage.",
  },
  {
    name: "Textile & Garments",
    slug: "textile-garments",
    image: IMAGES.textile,
    date: "2026-07-07",
    title: "Garment ERP: variants, seasons, and transfers that keep boutiques stocked",
    excerpt:
      "Size-color matrices break spreadsheets. Here is how apparel teams keep channels and stores aligned.",
    need: "Apparel multiplies SKUs through size and color. Without variant-aware inventory, transfers and POS become guesswork. Textile and garment businesses need seasonality, store transfers, and purchasing that understands what actually sold — not what buyers hoped would sell.",
    quote:
      "We finally stopped shipping the wrong size runs once variants were first-class in stock, not footnotes in Excel.",
    quoteBy: "Merchandiser, multi-brand fashion retail",
    note: "End-of-season markdowns hurt less when you can see aging by variant early — not after the table is full of leftovers.",
    extra:
      "Wholesale and retail channels under one brand need shared availability with channel-specific pricing. That is classic ERP territory done right.",
  },
  {
    name: "Furniture & Interior",
    slug: "furniture-interior",
    image: IMAGES.furniture,
    date: "2026-07-06",
    title: "Furniture ERP for showrooms, custom orders, and delivery promises",
    excerpt:
      "Made-to-order and showroom stock need different rhythms — your system should respect both.",
    need: "Furniture retail mixes floor models, warehouse stock, and custom manufacturing lead times. Customers remember broken delivery promises. An ERP approach ties sales orders to procurement or work orders and keeps deposits, balances, and delivery schedules visible.",
    quote:
      "The day we linked deposits to order status, ‘where is my sofa?’ calls got shorter.",
    quoteBy: "Showroom manager, home interiors brand",
    note: "Floor models need clear status: display, reserved, or available to sell. Ambiguous status is how double-selling happens.",
    extra:
      "If you manufacture or assemble, connect BOM-light work orders to inventory so finishing materials do not mysteriously vanish from the store count.",
  },
  {
    name: "Building Materials & Hardware",
    slug: "building-materials-hardware",
    image: IMAGES.construction,
    date: "2026-07-05",
    title: "Hardware & building materials: bulk units, job sites, and contractor credit",
    excerpt:
      "Counter sales plus project deliveries need unit conversions, credit control, and stock that matches the yard.",
    need: "Hardware and building materials dealers sell in bags, tons, pieces, and kits. Unit conversion mistakes destroy margin. Contractors need credit; cash customers need speed. ERP should handle multi-unit inventory, sales, and purchasing with yard/warehouse accuracy.",
    quote:
      "We stopped losing margin on unit mistakes when the system enforced the conversion we used to ‘remember.’",
    quoteBy: "Owner, regional building materials yard",
    note: "Project deliveries without linked sales orders become unbillable loads. Document the load before the truck leaves.",
    extra:
      "Slow-moving SKUs hide in large yards. Aging reports and cycle counts on high-value aisles pay for themselves faster than a full annual count.",
  },
  {
    name: "Beauty & Cosmetics",
    slug: "beauty-cosmetics",
    image: IMAGES.beauty,
    date: "2026-07-04",
    title: "Beauty retail ERP: batches, boutiques, and salon inventory that stays pretty accurate",
    excerpt:
      "Cosmetics and salon brands protect margin with expiry awareness, variants, and POS that matches the back room.",
    need: "Beauty retail mixes high SKU counts, shade variants, and sometimes expiry-sensitive products. Salons also consume retail stock in services. You need inventory discipline plus POS/CRM for loyalty — without letting the back room drift from the shelf.",
    quote:
      "Shade returns dropped when the till and the stockroom finally agreed on what we actually had.",
    quoteBy: "Retail lead, cosmetics boutique chain",
    note: "Gift-with-purchase and promo kits must deplete components correctly or your ‘successful’ campaign silently steals margin.",
    extra:
      "Salon + retail hybrids should treat service usage as inventory movement. Otherwise the retail shelf always looks fuller than reality.",
  },
  {
    name: "Pet & Veterinary",
    slug: "pet-veterinary",
    image: IMAGES.pet,
    date: "2026-07-03",
    title: "Pet retail & clinic ops: SKUs, meds, and appointments without stock surprises",
    excerpt:
      "Pet stores and clinics share one problem — living inventory needs and medical items that cannot go missing.",
    need: "Pet businesses combine retail SKUs with clinic consumables. Meds and specialty foods need careful receiving; the front counter needs fast POS. A unified operational system keeps clinic usage and retail sales from double-counting the same bag of food.",
    quote:
      "Clinic drawers and the retail aisle stopped fighting once every issue posted to the same inventory.",
    quoteBy: "Practice manager, pet clinic + store",
    note: "Track high-value meds like you would pharmacy batches. ‘We thought we had it’ is not a clinical plan.",
    extra:
      "Loyalty for pet parents works best when purchase history and clinic visits are not trapped in two databases. CRM plus POS is the friendly face of that discipline.",
  },
  {
    name: "Water Management",
    slug: "water-management",
    image: IMAGES.water,
    date: "2026-07-02",
    title: "Water business ERP: tanks, routes, and refill operations that scale",
    excerpt:
      "Bottled water and refill networks need route-friendly sales, deposit tracking, and warehouse clarity.",
    need: "Water distribution mixes empty/full bottle logistics, deposits, and route sales. Missing empties and unclear van stock destroy profit. ERP thinking brings inventory of empties and filled units, sales on routes, and purchasing of materials into one place.",
    quote:
      "Van stock counts stopped being a daily argument when empties and filled bottles had clear statuses.",
    quoteBy: "Ops head, regional water network",
    note: "Deposits are liability and inventory at once. If your system cannot express that cleanly, your books will always feel ‘almost right.’",
    extra:
      "Route planning improves when sales history and customer CRM notes live next to stock. Drivers should not be the only people who know which shop always underpays.",
  },
];

function topicPost(t, index) {
  const blks = [
    { type: "p", text: t.open },
    { type: "h2", text: t.h2a },
    { type: "p", text: t.p1 },
    {
      type: "image",
      src: img(t.image, 1000),
      alt: t.imageAlt,
      caption: t.caption,
    },
    { type: "h3", text: t.h3 },
    { type: "p", text: t.p2 },
    { type: "quote", text: t.quote, attribution: t.quoteBy },
    { type: "note", text: t.note },
    { type: "h2", text: t.h2b },
    { type: "p", text: t.p3 },
    { type: "p", text: t.close },
  ];
  if (charCount(blks) < 1950) {
    blks.splice(-1, 0, { type: "p", text: t.extra });
  }

  const pads = [
    t.extra2 ||
      `Before you buy, write the ten transactions that define how ${t.category} work actually happens in your company. Ask the vendor to run those exact steps in a trial workspace. Brochure demos skip the exceptions — your exceptions are where projects die.`,
    t.extra3 ||
      `Document owners for master data early: who owns SKUs, customers, and chart of accounts. Unowned data becomes everyone’s problem and nobody’s priority — which is how ${t.category.toLowerCase()} modules lose credibility in month two.`,
    `One last habit that helps ${t.category} rollouts: keep a weekly 30-minute review for the first month after go-live. Look at exceptions, not vanity dashboards. The teams that schedule that meeting quietly outperform the ones that only celebrate launch day.`,
    `If you are comparing vendors, score them on time-to-first-successful-day-close — not on slide count. A ${t.category} module that cannot finish a normal day without Excel will not suddenly become trustworthy after training.`,
    `Finally, keep change small: one branch or one workflow first. ${t.category} programs that try to boil the ocean create political resistance. Proof on a small canvas buys permission for the next canvas.`,
  ];
  for (const pad of pads) {
    if (charCount(blks) >= 2050) break;
    blks.splice(-1, 0, { type: "p", text: pad });
  }
  return {
    id: `cat-${index + 1}`,
    title: t.title,
    slug: t.slug,
    excerpt: t.excerpt,
    category: t.category,
    author: t.author,
    date: t.date,
    readTime: "7 min",
    image: img(t.image, 1200),
    tags: t.tags,
    featured: false,
    blocks: blks,
  };
}

const topics = [
  {
    category: "ERP",
    slug: "modern-erp-operational-visibility",
    title: "How modern ERPs reduce operational blind spots",
    excerpt:
      "A practical look at unifying inventory, finance, and sales data into one decision layer.",
    author: "WaamTech Team",
    date: "2026-06-12",
    image: IMAGES.dashboard,
    imageAlt: "Operations dashboard with unified metrics",
    caption: "One shared record beats three conflicting reports.",
    tags: ["ERP", "Visibility"],
    open: "Modern enterprises lose time when inventory, finance, and sales live in separate tools. Reports disagree, teams chase spreadsheets, and decisions lag behind what actually happened on the floor yesterday.",
    h2a: "Blind spots are usually process gaps, not ‘missing AI’",
    p1: "A modern ERP closes those gaps by making one shared record the source of truth. Stock movements update costing, invoices reflect real fulfillment, and managers see the same numbers on every screen — without exporting to Excel to ‘make it make sense.’",
    h3: "Pick the workflows people touch daily",
    p2: "Start with receiving, selling, and reconciling. If those three loops are messy, no amount of fancy analytics will save the month. Clarity and data integrity still beat feature count.",
    quote:
      "We did not need another dashboard. We needed the dashboard to stop lying because the modules disagreed.",
    quoteBy: "COO, multi-branch operator",
    note: "If two departments can post the same economic event in different ways, you do not have an ERP yet — you have a collection of apps.",
    h2b: "What ‘good enough’ looks like in the first 90 days",
    p3: "Success is fewer shadow spreadsheets, faster month-end, and branch managers who stop calling HQ for ‘the real stock number.’ Expand modules only after that trust exists.",
    close:
      "WAAMTO is built around that sequence: inventory and commerce first, then finance and CRM, with AI that asks questions against your own data — not a black box.",
    extra:
      "Treat integrations as exceptions, not the architecture. The more your core flows stay inside one system, the fewer midnight fixes you inherit from brittle connectors.",
  },
  {
    category: "Inventory",
    slug: "multi-warehouse-inventory-design",
    title: "Designing inventory systems for multi-warehouse brands",
    excerpt:
      "Patterns that keep stock accurate when products move across regions and channels.",
    author: "Product Team",
    date: "2026-05-28",
    image: IMAGES.warehouse,
    imageAlt: "Multi-warehouse inventory operations",
    caption: "Transfers need statuses people believe — not WhatsApp threads.",
    tags: ["Inventory", "Warehouse"],
    open: "Multi-warehouse brands fail when each location invents its own stock rules. Transfers get lost, channels oversell, and cycle counts never catch up to reality.",
    h2a: "Design around locations, reservations, and audit trails",
    p1: "Every quantity should know its warehouse. Online and POS demand should reserve stock deliberately. Every movement — including adjustments — should leave a trail finance can trust.",
    h3: "Transfers are a product, not a side chat",
    p2: "In-transit stock that disappears into a group chat is how shrinkage stories begin. Statuses like requested, shipped, and received keep both ends honest.",
    quote:
      "When planners could rebalance before stockouts, we stopped treating warehouses like rival companies.",
    quoteBy: "Inventory planner, regional brand",
    note: "Negative stock is a symptom. Fix the posting rules that allow it before you celebrate ‘automation.’",
    h2b: "Landed cost and valuation follow clean movements",
    p3: "Finance cannot trust valuation if warehouse documents are optional. Make receiving and transfers mandatory habits, then costing stops being a monthly archaeology dig.",
    close:
      "WAAMTO Inventory is built for multi-warehouse truth: batches, serials, transfers, and reorder signals that respect how stock actually moves.",
    extra:
      "Cycle count the noisy aisles weekly. Full counts annually are theater if daily discipline is missing.",
  },
  {
    category: "POS",
    slug: "pos-inventory-sync",
    title: "POS and inventory: keeping the counter and the warehouse in sync",
    excerpt:
      "Why real-time stock at the till prevents overselling, shrinkage, and end-of-day surprises.",
    author: "Product Team",
    date: "2026-07-08",
    image: IMAGES.pos,
    imageAlt: "Point of sale counter synced with inventory",
    caption: "The till should not sell a ghost SKU.",
    tags: ["POS", "Retail"],
    open: "When POS and inventory run on different clocks, cashiers sell what the warehouse already moved — or refuse sales that stock could cover. Customers feel that confusion immediately.",
    h2a: "Reserve and deplete at sale time",
    p1: "A unified stack reserves and depletes stock when the sale happens, supports returns cleanly, and keeps branch managers aligned with finance on daily totals.",
    h3: "Offline is not optional for real stores",
    p2: "Internet drops. The counter cannot. Offline-capable POS with later sync is the difference between a bad hour and a lost day.",
    quote:
      "Shift close got shorter the week cash variance and stock variance stopped living in different notebooks.",
    quoteBy: "Retail supervisor",
    note: "Promotions that ignore stock reservations create the worst kind of success: revenue today, apology posts tomorrow.",
    h2b: "Returns deserve the same care as sales",
    p3: "A return that restocks the wrong batch or warehouse quietly poisons the next week’s counts. Document returns like you document sales.",
    close:
      "Retail and restaurant operators who close that loop spend less time reconciling and more time serving customers — which is the whole point.",
    extra:
      "Train cashiers on holds and returns with the same seriousness as payment methods. Those flows are where inventory integrity is won or lost.",
  },
  {
    category: "Finance",
    slug: "multi-branch-finance",
    title: "Multi-branch finance: one ledger, many locations",
    excerpt:
      "How shared accounting structures help growing brands stay audit-ready across cities.",
    author: "Customer Success",
    date: "2026-06-24",
    image: IMAGES.finance,
    imageAlt: "Multi-branch finance and cash control",
    caption: "Consolidation is easier when branches share structure.",
    tags: ["Finance", "Multi-branch"],
    open: "Growing brands often open branches faster than they fix reporting. Each site invents local spreadsheets, and group finance spends weeks closing the month.",
    h2a: "Shared chart, local activity",
    p1: "A shared chart of accounts, branch dimensions, and consistent posting rules make consolidation routine instead of heroic. Local managers still run their store — they just post into a structure HQ understands.",
    h3: "Cash and banks cannot be optional modules",
    p2: "If cash books and bank reconciliation live outside the ERP, your P&L will always feel slightly fictional. Bring them in early.",
    quote:
      "Month-end stopped being a hostage situation once every location posted the same way.",
    quoteBy: "Group accountant",
    note: "Inter-branch transfers without accounting entries create phantom profit. Document both the stock and the books.",
    h2b: "Audit trails are a product feature",
    p3: "When leadership gets timely P&L and auditors get a clear trail, you have operational maturity — not just software licenses.",
    close:
      "WAAMTO Finance is designed to sit next to inventory and sales so the ledger reflects the business you actually ran.",
    extra:
      "Budget vs actual only helps if the actuals are trustworthy. Fix posting quality before you debate budget ambition.",
  },
  {
    category: "AI",
    slug: "ai-in-erp-data-control",
    title: "Using AI in ERP without losing control of your data",
    excerpt:
      "Practical ways to use assistants and document AI while keeping audit trails and privacy intact.",
    author: "WaamTech Team",
    date: "2026-07-02",
    image: IMAGES.ai,
    imageAlt: "AI workspace inside ERP with human control",
    caption: "AI suggests. Operators confirm. Audit stays intact.",
    tags: ["AI", "Security"],
    open: "AI in ERP should speed up questions, document capture, and recommendations — not send sensitive business data into opaque third-party black boxes you cannot explain to a board.",
    h2a: "Prefer assistants that work against your modules",
    p1: "The useful pattern is module-aware help: ask about stock, sales, or receivables inside your own stack, with logged activity and clear limits on what the assistant can change.",
    h3: "OCR is a workflow, not a party trick",
    p2: "Document AI that turns vendor invoices into draft bills saves hours — if humans still approve the posting. That human gate is how you keep control.",
    quote:
      "We let AI draft. We never let it silently post. That one rule kept finance calm.",
    quoteBy: "Finance controller",
    note: "If you cannot answer ‘what did the AI change last Tuesday?,’ you are not ready for autonomous actions.",
    h2b: "Recommendations should be rejectable",
    p3: "Reorder suggestions and CRM follow-ups are valuable when acceptance is intentional. Forced automation creates distrust faster than no AI at all.",
    close:
      "WAAMTO’s AI Workspace is built for private, auditable assistance on your installed modules — Assistant, Document OCR, and recommendations you can accept or dismiss.",
    extra:
      "Train teams on when to trust a suggestion. AI literacy is an operations skill now, not a side hobby for IT.",
  },
  {
    category: "Pricing",
    slug: "erp-subscription-planning",
    title: "A practical guide to ERP subscription planning",
    excerpt:
      "How to choose the right plan as your team, locations, and modules grow.",
    author: "Customer Success",
    date: "2026-04-22",
    image: IMAGES.office,
    imageAlt: "Planning ERP subscription and seats",
    caption: "Buy for the next year of operations — not a brochure fantasy.",
    tags: ["Pricing", "Planning"],
    open: "Pick a plan for how you operate today — and how you expect to grow in the next year. Overbuying modules you will not use creates noise; underbuying creates painful mid-year upgrades.",
    h2a: "Map users, branches, and must-have modules first",
    p1: "Then compare seat limits, multi-company support, and support tiers against that list. Ignore vanity features until the core loop is covered.",
    h3: "Trials exist to test real workflows",
    p2: "Use the trial to run receiving, a sale, and a reconciliation — not to click every menu once. That is how you learn fit.",
    quote:
      "We upgraded when branches needed multi-company — not because a salesperson told us Enterprise sounded nicer.",
    quoteBy: "Founder, growing retail group",
    note: "Seat math matters. A plan that looks cheap until you add cashiers is not cheap.",
    h2b: "Review quarterly, not only at renewal",
    p3: "Treat subscription planning as an operating decision. Usage drifts. Adjust before the next cycle forces a scramble.",
    close:
      "WAAMTO plans are structured so you can start focused and expand modules as operations mature — without rewriting your stack.",
    extra:
      "Ask about support channels and response expectations up front. Software without a path to help becomes shelfware during peak season.",
  },
  {
    category: "Product",
    slug: "enterprise-saas-ux-expectations",
    title: "What enterprise buyers expect from SaaS UX",
    excerpt:
      "Clarity, speed, and trust — the UX principles that separate premium software from noise.",
    author: "Design Team",
    date: "2026-05-10",
    image: IMAGES.team,
    imageAlt: "Team reviewing enterprise SaaS UX",
    caption: "Operators judge software in the first few sessions.",
    tags: ["Product", "UX"],
    open: "Enterprise buyers judge SaaS in the first few sessions: can people find work quickly, trust the numbers, and finish tasks without training decks that nobody reads?",
    h2a: "Premium UX is not decoration",
    p1: "It is predictable navigation, fast forms, clear status, and layouts that respect how operators work under pressure — not more gradients.",
    h3: "Trust is a UX outcome",
    p2: "If the stock number feels wrong once, people open Excel forever. Visual clarity without data integrity is just a nicer lie.",
    quote:
      "We chose the product our floor staff could learn in a shift — not the one with the longest feature PDF.",
    quoteBy: "Retail operations director",
    note: "Empty states and error messages are part of UX. Vague failures create support tickets and shadow processes.",
    h2b: "Ship clarity, measure adoption",
    p3: "Teams that ship clarity win. Teams that ship clutter create Excel workarounds — and the product never becomes the system of record.",
    close:
      "WAAMTO’s product work aims for that bar: calm interfaces over noisy chrome, with modules that share language and patterns.",
    extra:
      "Ask real users to complete one job without a guide. That single test predicts adoption better than a stakeholder slideshow.",
  },
  {
    category: "Operations",
    slug: "erp-onboarding-without-chaos",
    title: "Onboarding teams to a new ERP without the chaos",
    excerpt:
      "A phased rollout approach that protects daily operations while people learn the new system.",
    author: "WaamTech Team",
    date: "2026-06-18",
    image: IMAGES.team,
    imageAlt: "Team onboarding to a new ERP",
    caption: "Phase by workflow — protect selling and shipping.",
    tags: ["Operations", "Onboarding"],
    open: "Big-bang go-lives create fear and shadow systems. Teams need a path that keeps selling and shipping while they learn new screens.",
    h2a: "Phase by workflow, not by org chart alone",
    p1: "Master data first, then purchasing and inventory, then sales and finance. Train champions in each branch before the wider rollout.",
    h3: "Measure the right signals",
    p2: "Adoption is fewer spreadsheet exports, faster order cycles, and cleaner month-end — not just login counts that make leadership feel good.",
    quote:
      "Our champions mattered more than the kickoff deck. Peers teach peers faster than vendors do.",
    quoteBy: "Transformation lead",
    note: "Keep a short ‘escape hatch’ for true emergencies in week one — then close it. Permanent dual systems kill the project.",
    h2b: "Protect peak season",
    p3: "Do not cut over the week of your biggest sale. Boring calendar discipline is underrated change management.",
    close:
      "WAAMTO onboarding works best when industry and business profile are chosen early — so the workspace matches how you already operate.",
    extra:
      "Document the ten transactions that define your business. If those ten feel smooth, the rest of the ERP becomes teachable.",
  },
  {
    category: "Manufacturing",
    slug: "bom-work-orders-inventory-link",
    title: "BOM and work orders only work when inventory posts the truth",
    excerpt:
      "How production teams stop WIP fiction by tying shop-floor documents to real stock movements.",
    author: "Product Team",
    date: "2026-06-30",
    image: IMAGES.manufacturing,
    imageAlt: "Manufacturing work orders linked to inventory",
    caption: "Work orders should move materials — not just print paper.",
    tags: ["Manufacturing", "Inventory"],
    open: "A beautiful BOM that never depletes components is a brochure. Production ERP earns trust when work orders move materials the way the floor actually consumes them.",
    h2a: "WIP is a first-class citizen",
    p1: "If WIP only appears in a spreadsheet at month-end, scrap and rework will surprise you. Post issues and receipts with the work order as the spine.",
    h3: "MRP needs honest on-hand",
    p2: "Material planning against fantasy stock creates panic POs. Clean inventory is a manufacturing prerequisite, not a warehouse-only concern.",
    quote:
      "We stopped blaming ‘the system’ when our own adjustments were the reason planning failed.",
    quoteBy: "Plant manager",
    note: "Backflushing can help — but only after you trust the BOM quantities. Garbage BOM in, silent inventory theft out.",
    h2b: "Quality checks belong in the flow",
    p3: "Scrap and rework statuses keep costing honest. Hide them and finance invents numbers.",
    close:
      "WAAMTO Manufacturing is meant to sit beside Inventory — so planners and finance stop arguing about which file is real.",
    extra:
      "Pilot one cell or line. Prove the loop. Then scale. Plant-wide day-one ambition is how morale breaks.",
  },
  {
    category: "CRM",
    slug: "crm-loyalty-customer-360",
    title: "CRM that sales teams use: pipeline, loyalty, and customer 360",
    excerpt:
      "Why CRM dies when it is a separate island — and how linking it to sales and POS keeps it alive.",
    author: "Customer Success",
    date: "2026-06-05",
    image: IMAGES.office,
    imageAlt: "CRM pipeline and customer history",
    caption: "Customer history should be one click, not three systems.",
    tags: ["CRM", "Sales"],
    open: "CRM fails when it is a graveyard of leads nobody updates. It works when opportunities, activities, and customer history sit next to real invoices and POS visits.",
    h2a: "Customer 360 is an integration of habits",
    p1: "If sales cannot see open invoices and recent purchases, they fly blind. Linking CRM to sales and finance turns follow-ups into informed conversations.",
    h3: "Loyalty is a retention system",
    p2: "Points programs that do not sync with POS create arguments at the counter. Loyalty belongs in the same operational family as CRM and checkout.",
    quote:
      "Our best reps lived in the CRM once it reflected money, not just notes.",
    quoteBy: "Sales manager, B2B distributor",
    note: "Mandatory fields that do not help the next call get filled with garbage. Design for the next conversation.",
    h2b: "Pipeline hygiene beats vanity dashboards",
    p3: "Weekly pipeline reviews with clear next steps beat monthly charts that nobody believes.",
    close:
      "WAAMTO CRM is built to sit with Sales and POS — so loyalty and follow-ups share the same customer truth.",
    extra:
      "Start with accounts you already invoice. Migrating cold leads first is how CRM projects lose political support.",
  },
  {
    category: "HR",
    slug: "hr-payroll-multi-branch-attendance",
    title: "HR & payroll across branches: attendance that finance can trust",
    excerpt:
      "How multi-site teams reduce payroll disputes with clearer attendance, leave, and shift control.",
    author: "WaamTech Team",
    date: "2026-05-20",
    image: IMAGES.team,
    imageAlt: "HR payroll and attendance across branches",
    caption: "Payroll arguments shrink when attendance is undisputed.",
    tags: ["HR", "Payroll"],
    open: "Multi-branch payroll disputes usually start as attendance ambiguity. Late punches, shift swaps, and leave that never reached the sheet — then finance is asked to ‘just fix it.’",
    h2a: "Self-service reduces the admin tax",
    p1: "When employees can request leave and see attendance, HR stops being a human router for every exception. Managers approve; payroll inherits cleaner inputs.",
    h3: "Shifts and overtime need rules, not memory",
    p2: "Stores and factories run on shifts. Encode the rules. Memory does not scale past the third branch.",
    quote:
      "Payroll week got quieter when attendance stopped arriving as WhatsApp screenshots.",
    quoteBy: "HR manager, retail chain",
    note: "Do not go live on payroll mid-cycle without a parallel run. One clean parallel month buys trust.",
    h2b: "HR data feeds operations",
    p3: "Who is present affects POS staffing and warehouse capacity. Treating HR as an island wastes that signal.",
    close:
      "WAAMTO HR & Payroll is meant for operators who need attendance and pay to survive peak weeks without drama.",
    extra:
      "Train store managers on approvals. Most payroll errors are approval latency, not calculation math.",
  },
  {
    category: "Purchasing",
    slug: "three-way-match-purchasing-control",
    title: "Three-way match without the headache: PO, GRN, invoice",
    excerpt:
      "Procurement control that protects margin — without burying the warehouse in bureaucracy.",
    author: "Product Team",
    date: "2026-05-02",
    image: IMAGES.wholesale,
    imageAlt: "Purchase order and goods receipt matching",
    caption: "Match before you pay — calmly.",
    tags: ["Purchasing", "Control"],
    open: "Paying supplier invoices without matching receipts is how leakage becomes culture. Three-way match sounds heavy; done well, it is just disciplined documents.",
    h2a: "PO clarity up front",
    p1: "Vague purchase orders create vague receipts. Quantities, warehouses, and expected costs should be explicit before goods arrive.",
    h3: "GRN is the warehouse’s signature",
    p2: "If receiving is optional, your inventory and AP will both lie. Make GRN the gate to stock increase.",
    quote:
      "We caught more pricing errors in matching than in any quarterly vendor meeting.",
    quoteBy: "Procurement lead",
    note: "Partial receipts are normal. Your process should allow them without inventing a second unofficial PO.",
    h2b: "Landed costs belong in the story",
    p3: "Freight and duties that never hit item cost make margin reports optimistic. Capture landed cost where inventory valuation lives.",
    close:
      "WAAMTO Purchasing connects vendors, POs, GRN, and invoices so finance and warehouse stop arguing from different folders.",
    extra:
      "Vendor scorecards are useless without on-time and quality data from real receipts. The documents are the dataset.",
  },
];

const existingFeaturedKeep = false; // industry[0] is featured

const posts = [
  ...industries.map(industryPost),
  ...topics.map(topicPost),
];

// Ensure one featured
posts.forEach((p, i) => {
  p.featured = i === 0;
});

const out = `import type { BlogPost } from "@/types";
import { optimizeImageUrl } from "@/lib/images";

/** All marketing blog posts — industry + category SEO content. */
export const blogPosts: BlogPost[] = ${JSON.stringify(posts, null, 2)
  .replace(/"([^"]+)":/g, "$1:")
  .replace(/"/g, '"')
  .replace(/\n/g, "\n")};
`;

// Better: emit proper TS with optimizeImageUrl wrappers for images
function emitTs(postsArr) {
  const lines = [];
  lines.push(`import type { BlogPost } from "@/types";`);
  lines.push(`import { optimizeImageUrl, heroImageUrl } from "@/lib/images";`);
  lines.push(``);
  lines.push(`const cover = (path: string) =>`);
  lines.push(`  optimizeImageUrl(\`https://images.unsplash.com/\${path}\`, { width: 1200 });`);
  lines.push(`const inline = (path: string) =>`);
  lines.push(`  optimizeImageUrl(\`https://images.unsplash.com/\${path}\`, { width: 1000 });`);
  lines.push(``);
  lines.push(`/** SEO blog posts — one per industry + topic categories. */`);
  lines.push(`export const blogPosts: BlogPost[] = [`);

  for (const p of postsArr) {
    lines.push(`  {`);
    lines.push(`    id: ${JSON.stringify(p.id)},`);
    lines.push(`    title: ${JSON.stringify(p.title)},`);
    lines.push(`    slug: ${JSON.stringify(p.slug)},`);
    lines.push(`    excerpt: ${JSON.stringify(p.excerpt)},`);
    lines.push(`    category: ${JSON.stringify(p.category)},`);
    if (p.industry) lines.push(`    industry: ${JSON.stringify(p.industry)},`);
    lines.push(`    author: ${JSON.stringify(p.author)},`);
    lines.push(`    date: ${JSON.stringify(p.date)},`);
    lines.push(`    readTime: ${JSON.stringify(p.readTime)},`);
    if (p.featured) lines.push(`    featured: true,`);
    // extract unsplash photo id from url
    const coverId = p.image.match(/photo-[^?]+/)?.[0] || "photo-1460925895917-afdab827c52f";
    lines.push(`    image: cover(${JSON.stringify(coverId)}),`);
    if (p.tags) lines.push(`    tags: ${JSON.stringify(p.tags)},`);
    lines.push(`    blocks: [`);
    for (const b of p.blocks) {
      if (b.type === "image") {
        const id = b.src.match(/photo-[^?]+/)?.[0] || coverId;
        lines.push(`      {`);
        lines.push(`        type: "image",`);
        lines.push(`        src: inline(${JSON.stringify(id)}),`);
        lines.push(`        alt: ${JSON.stringify(b.alt)},`);
        if (b.caption) lines.push(`        caption: ${JSON.stringify(b.caption)},`);
        lines.push(`      },`);
      } else {
        const obj = { ...b };
        lines.push(`      ${JSON.stringify(obj).replace(/"([^"]+)":/g, "$1:")},`.replace(/"type"/, "type").replace(/"text"/, "text"));
        // simpler:
      }
    }
    // Actually rewrite blocks emission more carefully
    lines.pop(); // remove incomplete blocks start - we'll redo below
  }

  return null; // will rewrite properly
}

function emitProper(postsArr) {
  let s = `import type { BlogPost } from "@/types";
import { optimizeImageUrl } from "@/lib/images";

const cover = (path: string) =>
  optimizeImageUrl(\`https://images.unsplash.com/\${path}\`, { width: 1200 });
const inline = (path: string) =>
  optimizeImageUrl(\`https://images.unsplash.com/\${path}\`, { width: 1000 });

/** SEO blog posts — industry guides + category deep-dives (~2k+ chars each). */
export const blogPosts: BlogPost[] = [
`;

  for (const p of postsArr) {
    const coverId = p.image.match(/photo-[^?]+/)?.[0] || "photo-1460925895917-afdab827c52f";
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
    s += `    image: cover(${JSON.stringify(coverId)}),\n`;
    if (p.tags?.length) s += `    tags: ${JSON.stringify(p.tags)},\n`;
    s += `    blocks: [\n`;
    for (const b of p.blocks) {
      if (b.type === "image") {
        const id = b.src.match(/photo-[^?]+/)?.[0] || coverId;
        s += `      {\n`;
        s += `        type: "image",\n`;
        s += `        src: inline(${JSON.stringify(id)}),\n`;
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

const target = path.join(root, "src/lib/data/blog-posts.ts");
fs.writeFileSync(target, emitProper(posts), "utf8");
console.log(`Wrote ${posts.length} posts to ${target}`);
for (const p of posts) {
  console.log(`- ${p.slug} (${charCount(p.blocks)} chars) [${p.category}]`);
}
