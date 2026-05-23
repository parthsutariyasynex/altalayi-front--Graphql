import { ManageAccountsSkeleton, SidebarSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
      <div className="flex flex-col lg:flex-row flex-1 w-full">
        <SidebarSkeleton />
        <main className="flex-1 min-w-0">
          <ManageAccountsSkeleton />
        </main>
      </div>
    </div>
  );
}
