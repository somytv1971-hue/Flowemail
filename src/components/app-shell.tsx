import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Mail,
  Users,
  BarChart3,
  LogOut,
  Zap,
  Send,
  Bell,
  Megaphone,
  HelpCircle,
  Settings,
  Palette,
  UsersRound,
  AtSign,
  Image as ImageIcon,
  Smartphone,
  Gift,
  Handshake,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (path: string) => pathname.startsWith(path);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">Flowmail</span>
          </Link>

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={
                    isActive("/automation") || isActive("/autoresponder")
                      ? "text-primary"
                      : ""
                  }
                >
                  Email marketing
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[320px] gap-1 p-2">
                    <SubItem to="/automation" icon={Zap} title="Automation" desc="Workflows, messages, events" />
                    <SubItem to="/autoresponder" icon={Send} title="Autoresponder" desc="Sequential emails on triggers" />
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <NavLink to="/contacts" active={isActive("/contacts")} icon={Users}>
            Contacts
          </NavLink>
          <NavLink to="/reports" active={isActive("/reports")} icon={BarChart3}>
            Reports
          </NavLink>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                4
              </span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {user?.email?.[0]?.toUpperCase() ?? "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[420px] p-0">
                <div className="grid grid-cols-2">
                  <div className="flex flex-col items-center justify-center gap-2 border-r p-5 text-center">
                    <p className="text-sm font-semibold text-primary">
                      Hello {user?.email?.split("@")[0] ?? "there"}!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You've got{" "}
                      <span className="block text-xl font-bold text-primary">7 days</span>
                      left in your free trial but you can stay with us longer!
                    </p>
                    <Button size="sm" className="mt-1 w-full font-semibold">
                      Upgrade account
                    </Button>
                  </div>
                  <div className="p-2">
                    <ProfileItem icon={Settings} label="Manage account" />
                    <ProfileItem icon={Palette} label="Brand kit" />
                    <ProfileItem icon={UsersRound} label="Team" />
                    <ProfileItem icon={AtSign} label="Emails and domains" to="/emails-and-domains" />
                    <ProfileItem icon={ImageIcon} label="Files and images" />

                    <ProfileItem icon={Smartphone} label="Mobile apps" />
                    <ProfileItem icon={Gift} label="Refer a friend" />
                    <ProfileItem icon={Handshake} label="Affiliate program" />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={signOut}
                      className="cursor-pointer font-medium text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Log out
                    </DropdownMenuItem>
                  </div>
                </div>
                <DropdownMenuLabel className="border-t px-4 py-2 text-xs font-normal text-muted-foreground">
                  {user?.email}
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

function NavLink({
  to,
  active,
  icon: Icon,
  children,
}: {
  to: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? "text-primary" : "text-foreground hover:text-primary"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function SubItem({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent hover:text-accent-foreground"
    >
      <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to?: string;
}) {
  const content = (
    <>
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </>
  );
  if (to) {
    return (
      <DropdownMenuItem asChild className="cursor-pointer gap-2 py-2 text-sm font-medium">
        <Link to={to}>{content}</Link>
      </DropdownMenuItem>
    );
  }
  return (
    <DropdownMenuItem className="cursor-pointer gap-2 py-2 text-sm font-medium">
      {content}
    </DropdownMenuItem>
  );
}

