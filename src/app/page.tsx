import ProductListSec from "@/components/common/ProductListSec";
import HeroBanner from "@/components/homepage/Header";
import CategoriesSec from "@/components/homepage/CategoriesSec";
import { Product } from "@/types/product.types";
import { variantPricing } from "@/lib/pricing";

// Admin product/category changes rebuild this page on demand via
// /api/revalidate (called by the backend). This 24h timer is only a safety net
// in case one of those calls is missed.
export const revalidate = 86400;

const api = process.env.NEXT_PUBLIC_API_URL;

async function getProducts(): Promise<Product[]> {
  if (!api) return [];
  try {
    // Ask for an explicit limit: GET /api/product defaults to 10, so without
    // this the "Explore for More" carousel silently stops at the 10th product.
    const res = await fetch(`${api}/product?limit=100`);
    if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
    const data = await res.json();
    if (!data.products) return [];

    return data.products.map((p: any) => {
      const defaultVariant =
        p.variants?.find((v: any) => v.isDefault) || p.variants?.[0];
      return {
        id: p._id,
        title: p.name,
        category: p.category?.name || "General",
        srcUrl: defaultVariant?.images?.[0] || "/images/pic1.png",
        gallery: defaultVariant?.images || [],
        ...variantPricing(defaultVariant),
        discount: { amount: 0, percentage: 0 },
        taxRate: p.taxRate ?? 0,
        rating: 4,
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Server component — no "use client", no useEffect, no client-side waterfall
export default async function Home() {
  const products = await getProducts();

  return (
    <>
      <HeroBanner />
      {/* Top spacing kept small so Categories sits close under the banner;
         it still applies if CategoriesSec renders nothing and ProductListSec
         becomes the first child. */}
      <main className="mt-6 mb-[50px] sm:mt-8 sm:mb-[72px]">
        <CategoriesSec />
        <ProductListSec
          title="Explore for More"
          data={products}
          viewAllLink="/shop#new-arrivals"
        />
        <div className="max-w-frame mx-auto px-4 xl:px-0">
          <hr className="h-[1px] border-t-black/10 my-10 sm:my-16" />
        </div>
      </main>
    </>
  );
}
