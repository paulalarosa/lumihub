import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: PaginationProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-black bg-white">
      <div className="flex-1 text-xs text-gray-500 font-mono">
        PAGE {currentPage} OF {Math.max(1, totalPages)}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-none border-black disabled:opacity-30 hover:bg-black hover:text-white"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-none border-black disabled:opacity-30 hover:bg-black hover:text-white"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
