import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { GreetingCardEditor } from "@/components/greeting-card/GreetingCardEditor";

export default async function GreetingCardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { companyName: true, name: true },
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <GreetingCardEditor defaultRegardsName={user?.companyName ?? user?.name ?? ""} />
    </div>
  );
}
