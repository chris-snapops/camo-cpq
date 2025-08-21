import React, { useEffect, useMemo, useState } from "react";
import Papa from 'papaparse'

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// --- constants ---
const sheetId = "14zzAWJNgDxZgXAm713sq3K8fhWDNJPZ49SGYssBQH00";
const sheetGids = {
  categories: 512714440,
  products: 1610198502,
  addons: 1688740072,
};

// --- helpers ---
function priceStringToFloat(s) {
  if (!s) return 0;
  return parseFloat(s.replace(/[^\d.]/g, "")) || 0;
}

async function getSheet(sheetId, gid) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) return { cols: {}, rows: [] };

  const text = await res.text();
  const { data } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = data.map((row) => {
    // normalize empty strings
    const cleanRow = {};
    Object.entries(row).forEach(([k, v]) => {
      cleanRow[k.trim()] = v?.trim() || "";
    });
    return cleanRow;
  });

  const cols = {};
  rows.forEach((row) => {
    Object.entries(row).forEach(([k, v]) => {
      if (!v) return;
      if (!cols[k]) cols[k] = [];
      cols[k].push(v);
    });
  });

  return { cols, rows };
}

async function loadProductsFromSheets() {
  const retJson = {
    products: {},
    addons: {},
    productCategories: [],
    addonCategories: [],
  };

  // Categories
  const categoriesSheet = await getSheet(sheetId, sheetGids.categories);
  retJson["productCategories"] =
    categoriesSheet.cols["Product Categories"] || [];
  retJson["addonCategories"] = categoriesSheet.cols["Add-on Categories"] || [];

  // Products
  const productsSheet = await getSheet(sheetId, sheetGids.products);
  productsSheet.rows.forEach((row) => {
    retJson.products[row["Product SKU"]] = {
      category: row["Product Category"],
      manufacturer: row["Manufacturer"],
      sku: row["Product SKU"],
      name: row["Product Name"],
      description: row["Product Description"],
      unit_price: priceStringToFloat(row["Our Price"]),
    };
  });

  // Add-ons
  const addonsSheet = await getSheet(sheetId, sheetGids["addons"]);
  addonsSheet.rows.forEach((row) => {
    retJson.addons[row["Add-on SKU"]] = {
      category: row["Add-on Category"],
      manufacturer: row["Manufacturer"],
      sku: row["Add-on SKU"],
      name: row["Add-on Name"],
      description: row["Add-on Description"],
      unit_price: priceStringToFloat(row["Our Price"]),
      parent_skus:
        row["Compatible Parent SKUs"]?.replace(/\s+/g, "").split(",") || [],
      incompatible_skus:
        row["Incompatible Add-on SKUs"]?.replace(/\s+/g, "").split(",") || [],
    };
  });

  console.log(retJson);
  return retJson;
}

