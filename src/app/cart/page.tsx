"use client";

import BreadcrumbCart from "@/components/cart-page/BreadcrumbCart";
import ProductCard from "@/components/cart-page/ProductCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { FaArrowRight } from "react-icons/fa6";
import { TbBasketExclamation } from "react-icons/tb";
import React from "react";
import { RootState } from "@/lib/store";
import { useAppSelector } from "@/lib/hooks/redux";
import { cartTax, itemTax } from "@/lib/features/carts/cartsSlice";
import Link from "next/link";

// WhatsApp configuration
const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE; // Make sure to set this in .env.local
const WHATSAPP_MESSAGE = "Hi! I'd like to place an order through WhatsApp.";

export default function CartPage() {
  const { cart, totalPrice, adjustedTotalPrice } = useAppSelector(
    (state: RootState) => state.carts
  );

  // Prices everywhere else are tax-exclusive; GST is added here and here only.
  const totalTax = cartTax(cart);
  const grandTotal = adjustedTotalPrice + totalTax;

  const handleCheckout = () => {
    try {
      // Check if cart has items
      if (!cart || !cart.items || cart.items.length === 0) {
        alert("Your cart is empty !");
        return;
      }

      // Build message with all order details
      let messageText = `${WHATSAPP_MESSAGE}\n\n`;

      // Add order items details
      messageText += `📦 *Order Details:*\n`;
      messageText += `━━━━━━━━━━━━━━━━━━━━━━\n`;

      cart.items.forEach((item, index) => {
        messageText += `\n${index + 1}. *${item.name}*\n`;
        messageText += `   • Quantity: ${item.quantity}\n`;
        // Skip rather than send "N/A" — most items here have neither.
        if (item.attributes[0]) messageText += `   • Color: ${item.attributes[0]}\n`;
        if (item.attributes[1]) messageText += `   • Size: ${item.attributes[1]}\n`;
        messageText += `   • Price: ₹${Math.round(item.price * item.quantity)}\n`;
        if (item.taxRate) {
          messageText += `   • GST (${item.taxRate}%): ₹${Math.round(itemTax(item))}\n`;
        }
        // messageText += `   • Image: ${item.srcUrl}\n`;
      });

      messageText += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      messageText += `\n🧾 *Subtotal:* ₹${Math.round(adjustedTotalPrice)}\n`;
      if (totalTax > 0) {
        messageText += `🏷️ *GST:* ₹${Math.round(totalTax)}\n`;
      }
      messageText += `💰 *Order Total:* ₹${Math.round(grandTotal)}\n`;
      messageText += `📊 *Total Items:* ${cart.items.length}`;

      const message = encodeURIComponent(messageText);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${message}`;

      // Use window.location.href for more reliable navigation
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error processing checkout. Please try again.");
    }
  };

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        {cart && cart.items.length > 0 ? (
          <>
            <BreadcrumbCart />
            <h2
              className={cn([
                integralCF.className,
                "font-bold text-[32px] md:text-[40px] text-black uppercase mb-5 md:mb-6",
              ])}
            >
              your cart
            </h2>
            <div className="flex flex-col lg:flex-row space-y-5 lg:space-y-0 lg:space-x-5 items-start">
              <div className="w-full p-3.5 md:px-6 flex-col space-y-4 md:space-y-6 rounded-[20px] border border-white/10">
                {cart?.items.map((product, idx, arr) => (
                  <React.Fragment key={idx}>
                    <ProductCard data={product} />
                    {arr.length - 1 !== idx && (
                      <hr className="border-t-white/10" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="w-full lg:max-w-[505px] p-5 md:px-6 flex-col space-y-4 md:space-y-6 rounded-[20px] border border-white/10">
                <h6 className="text-xl md:text-2xl font-bold text-black">
                  Order Summary
                </h6>
                <div className="flex flex-col space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-muted-foreground">Subtotal</span>
                    <span className="md:text-xl font-bold">₹{Number(totalPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    {/* <span className="md:text-xl text-black/60">
                      Discount (-
                      {Math.round(
                        ((totalPrice - adjustedTotalPrice) / totalPrice) * 100
                      )}
                      %)
                    </span>
                    <span className="md:text-xl font-bold text-red-600">
                      -₹{Math.round(totalPrice - adjustedTotalPrice)}
                    </span> */}
                  </div>
                  <div className="flex items-center justify-between">
                    {/* <span className="md:text-xl text-black/60">
                      Delivery Fee
                    </span>
                    <span className="md:text-xl font-bold">Free</span> */}
                  </div>
                  {/* Only worth a line when something in the cart is actually
                      taxed — an unconditional "GST ₹0" reads like a bug. */}
                  {totalTax > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="md:text-xl text-muted-foreground">GST</span>
                      <span className="md:text-xl font-bold">
                        ₹{Math.round(totalTax)}
                      </span>
                    </div>
                  )}
                  <hr className="border-t-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-black">Total</span>
                    <span className="text-xl md:text-2xl font-bold">
                      ₹{Math.round(grandTotal)}
                    </span>
                  </div>
                  {totalTax > 0 && (
                    <p className="text-xs text-muted-foreground -mt-2">
                      Inclusive of GST
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleCheckout}
                  className="text-sm md:text-base font-medium bg-black rounded-full w-full py-4 h-[54px] md:h-[60px] group"
                >
                  Go to Checkout{" "}
                  <FaArrowRight className="text-xl ml-2 group-hover:translate-x-1 transition-all" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center flex-col text-muted-foreground mt-32">
            <TbBasketExclamation strokeWidth={1} className="text-6xl" />
            <span className="block mb-4">Your shopping cart is empty.</span>
            <Button className="rounded-full w-24" asChild>
              <Link href="/shop">Shop</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
