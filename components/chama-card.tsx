import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Lock, Globe, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ChamaCardProps {
  chama: {
    id: string
    name: string
    type: "private" | "public"
    memberCount: number
    maxMembers: number
    balance?: number
    description?: string
    nextContribution?: {
      amount: number
      dueDate: string
    }
  }
}

export default function ChamaCard({ chama }: ChamaCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{chama.name}</CardTitle>
          <Badge
            className={
              chama.type === "private"
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            }
          >
            {chama.type === "private" ? (
              <>
                <Lock className="mr-1 h-3 w-3" /> Private
              </>
            ) : (
              <>
                <Globe className="mr-1 h-3 w-3" /> Public
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Users className="mr-1 h-4 w-4" />
          <span>
            {chama.memberCount}/{chama.maxMembers} members
          </span>
        </div>
        {chama.description && <p className="text-sm text-muted-foreground mb-2">{chama.description}</p>}
        {chama.balance !== undefined && (
          <div className="mt-2">
            <p className="text-sm font-medium">Balance</p>
            <p className="text-xl font-bold">{formatCurrency(chama.balance, "KES")}</p>
          </div>
        )}
        {chama.nextContribution && (
          <div className="mt-2">
            <p className="text-sm font-medium">Next Contribution</p>
            <p className="text-sm">{formatCurrency(chama.nextContribution.amount, "KES")}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
          <Link href={`/chama/${chama.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