// --- Hook (integrates with your app) ---
export function useProducts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    products: {},
    addons: {},
    productCategories: [],
  });

  useEffect(() => {
    async function load() {
      try {
        const json = await loadProductsFromSheets();
        setData(json);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const products = useMemo(() => Object.values(data.products || {}), [data]);
  const addons = useMemo(() => Object.values(data.addons || {}), [data]);
  const productCategories = useMemo(
    () => Object.values(data.productCategories || []),
    [data],
  );
  const addonCategories = useMemo(
    () => Object.values(data.addonCategories || []),
    [data],
  );

  return {
    loading,
    error,
    products,
    addons,
    productCategories,
    addonCategories,
  };
}

function Header() {
  return (
    <div className="px-4">
      <header className="sticky top-0 z-20 bg-gray-50/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Camo CPQ
          </h1>
          <div className="text-xs sm:text-sm">
            Demo • Source: <a className="text-blue-600 hover:text-blue-800 underline" href="https://docs.google.com/spreadsheets/d/14zzAWJNgDxZgXAm713sq3K8fhWDNJPZ49SGYssBQH00/edit" target="_blank">Camo CPQ Products</a>
          </div>
        </div>
      </header>
    </div>
  );
}

function OptionCard({
  title,
  description,
  price,
  selected,
  disabled,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={classNames(
        "w-full text-left rounded-2xl border border-gray-200 p-4 shadow-sm transition-shadow bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
        selected && "ring-2 ring-blue-500",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={classNames(
            "mt-1 h-4 w-4 flex-none rounded-full border",
            selected
              ? "bg-blue-500 border-blue-500"
              : "bg-white border-gray-300",
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 line-clamp-2">{title}</div>
          {description && (
            <div className="text-sm text-gray-500 mt-0.5 line-clamp-3">
              {description}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="font-semibold">
            {currency.format(Number(price || 0))}
          </div>
        </div>
      </div>
    </button>
  );
}

function CheckboxCard({
  title,
  description,
  price,
  checked,
  disabled,
  onToggle,
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={classNames(
        "w-full text-left rounded-2xl border border-gray-200 p-4 shadow-sm transition-shadow bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
        checked && "ring-2 ring-blue-500",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Fake checkbox */}
        <div
          className={classNames(
            "mt-1 h-4 w-4 flex-none rounded-sm border flex items-center justify-center",
            checked
              ? "bg-blue-500 border-blue-500"
              : "bg-white border-gray-300",
          )}
        >
          {checked && (
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 line-clamp-2">{title}</div>
          {description && (
            <div className="text-sm text-gray-500 mt-0.5 line-clamp-3">
              {description}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="font-semibold">
            {currency.format(Number(price || 0))}
          </div>
        </div>
      </div>
    </button>
  );
}

function Summary({ product, addons }) {
  const total =
    Number(product?.unit_price || 0) +
    addons.reduce((s, a) => s + Number(a.unit_price || 0), 0);
  return (
    <div className="w-full bg-white border-gray-200">
      <div className="mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">Summary:</span>
          {product ? (
            <>
              <span className="ml-2">{product.name}</span>
              {addons.length > 0 && (
                <span className="ml-2">
                  • {addons.length} add-on{addons.length > 1 ? "s" : ""}
                </span>
              )}
            </>
          ) : (
            <span className="ml-2">No product selected</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">
            Total {currency.format(total)}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccordionSection({ title, count, isOpen, onToggle, children }) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full rounded-2xl overflow-hidden border border-gray-200 hover:shadow-md overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
            {count}
          </span>
          <svg
            className={classNames(
              "h-4 w-4 text-gray-500 transition-transform duration-300",
              isOpen ? "rotate-180" : "",
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>
      {isOpen && <div className="p-3">{children}</div>}
    </div>
  );
}

export default function App() {
  const {
    loading,
    error,
    products,
    addons,
    productCategories,
    addonCategories,
  } = useProducts();
  const [productSku, setProductSku] = useState(null);
  const [addonSkus, setAddonSkus] = useState(new Set());
  const [openProductCat, setOpenProductCat] = useState(null); // product accordion
  const [openAddonCat, setOpenAddonCat] = useState(null); // addon accordion

  const selectedProduct = useMemo(
    () => products.find((p) => p.sku === productSku) || null,
    [products, productSku],
  );

  const productScopedAddons = useMemo(() => {
    if (!selectedProduct) return [];
    return addons.filter(
      (a) =>
        Array.isArray(a.parent_skus) &&
        a.parent_skus.includes(selectedProduct.sku),
    );
  }, [addons, selectedProduct]);

  const incompatibleSkuSet = useMemo(() => {
    const set = new Set();
    for (const a of addons) {
      if (addonSkus.has(a.sku) && Array.isArray(a.incompatible_skus)) {
        for (const inc of a.incompatible_skus) set.add(inc);
      }
    }
    return set;
  }, [addons, addonSkus]);

  // keep add-ons consistent with selected product
  useEffect(() => {
    if (!selectedProduct && addonSkus.size) {
      setAddonSkus(new Set());
      return;
    }
    if (selectedProduct) {
      const allowed = new Set(productScopedAddons.map((a) => a.sku));
      const next = new Set([...addonSkus].filter((sku) => allowed.has(sku)));
      if (next.size !== addonSkus.size) setAddonSkus(next);
    }
  }, [selectedProduct, productScopedAddons]);

  const toggleAddon = (sku) => {
    const next = new Set(addonSkus);
    if (next.has(sku)) next.delete(sku);
    else next.add(sku);
    setAddonSkus(next);
  };

  const selectedAddons = useMemo(
    () => addons.filter((a) => addonSkus.has(a.sku)),
    [addons, addonSkus],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="mx-auto w-full px-4 py-4 space-y-6">
        {loading && (
          <div className="text-center text-gray-600">Loading products…</div>
        )}
        {error && <div className="text-center text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Picker (Accordion) */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm pb-2">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Product</h2>
                <p className="text-sm text-gray-500">
                  Select one product to begin. Prices shown include install &
                  shipping but exclude tax.
                </p>
              </div>

              <div className="p-4 space-y-3 h-[60vh] overflow-y-scroll scroll-smooth">
                {productCategories.map((cat) => {
                  const items = products.filter((p) => p.category === cat);
                  if (items.length === 0) return null;
                  const isOpen = openProductCat === cat;
                  return (
                    <AccordionSection
                      key={cat}
                      title={cat}
                      count={items.length}
                      isOpen={isOpen}
                      onToggle={() =>
                        setOpenProductCat((prev) => (prev === cat ? null : cat))
                      }
                    >
                      <div className="space-y-3">
                        {items.map((p) => (
                          <OptionCard
                            key={p.sku}
                            title={p.name}
                            description={p.description}
                            price={p.unit_price}
                            selected={productSku === p.sku}
                            onSelect={() => {
                              setProductSku(p.sku);
                              setOpenProductCat(cat); // open the clicked product's category
                            }}
                          />
                        ))}
                      </div>
                    </AccordionSection>
                  );
                })}
              </div>
            </section>

            {/* Add-on Picker */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm pb-2 ">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Add-ons</h2>
                <p className="text-sm text-gray-500">
                  Only add-ons compatible with the selected product are shown.
                </p>
              </div>

              <div className="p-4 space-y-3 h-[60vh] overflow-y-scroll scroll-smooth flex flex-col">
                {!selectedProduct && (
                  <div className="text-sm text-gray-500">
                    Choose a product to see available add-ons.
                  </div>
                )}
                {selectedProduct && productScopedAddons.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No add-ons available for this product.
                  </div>
                )}

                {selectedProduct &&
                  addonCategories.map((cat) => {
                    const items = productScopedAddons.filter(
                      (a) => a.category === cat,
                    );
                    console.log(addonCategories);
                    if (items.length === 0) return null;
                    const isOpen = openAddonCat === cat;
                    return (
                      <AccordionSection
                        key={cat}
                        title={cat}
                        count={items.length}
                        isOpen={isOpen}
                        onToggle={() =>
                          setOpenAddonCat((prev) => (prev === cat ? null : cat))
                        }
                      >
                        <div className="space-y-3">
                          {items.map((a) => {
                            const isChecked = addonSkus.has(a.sku);
                            const isDisabled =
                              !isChecked && incompatibleSkuSet.has(a.sku);
                            return (
                              <CheckboxCard
                                key={a.sku}
                                title={a.name}
                                description={a.description}
                                price={a.unit_price}
                                checked={isChecked}
                                disabled={isDisabled}
                                onToggle={() =>
                                  !isDisabled && toggleAddon(a.sku)
                                }
                              />
                            );
                          })}
                        </div>
                      </AccordionSection>
                    );
                  })}

                {selectedProduct && selectedAddons.length > 0 && (
                  <div className="sticky bottom-0 pt-2 z-30 flex justify-end mt-auto">
                    <button
                      className="sm:w-auto px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
                      onClick={() => setAddonSkus(new Set())}
                    >
                      Clear add-ons
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 z-30 p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-1 border-gray-100">
            <Summary product={selectedProduct} addons={selectedAddons} />
          </div>
        </div>
      </div>
    </div>
  );
}
