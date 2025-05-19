import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ChatSkeleton() {
  return (
    <div className="container py-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4 border-b">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full mr-3" />}
              <div>
                {i % 2 !== 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                )}
                <Skeleton className={`h-16 ${i % 2 === 0 ? "w-48" : "w-56"} rounded-lg`} />
              </div>
            </div>
          ))}
        </CardContent>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </Card>
    </div>
  )
}
