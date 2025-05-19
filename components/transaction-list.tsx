import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  date: string
  isTest?: boolean
}

interface TransactionListProps {
  transactions: Transaction[]
  currency: string
  showAll?: boolean
}

export default function TransactionList({ transactions, currency, showAll = false }: TransactionListProps) {
  const displayTransactions = showAll ? transactions : transactions.slice(0, 5)

  if (transactions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {displayTransactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                transaction.type === "credit"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {transaction.type === "credit" ? (
                <ArrowDownLeft className="h-5 w-5" />
              ) : (
                <ArrowUpRight className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{transaction.description}</p>
                {transaction.isTest && (
                  <Badge variant="outline" className="text-xs">
                    Test
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
            </div>
          </div>
          <p
            className={`font-medium ${
              transaction.type === "credit" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {transaction.type === "credit" ? "+" : "-"}
            {formatCurrency(transaction.amount, currency)}
          </p>
        </div>
      ))}
    </div>
  )
}
