"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  CreditCard,
  Banknote,
  LineChart,
  HelpCircle,
  User,
  Menu,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: "Chama Hub",
    href: "/chama-hub",
    icon: <Users className="h-5 w-5" />,
  },
  {
    name: "Savings",
    href: "/savings",
    icon: <PiggyBank className="h-5 w-5" />,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    name: "Loans",
    href: "/loans",
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    name: "Investments",
    href: "/investments",
    icon: <LineChart className="h-5 w-5" />,
  },
  {
    name: "Support",
    href: "/support",
    icon: <HelpCircle className="h-5 w-5" />,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: <User className="h-5 w-5" />,
  },
]

export default function Navbar() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)

  // Check if user is logged in (simplified for demo)
  const isLoggedIn =
    pathname !== "/" && pathname !== "/login" && pathname !== "/signup" && pathname !== "/forgot-password"

  if (!isLoggedIn) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-green-600">Pochi</span>
            <span>Yangu</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-green-600">Pochi</span>
            <span>Yangu</span>
          </Link>

          {!isMobile && (
            <nav className="flex items-center gap-1">
              {navItems.slice(0, 5).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center gap-1 px-3 text-sm font-medium rounded-md hover:bg-accent",
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {isMobile ? (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-bold text-xl">
                  <span className="text-green-600">Pochi</span>
                  <span>Yangu</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent",
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <Button variant="ghost" className="justify-start px-3 mt-4" onClick={() => setIsOpen(false)}>
                  <LogOut className="h-5 w-5 mr-3" />
                  Log out
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex items-center gap-2">
            {navItems.slice(5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-9 items-center gap-1 px-3 text-sm font-medium rounded-md hover:bg-accent",
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.name}
              </Link>
            ))}
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
