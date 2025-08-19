import React, { useEffect, useMemo, useState } from "react";

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function useProducts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    products: {},
    addons: {},
    "product-categories": [],
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/items/products.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load products.json");
        const json = await res.json();
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
  const categoriesFromData = useMemo(
    () => data["product-categories"] || [],
    [data],
  );

  // Fallback: if "product-categories" missing, build from product.category
  const productCategories = useMemo(() => {
    if (Array.isArray(categoriesFromData) && categoriesFromData.length > 0) {
      return categoriesFromData;
    }
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set);
  }, [categoriesFromData, products]);

  return { loading, error, products, addons, productCategories };
}

function Header() {
  return (
    <div className="px-4">
      <header className="sticky top-0 z-20 bg-gray-50/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Camo CPQ
          </h1>
          <div className="text-xs sm:text-sm text-gray-500">
            Demo • local <code>/items/products.json</code>
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
    Number(product?.total_cost || 0) +
    addons.reduce((s, a) => s + Number(a.total_cost || 0), 0);
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
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
            {count}
          </span>
          <svg
            className={classNames(
              "h-4 w-4 text-gray-500 transition-transform",
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
      {isOpen && <div className="p-3 space-y-3 bg-white">{children}</div>}
    </div>
  );
}

export default function App() {
  const { loading, error, products, addons, productCategories } = useProducts();
  const [productSku, setProductSku] = useState(null);
  const [addonSkus, setAddonSkus] = useState(new Set());
  const [openCat, setOpenCat] = useState(null); // single-open accordion

  // open first category by default
  useEffect(() => {
    if (productCategories.length > 0 && !openCat) {
      setOpenCat(productCategories[0]);
    }
  }, [productCategories, openCat]);

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

  const toggleCategory = (cat) => {
    setOpenCat((prev) => (prev === cat ? null : cat));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="mx-auto w-full px-4 py-6 space-y-6">
        {loading && (
          <div className="text-center text-gray-600">Loading products…</div>
        )}
        {error && <div className="text-center text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Picker (Accordion) */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Choose a product</h2>
                <p className="text-sm text-gray-500">
                  Select one product to begin. Prices shown include install &
                  shipping but exclude tax.
                </p>
              </div>

              <div className="p-4 space-y-3 max-h-[60vh] overflow-auto scroll-smooth">
                {productCategories.map((cat) => {
                  const items = products.filter((p) => p.category === cat);
                  if (items.length === 0) return null;
                  const isOpen = openCat === cat;
                  return (
                    <AccordionSection
                      key={cat}
                      title={cat}
                      count={items.length}
                      isOpen={isOpen}
                      onToggle={() => toggleCategory(cat)}
                    >
                      <div className="space-y-3">
                        {items.map((p) => (
                          <OptionCard
                            key={p.sku}
                            title={p.name}
                            description={p.description}
                            price={p.total_cost}
                            selected={productSku === p.sku}
                            onSelect={() => {
                              setProductSku(p.sku);
                              setOpenCat(cat); // open the clicked product's category when selecting
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
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Add-ons</h2>
                  <p className="text-sm text-gray-500">
                    Only add-ons compatible with the selected product are shown.
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedProduct ? (
                    <span>{selectedProduct.name}</span>
                  ) : (
                    <span className="italic">Select a product first</span>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-3 max-h-[60vh] overflow-auto scroll-smooth">
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
                  productScopedAddons.map((a) => {
                    const isChecked = addonSkus.has(a.sku);
                    const isDisabled =
                      !isChecked && incompatibleSkuSet.has(a.sku);
                    return (
                      <CheckboxCard
                        key={a.sku}
                        title={a.name}
                        description={a.description}
                        price={a.total_cost}
                        checked={isChecked}
                        disabled={isDisabled}
                        onToggle={() => !isDisabled && toggleAddon(a.sku)}
                      />
                    );
                  })}
              </div>

              {selectedProduct && selectedAddons.length > 0 && (
                <div className="px-4 pb-4">
                  <button
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
                    onClick={() => setAddonSkus(new Set())}
                  >
                    Clear add-ons
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 z-30 px-4">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-1 border-gray-100">
            <Summary product={selectedProduct} addons={selectedAddons} />
          </div>
        </section>
      </div>
    </div>
  );
}
