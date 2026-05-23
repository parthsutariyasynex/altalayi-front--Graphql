import { NotificationsSkeleton, SidebarSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
      <div className="flex flex-col lg:flex-row flex-1 w-full">
        <SidebarSkeleton />
        <main className="flex-1 min-w-0 px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-10">
          <NotificationsSkeleton />
        </main>
      </div>
    </div>
  );
}
