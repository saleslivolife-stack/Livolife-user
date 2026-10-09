"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/common/ProductCard";
import { Product } from "@/types/product.types";
import { variantPricing } from "@/lib/pricing";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ApiProduct {
  _id: string;
  name: string;
  category?: { name: string; _id?: string };
  taxRate?: number;
  variants?: Array<{
    images?: string[];
    price?: number;
    offerPrice?: number;
    isDefault?: boolean;
  }>;
}

// Module-level cache — persists across navigations within the same session
let productCache: Product[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const ITEMS_PER_PAGE = 12;

// Skeleton card shown while loading
const SkeletonCard = () => (
  <div className="flex flex-col items-start animate-pulse">
    <div className="bg-gray-200 rounded-[14px] lg:rounded-[20px] w-full aspect-square mb-2.5 " />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5" />
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
    <div className="h-5 bg-gray-200 rounded w-1/3" />
  </div>
);

const ShopProductsList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchParams = useSearchParams();
  const api = process.env.NEXT_PUBLIC_API_URL;
  const prevParamsRef = useRef<string | null>(null);
  const allProductsCache = useRef<Product[]>([]);
  const cacheLoadedRef = useRef(false);

  // Reset page to 1 when search params change
  useEffect(() => {
    const paramsKey = searchParams.toString();
    if (prevParamsRef.current !== null && paramsKey !== prevParamsRef.current) {
      setCurrentPage(1);
    }
    prevParamsRef.current = paramsKey;
  }, [searchParams]);

  useEffect(() => {
    if (!api) { setLoading(false); return; }

    const controller = new AbortController();

    const applyFilters = (all: Product[]) => {
      const categories = searchParams.get("categories");
      const minPrice = searchParams.get("minPrice");
      const maxPrice = searchParams.get("maxPrice");
      const search = searchParams.get("search");

      let filtered = all;

      if (categories) {
        const selected = categories.split(",").map(c => c.trim().toLowerCase()).filter(Boolean);
        if (selected.length > 0) {
          filtered = filtered.filter(p => selected.includes((p.category || "").toLowerCase().trim()));
        }
      }
      if (minPrice || maxPrice) {
        const min = minPrice ? Number(minPrice) : 0;
        const max = maxPrice ? Number(maxPrice) : Infinity;
        filtered = filtered.filter(p => p.price >= min && p.price <= max);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
        );
      }

      const total = filtered.length;
      setTotalPages(Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)));
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      setProducts(filtered.slice(start, start + ITEMS_PER_PAGE));
      setLoading(false);
    };

    // If module-level cache is fresh, filter instantly without network call
    if (productCache.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL) {
      allProductsCache.current = productCache;
      cacheLoadedRef.current = true;
    }

    // If cache is ready, filter instantly without network call
    if (cacheLoadedRef.current) {
      applyFilters(allProductsCache.current);
      return;
    }

    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        // Fetch only 100 products to avoid overloading the server
        const res = await fetch(`${api}/product?skip=0&limit=100`, { signal: controller.signal });
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
          setProducts([]);
          setTotalPages(1);
          setLoading(false);
          return;
        }
        const data = await res.json();

        if (data.products && Array.isArray(data.products)) {
          const mapped: Product[] = data.products.map((p: ApiProduct) => {
            const v = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
            return {
              id: p._id,
              title: p.name,
              category: p.category?.name || "General",
              srcUrl: v?.images?.[0] || "/images/pic1.png",
              gallery: v?.images || [],
              ...variantPricing(v),
              discount: { amount: 0, percentage: 0 },
              taxRate: p.taxRate ?? 0,
              rating: 4,
            };
          });

          allProductsCache.current = mapped;
          cacheLoadedRef.current = true;
          // Save to module-level cache with timestamp
          productCache = mapped;
          cacheTimestamp = Date.now();
          applyFilters(mapped);
        } else {
          setProducts([]);
          setTotalPages(1);
          setLoading(false);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setProducts([]);
          setTotalPages(1);
          setLoading(false);
        }
      }
    };

    fetchAllProducts();
    return () => controller.abort();
  }, [searchParams, currentPage, api]);

  const search = searchParams.get("search");
  const categories = searchParams.get("categories");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* Active filter labels */}
      {(search || categories || minPrice || maxPrice) && (
        <div className="text-sm text-muted-foreground space-y-1">
          {search && <p>Results for: <span className="font-semibold text-black">"{search}"</span></p>}
          {categories && <p>Category: <span className="font-semibold text-black">{categories.split(",").join(", ")}</span></p>}
          {(minPrice || maxPrice) && (
            <p>Price: <span className="font-semibold text-black">₹{minPrice || "0"} – ₹{maxPrice || "∞"}</span></p>
          )}
        </div>
      )}

      {/* Always show skeletons while loading, never show empty state during load */}
      {loading ? (
        <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length > 0 ? (
        <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {products.map((product, idx) => (
            <ProductCard key={product.id} data={product} priority={idx < 3} />
          ))}
        </div>
      ) : (
        <div className="w-full text-center py-20">
          <p className="text-muted-foreground">
            {search ? `No products found for "${search}".` : "Loading..."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <>
          <hr className="border-t-white/10" />
          <Pagination className="justify-between">
            <PaginationPrevious
              href="#"
              onClick={(e) => { e.preventDefault(); currentPage > 1 && setCurrentPage(p => p - 1); }}
              className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "border border-white/10"}
            />
            <PaginationContent>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                    isActive={currentPage === page}
                    className="text-muted-foreground font-medium text-sm"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {totalPages > 5 && (
                <PaginationItem>
                  <PaginationEllipsis className="text-muted-foreground font-medium text-sm " />
                </PaginationItem>
              )}
            </PaginationContent>
            <PaginationNext
              href="#"
              onClick={(e) => { e.preventDefault(); currentPage < totalPages && setCurrentPage(p => p + 1); }}
              className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "border border-white/10"}
            />
          </Pagination>   
        </>
      )}
    </div>
  );
};

export default ShopProductsList;
