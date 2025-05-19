import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface Member {
  id: string
  name: string
  avatar?: string
  role: "admin" | "member"
  joinDate: string
}

interface MembersListProps {
  members: Member[]
}

export default function MembersList({ members }: MembersListProps) {
  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={member.avatar || "/placeholder.svg?height=40&width=40"} alt={member.name} />
              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{member.name}</p>
                {member.role === "admin" && (
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Admin</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Joined {formatDate(member.joinDate)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
