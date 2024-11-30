import Link from "next/link";
import { useRouter } from "next/router";
import { Toaster } from "@/ui/toaster";
import cn from "@/utils/cn";
import { DollarSign, Layers3, SquareGanttChart, LogOut, LayoutList, Calendar } from "lucide-react";
import { signOut } from "next-auth/react";
import { ConfirmationDialog } from "../confirmation-dialog";
import { MobileSidebar } from "../mobile-sidebar";

const NavigationLink = (props: { title: string; route: string; icon: React.ReactElement }) => {
  const router = useRouter();

  const { title, route, icon } = props;

  return (
    <Link
      href={route}
      className={cn(
        "flex w-full items-center gap-2 rounded-md py-2 pl-4 text-primary hover:bg-muted-foreground/40",
        router.asPath.split("?")[0] === route && "bg-muted-foreground/40"
      )}>
      {icon}
      <span className="w-full text-sm">{title}</span>
    </Link>
  );
};

const BasePage = (props: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-1">
      <div className="relative">
        <aside className="sticky left-0 top-0 hidden h-screen max-h-screen w-56 flex-col overflow-y-auto overflow-x-hidden border-r border-muted bg-secondary/60 px-3 dark:bg-gradient-to-tr md:flex">
          <nav className="flex h-full flex-col gap-1 py-3 lg:pt-16">
            <NavigationLink icon={<DollarSign size={16} />} title="Expenses" route="/expenses" />
            <NavigationLink icon={<Calendar size={16} />} title="Calendar" route="/calendar" />
            <NavigationLink icon={<SquareGanttChart size={16} />} title="Statement" route="/statements" />
            <NavigationLink icon={<Layers3 size={16} />} title="Category & Tag" route="/categories" />
            <NavigationLink icon={<LayoutList size={16} />} title="Task" route="/task" />
            <div
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-md py-2 pl-4 text-primary hover:bg-muted-foreground/40"
              )}
              onClick={() => signOut()}>
              <LogOut size={16} />
              <span className="w-full text-sm">Logout</span>
            </div>
          </nav>
        </aside>
      </div>
      <div className="flex w-full flex-col gap-2 overflow-x-scroll md:py-14 md:pl-8 md:pr-32">
        <header className="sticky block border-b p-4 md:hidden">
          <MobileSidebar>
            <nav className="flex h-full flex-col gap-1 py-3 pt-8">
              <NavigationLink icon={<DollarSign size={16} />} title="Expenses" route="/expenses" />
              <NavigationLink icon={<Calendar size={16} />} title="Calendar" route="/calendar" />
              <NavigationLink icon={<SquareGanttChart size={16} />} title="Statement" route="/statements" />
              <NavigationLink icon={<Layers3 size={16} />} title="Category & Tag" route="/categories" />
              <NavigationLink icon={<LayoutList size={16} />} title="Task" route="/task" />
              <div
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md py-2 pl-4 text-primary hover:bg-muted-foreground/40"
                )}
                onClick={() => signOut()}>
                <LogOut size={16} />
                <span className="w-full text-sm">Logout</span>
              </div>
            </nav>
          </MobileSidebar>
        </header>
        <main className="px-4 pt-4">{props.children}</main>
      </div>
      <ConfirmationDialog />
      <Toaster />
    </div>
  );
};

export default BasePage;
