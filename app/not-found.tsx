import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="text-sm text-muted-foreground">
        The log, profile or page you were looking for doesn&apos;t exist or may
        have been removed.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Back to Musicd
      </Link>
    </main>
  );
}
