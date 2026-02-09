import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      duration={4000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-[#1a1a1a] text-white border border-[#333] shadow-2xl font-mono text-sm rounded-none",
          title: "text-white font-bold uppercase tracking-wider text-xs",
          description: "text-neutral-400 font-mono text-xs",
          actionButton:
            "bg-white text-black hover:bg-neutral-200 rounded-none font-bold uppercase tracking-wider text-[10px] px-4 py-2",
          cancelButton:
            "bg-neutral-800 text-white hover:bg-neutral-700 rounded-none font-bold uppercase tracking-wider text-[10px] px-4 py-2",
          success: "border-l-4 border-l-green-500",
          error: "border-l-4 border-l-red-500",
          warning: "border-l-4 border-l-yellow-500",
          info: "border-l-4 border-l-blue-500",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
