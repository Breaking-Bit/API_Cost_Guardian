// ...existing imports...
import { BarChart3 } from "lucide-react"
import Link from "next/link"

// ...inside your sidebar component's JSX...
<Link href="/analytics" className="flex items-center space-x-2 px-4 py-2 hover:bg-muted rounded">
  <BarChart3 className="h-5 w-5" />
  <span>Analytics</span>
</Link>
// ...rest of sidebar...