import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { WatermarkGenerator } from "@/components/watermark/WatermarkGenerator";

export default async function WatermarkPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { watermarkUrl: true },
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <WatermarkGenerator watermarkUrl={user?.watermarkUrl ?? null} />
    </div>
  );
}
