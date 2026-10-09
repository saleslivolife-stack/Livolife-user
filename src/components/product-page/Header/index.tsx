"use client";

import React, { useState } from "react";
import PhotoSection from "./PhotoSection";
import { Product, ProductVariant, SizeOption } from "@/types/product.types";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import AddToCardSection from "./AddToCardSection";
import PriceTag from "@/components/common/PriceTag";
import { IoMdCheckmark } from "react-icons/io";

const colorMap: Record<string, string> = {
  "sage green": "#8a9a86",
  "sage": "#8a9a86",
  "coffee brown": "#4b3621",
  "coffee": "#4b3621",
  "mauve pink": "#e0b0ff",
  "mauve": "#e0b0ff",
  "olive beige": "#a89f91",
  "olive": "#808000",
  "beige": "#f5f5dc",
  "navy blue": "#000080",
  "navy": "#000080",
  "sky blue": "#87ceeb",
  "mustard yellow": "#ffdb58",
  "mustard": "#ffdb58",
  "dusty pink": "#dcaebb",
  "dusty rose": "#cca0ac",
  "wine red": "#722f37",
  "wine": "#722f37",
  "burgundy": "#800020",
  "charcoal grey": "#36454f",
  "charcoal gray": "#36454f",
  "charcoal": "#36454f",
  "cream": "#fffdd0",
  "khaki": "#c3b091",
  "camel": "#c19a6b",
  "rust": "#b7410e",
  "terracotta": "#e2725b",
  "teal": "#008080",
  "lavender": "#e6e6fa",
  "lilac": "#c8a2c8",
  "peach": "#ffdab9",
  "coral": "#ff7f50",
  "mint green": "#98ff98",
  "mint": "#98ff98",
  "apricot": "#fbceb1",
  "emerald green": "#50c878",
  "emerald": "#50c878",
  "forest green": "#228b22",
  "olive green": "#bab86c",
  "maroon": "#800000",
  "bronze": "#cd7f32",
  "copper": "#b87333",
  "tan": "#d2b48c",
};

const getValidColor = (colorName: string): string => {
  if (!colorName) return "#ccc";
  const clean = colorName.trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
  if (/^#([0-9a-f]{3}){1,2}$/i.test(clean)) return colorName;
  if (colorMap[clean]) return colorMap[clean];
  if (clean.includes("red")) return "#ff0000";
  if (clean.includes("blue")) return "#0000ff";
  if (clean.includes("green")) return "#008000";
  if (clean.includes("yellow")) return "#ffff00";
  if (clean.includes("pink")) return "#ffc0cb";
  if (clean.includes("brown")) return "#a52a2a";
  if (clean.includes("orange")) return "#ffa500";
  if (clean.includes("purple")) return "#800080";
  if (clean.includes("grey") || clean.includes("gray")) return "#808080";
  if (clean.includes("black")) return "#000000";
  if (clean.includes("white")) return "#ffffff";
  if (clean.includes("gold")) return "#ffd700";
  if (clean.includes("silver")) return "#c0c0c0";
  if (clean.includes("beige")) return "#f5f5dc";
  return colorName;
};

const Header = ({ data }: { data: Product }) => {
  const variants = data.variants ?? [];
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0] || null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(defaultVariant);
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(
    defaultVariant?.sizesArray?.[0] || null
  );

  const displayPrice = selectedVariant?.price ?? data.price;
  const displayOriginalPrice = selectedVariant
    ? selectedVariant.originalPrice
    : data.originalPrice;
  const displayImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : data.gallery ?? [];
  const displaySrc = displayImages[0] || data.srcUrl;
  const sizes = selectedVariant?.sizesArray ?? [];

  const handleVariantSelect = (v: ProductVariant) => {
    setSelectedVariant(v);
    setSelectedSize(v.sizesArray?.[0] || null);
  };

  const displayProduct: Product = {
    ...data,
    srcUrl: displaySrc,
    gallery: displayImages,
    price: displayPrice,
    originalPrice: displayOriginalPrice,
  };

  // attributes passed to cart: [color, size] — positional, so it is NOT filtered.
  // Dropping an empty colour here would slide the size into the colour slot and
  // the cart would label a size as a colour.
  const cartAttributes = [
    selectedVariant?.color || "",
    selectedSize?.size || "",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
      <div>
        <PhotoSection data={displayProduct} />
      </div>
      <div>
        {/* Title */}
        <h1
          className={cn([
            integralCF.className,
            "text-2xl md:text-[40px] md:leading-[40px] mb-1.5 md:mb-3.5 capitalize",
          ])}
        >
          {data.title}
        </h1>

        {/* Price */}
        <PriceTag
          price={displayPrice}
          originalPrice={displayOriginalPrice}
          size="lg"
          className="gap-x-2.5 sm:gap-x-3 mb-3 md:mb-5"
        />

        {/* Description */}
        <p className="text-sm sm:text-base text-muted-foreground mb-3 md:mb-5">
          {data.description ||
            "Quality surgical supplies for hospitals, clinics and healthcare professionals — available at wholesale B2B pricing."}
        </p>

        <hr className="h-[1px] border-t-black/10 mb-3 md:mb-5" />

        {/* Color / Variant selection — only when the variants actually name a
            colour, otherwise this is a row of blank grey circles. */}
        {variants.some((v) => v.color) && (
          <>
            <div className="flex flex-col mb-3 md:mb-5">
              <span className="text-sm sm:text-base text-muted-foreground mb-2 md:mb-3 capitalize">
                Select Color: <span className="text-foreground font-medium">{selectedVariant?.color}</span>
              </span>
              <div className="flex items-center flex-wrap gap-3">
                {variants.map((v) => {
                  const resolvedColor = getValidColor(v.color);
                  const isLightColor = resolvedColor.toLowerCase() === "#ffffff" || resolvedColor.toLowerCase() === "white" || resolvedColor.toLowerCase() === "#fff";
                  return (
                    <button
                      key={v._id}
                      type="button"
                      title={v.color}
                      onClick={() => handleVariantSelect(v)}
                      className={cn(
                        "w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all hover:opacity-75",
                        selectedVariant?._id === v._id
                          ? "border-white scale-110"
                          : "border-white/30"
                      )}
                      style={{ backgroundColor: resolvedColor }}
                    >
                      {selectedVariant?._id === v._id && (
                        <IoMdCheckmark className={cn("text-base drop-shadow", isLightColor ? "text-black" : "text-white")} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <hr className="h-[1px] border-t-black/10 mb-3 md:mb-5" />
          </>
        )}

        {/* Size selection */}
        {sizes.length > 0 && (
          <>
            <div className="flex flex-col mb-3 md:mb-5">
              <span className="text-sm sm:text-base text-muted-foreground mb-2 md:mb-4">
                Choose Size
              </span>
              <div className="flex items-center flex-wrap gap-3">
                {sizes.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={cn(
                      "bg-[#F0F0F0] px-6 py-3 text-sm rounded-full font-medium transition-all",
                      selectedSize?._id === s._id
                        ? "bg-black text-white"
                        : "text-black hover:bg-black/10"
                    )}
                  >
                    {s.size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <hr className="hidden md:block h-[1px] border-t-black/10 mb-5" />
          </>
        )}

        <AddToCardSection data={displayProduct} attributes={cartAttributes} />
      </div>
    </div>
  );
};

export default Header;
