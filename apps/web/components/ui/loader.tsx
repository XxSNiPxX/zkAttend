import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react"; // Assuming you're using Lucide Icons

const loaderVariants = cva(
  "fixed inset-0 z-[1000] flex items-center justify-center bg-gray-800/80", // Full screen overlay with high z-index
  {
    variants: {
      variant: {
        default: "bg-gray-800/80 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Loader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & VariantProps<typeof loaderVariants>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(loaderVariants({ variant: "default" }), className)}
      {...props}
    >
      <div className="relative flex items-center">
        <Loader2 className="animate-spin h-12 w-12 text-white" /> {/* Larger spinner */}
        <span className="ml-4 text-lg text-white">Loading, proof compilation takes about 3 min, please bear with me,go grab a coffee....</span>
      </div>
    </div>
  );
});
Loader.displayName = "Loader";

export default Loader;
