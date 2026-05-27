export function useSiteContent() {
  const { data } = useFetch<Record<string, Record<string, string>>>('/api/site-content')

  function get(group: string, key: string, fallback: string = ''): string {
    return data.value?.[group]?.[key] || fallback
  }

  return { content: data, get }
}
