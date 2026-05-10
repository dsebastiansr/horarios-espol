import { SearchBar } from './SearchBar'
import { SubjectList } from './SubjectList'

export function SearchPanel() {
  return (
    <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">
      <SearchBar />
      <div className="w-full h-px bg-zinc-800" />
      <SubjectList />
    </div>
  )
}
