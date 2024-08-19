import Link from "next/link";
import { useRouter } from "next/router";
import { Toaster } from "@/ui/toaster";
import cn from "@/utils/cn";
import { DollarSign, Home, Layers3, SquareGanttChart, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { ConfirmationDialog } from "../confirmation-dialog";
import MessageAlert from "../message-alert";

const NavigationLink = (props: { title: string; route: string; icon: React.ReactElement }) => {
  const router = useRouter();

  const { title, route, icon } = props;

  return (
    <Link
      href={route}
      className={cn(
        "flex w-full items-center gap-2 rounded-md py-2 pl-4 text-white hover:bg-slate-800",
        router.asPath.split("?")[0] === route && "bg-slate-800"
      )}>
      {icon}
      <span className="text-md w-full">{title}</span>
    </Link>
  );
};

const BasePage = (props: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-1">
      <div className="relative">
        <aside className="sticky left-0 top-0 flex h-screen max-h-screen w-60 flex-col overflow-y-auto overflow-x-hidden border-r border-muted bg-slate-900 px-3 dark:bg-gradient-to-tr">
          <nav className="flex h-full flex-col gap-1 py-3 lg:pt-12">
            <NavigationLink icon={<Home size={18} />} title="Dashboard" route="/" />
            <NavigationLink icon={<DollarSign size={18} />} title="Expenses" route="/expenses" />
            <NavigationLink icon={<SquareGanttChart size={18} />} title="Statement" route="/statements" />
            <NavigationLink icon={<Layers3 size={18} />} title="Category" route="/categories" />
            <div
              className={cn(
                "flex w-full items-center gap-2 rounded-md py-2 pl-4 text-white hover:bg-slate-800"
              )}
              onClick={() => signOut()}>
              <LogOut />
              <span className="text-md w-full">Logout</span>
            </div>
          </nav>
        </aside>
      </div>
      <div className="w-full py-14 pl-8 pr-32">{props.children}</div>
      <MessageAlert />
      <ConfirmationDialog />
      <Toaster />
    </div>
  );
};

export default BasePage;
