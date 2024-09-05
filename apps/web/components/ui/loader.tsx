import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react"; // Assuming you're using Lucide Icons

const loaderVariants = cva(
  "fixed inset-0 z-[100] flex items-center justify-center bg-gray-800/50",
  {
    variants: {
      variant: {
        default: "bg-gray-800/50 text-white",
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
        <Loader2 className="animate-spin h-8 w-8 text-white" />
        <span className="ml-4 text-lg">Loading, please wait...</span>
      </div>
    </div>
  );
});
Loader.displayName = "Loader";

export default Loader;
