import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Search, X, CalendarIcon, Filter, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns/format'
import { ptBR } from 'date-fns/locale'
import {
  useClientFilterStore,
  type StatusOption,
  type SortOption,
  type DateRange,
} from '@/stores/useClientFilterStore'

interface ClientFiltersProps {
  companies?: string[]
  onFiltersChange?: () => void
}

export function ClientFilters({
  companies = [],
  onFiltersChange,
}: ClientFiltersProps) {
  const {
    search,
    status,
    dateRange,
    company,
    sortBy,
    setSearch,
    setStatus,
    setDateRange,
    setCompany,
    setSortBy,
    clearFilters,
    getActiveFilterCount,
  } = useClientFilterStore()

  const [localSearch, setLocalSearch] = useState(search)
  const activeCount = getActiveFilterCount()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch)
        onFiltersChange?.()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, search, setSearch, onFiltersChange])

  const handleStatusChange = (value: StatusOption) => {
    setStatus(value)
    onFiltersChange?.()
  }

  const handleCompanyChange = (value: string) => {
    setCompany(value === 'all' ? '' : value)
    onFiltersChange?.()
  }

  const handleSortChange = (value: SortOption) => {
    setSortBy(value)
    onFiltersChange?.()
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
    onFiltersChange?.()
  }

  const handleClearFilters = () => {
    clearFilters()
    setLocalSearch('')
    onFiltersChange?.()
  }

  const formatDateRange = () => {
    if (!dateRange.from && !dateRange.to) return 'Selecionar período'
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'dd/MM/yy')} - ${format(dateRange.to, 'dd/MM/yy')}`
    }
    if (dateRange.from)
      return `A partir de ${format(dateRange.from, 'dd/MM/yy')}`
    return 'Selecionar período'
  }

  return (
    <div className="space-y-4">
      {/* Main Filter Row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
          <Input
            placeholder="BUSCAR CLIENTE..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 bg-black border-white/20 text-white placeholder:text-white/30 focus:border-white rounded-none h-10 font-mono text-xs uppercase"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSearch('')}
              className="absolute right-1 top-1 h-8 w-8 p-0 text-white/40 hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px] bg-black border-white/20 text-white rounded-none h-10 font-mono text-xs uppercase">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/20 rounded-none">
            <SelectItem
              value="all"
              className="text-white font-mono text-xs uppercase"
            >
              Todos
            </SelectItem>
            <SelectItem
              value="active"
              className="text-white font-mono text-xs uppercase"
            >
              Ativos
            </SelectItem>
            <SelectItem
              value="inactive"
              className="text-white font-mono text-xs uppercase"
            >
              Inativos
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[200px] justify-start text-left font-mono text-xs uppercase bg-black border-white/20 text-white hover:bg-white hover:text-black rounded-none h-10"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-black border-white/20 rounded-none"
            align="start"
          >
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) =>
                handleDateRangeChange({
                  from: range?.from,
                  to: range?.to,
                })
              }
              numberOfMonths={2}
              locale={ptBR}
              className="bg-black text-white"
            />
            {(dateRange.from || dateRange.to) && (
              <div className="p-2 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleDateRangeChange({ from: undefined, to: undefined })
                  }
                  className="w-full text-white/60 hover:text-white font-mono text-xs uppercase"
                >
                  Limpar datas
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Company Filter */}
        {companies.length > 0 && (
          <Select value={company || 'all'} onValueChange={handleCompanyChange}>
            <SelectTrigger className="w-[160px] bg-black border-white/20 text-white rounded-none h-10 font-mono text-xs uppercase">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/20 rounded-none max-h-[200px]">
              <SelectItem
                value="all"
                className="text-white font-mono text-xs uppercase"
              >
                Todas
              </SelectItem>
              {companies.map((c) => (
                <SelectItem
                  key={c}
                  value={c}
                  className="text-white font-mono text-xs uppercase"
                >
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort By */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[160px] bg-black border-white/20 text-white rounded-none h-10 font-mono text-xs uppercase">
            <ArrowUpDown className="mr-2 h-3 w-3" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/20 rounded-none">
            <SelectItem
              value="name_asc"
              className="text-white font-mono text-xs uppercase"
            >
              Nome A-Z
            </SelectItem>
            <SelectItem
              value="name_desc"
              className="text-white font-mono text-xs uppercase"
            >
              Nome Z-A
            </SelectItem>
            <SelectItem
              value="date_desc"
              className="text-white font-mono text-xs uppercase"
            >
              Mais recente
            </SelectItem>
            <SelectItem
              value="date_asc"
              className="text-white font-mono text-xs uppercase"
            >
              Mais antigo
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {activeCount > 0 && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="rounded-none border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600 font-mono text-xs uppercase h-10 px-4"
          >
            <X className="h-3 w-3 mr-2" />
            Limpar
            <Badge
              variant="secondary"
              className="ml-2 bg-red-900/30 text-red-400 rounded-none text-[10px]"
            >
              {activeCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Active Filters Summary (Mobile) */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 lg:hidden">
          <Filter className="h-3 w-3 text-white/40" />
          <span className="font-mono text-[10px] uppercase text-white/60">
            {activeCount}{' '}
            {activeCount === 1 ? 'filtro ativo' : 'filtros ativos'}
          </span>
        </div>
      )}
    </div>
  )
}

export default ClientFilters
