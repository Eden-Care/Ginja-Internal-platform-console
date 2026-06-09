import { Link } from "react-router-dom"

interface BreadcrumbProps {
  items: {
    label: string
    href?: string
  }[]
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <div className="mb-6 flex items-center gap-2 font-medium">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center gap-2">
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground underline decoration-1 underline-offset-4"
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 && <span className="text-gray-700">/</span>}
        </div>
      ))}
    </div>
  )
}
